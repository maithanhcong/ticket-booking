import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IntentParserService } from './intent-parser.service';
import { HybridSearchQueryDto, ExtractedIntent } from './dto/search-query.dto';
import { Prisma } from '@prisma/client';

export interface HybridSearchResultItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  startTime: Date;
  endTime: Date;
  bannerUrl: string | null;
  venue: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  pricing: {
    minPrice: number;
    maxPrice: number;
  };
  availableSeats: number;
  semanticSimilarity: number;
  hybridScore: number;
}

export interface HybridSearchResponse {
  query: string;
  intent: Omit<ExtractedIntent, 'embedding'>;
  total: number;
  results: HybridSearchResultItem[];
}

@Injectable()
export class HybridSearchService {
  private readonly logger = new Logger(HybridSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly intentParser: IntentParserService,
  ) {}

  /**
   * Performs hybrid search combining structured SQL metadata filters
   * with PostgreSQL pgvector cosine distance (<=>).
   */
  async search(dto: HybridSearchQueryDto): Promise<HybridSearchResponse> {
    const rawQuery = dto.q || '';
    const intent = await this.intentParser.parseIntent(rawQuery);

    // Merge explicit DTO filters over parsed intent (explicit params take precedence)
    const targetCity = dto.city || intent.city;
    const targetMinPrice = dto.minPrice ?? intent.minPrice;
    const targetMaxPrice = dto.maxPrice ?? intent.maxPrice;
    const targetStartDate = dto.startDate ? new Date(dto.startDate) : intent.startDate;
    const targetEndDate = dto.endDate ? new Date(dto.endDate) : intent.endDate;
    const targetGenre = dto.genre || intent.genre;
    const limit = Math.min(dto.limit || 100, 100);
    const offset = dto.offset || 0;

    // Vector representation formatted for PostgreSQL pgvector: '[0.012, -0.045, ...]'
    const vectorString = `[${intent.embedding.join(',')}]`;

    // Build SQL condition fragments dynamically
    const conditions: Prisma.Sql[] = [Prisma.sql`e."isPublished" = true`];

    if (targetCity) {
      conditions.push(Prisma.sql`v.city ILIKE ${'%' + targetCity + '%'}`);
    }

    if (dto.country) {
      conditions.push(Prisma.sql`v.country ILIKE ${'%' + dto.country + '%'}`);
    }

    if (targetStartDate) {
      conditions.push(Prisma.sql`e."startTime" >= ${targetStartDate}`);
    }

    if (targetEndDate) {
      conditions.push(Prisma.sql`e."endTime" <= ${targetEndDate}`);
    }

    if (targetGenre) {
      conditions.push(
        Prisma.sql`(e.title ILIKE ${'%' + targetGenre + '%'} OR e.description ILIKE ${'%' + targetGenre + '%'})`,
      );
    }

    // Join conditions with AND
    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    // Having conditions for seat prices
    const havingConditions: Prisma.Sql[] = [];
    if (targetMinPrice !== undefined) {
      havingConditions.push(Prisma.sql`COALESCE(MIN(s.price), 0) >= ${targetMinPrice}`);
    }
    if (targetMaxPrice !== undefined) {
      havingConditions.push(Prisma.sql`COALESCE(MIN(s.price), 0) <= ${targetMaxPrice}`);
    }

    const havingClause =
      havingConditions.length > 0
        ? Prisma.sql`HAVING ${Prisma.join(havingConditions, ' AND ')}`
        : Prisma.empty;

    try {
      // Raw SQL query executing PostgreSQL pgvector cosine distance:
      // (1 - (e.embedding <=> vector)) produces cosine similarity score between -1 and 1
      const rawRows = await this.prisma.$queryRaw<any[]>`
        SELECT
          e.id,
          e.title,
          e.slug,
          e.description,
          e."startTime",
          e."endTime",
          e."bannerUrl",
          v.id as "venueId",
          v.name as "venueName",
          v.city as "venueCity",
          v.country as "venueCountry",
          COALESCE(MIN(s.price), 0)::float as "minPrice",
          COALESCE(MAX(s.price), 0)::float as "maxPrice",
          COUNT(CASE WHEN s.status = 'AVAILABLE' THEN 1 END)::int as "availableSeats",
          CASE
            WHEN e.embedding IS NOT NULL THEN (1 - (e.embedding <=> ${vectorString}::vector))
            ELSE 0.65
          END::float as "semanticScore",
          CASE
            WHEN e.title ILIKE ${'%' + (intent.cleanedText || rawQuery) + '%'} THEN 1.0
            WHEN e.description ILIKE ${'%' + (intent.cleanedText || rawQuery) + '%'} THEN 0.7
            ELSE 0.3
          END::float as "textScore"
        FROM "Event" e
        JOIN "Venue" v ON e."venueId" = v.id
        LEFT JOIN "Seat" s ON e.id = s."eventId"
        ${whereClause}
        GROUP BY e.id, v.id
        ${havingClause}
        ORDER BY
          ("semanticScore" * 0.6 + "textScore" * 0.4) DESC,
          e."startTime" ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const results: HybridSearchResultItem[] = rawRows.map((row) => {
        const semanticSimilarity = Math.max(0, Math.min(1, Number(row.semanticScore) || 0));
        const textScore = Number(row.textScore) || 0;
        const hybridScore = Number((semanticSimilarity * 0.6 + textScore * 0.4).toFixed(4));

        return {
          id: row.id,
          title: row.title,
          slug: row.slug,
          description: row.description,
          startTime: new Date(row.startTime),
          endTime: new Date(row.endTime),
          bannerUrl: row.bannerUrl,
          venue: {
            id: row.venueId,
            name: row.venueName,
            city: row.venueCity,
            country: row.venueCountry,
          },
          pricing: {
            minPrice: row.minPrice,
            maxPrice: row.maxPrice,
          },
          availableSeats: row.availableSeats,
          semanticSimilarity: Number(semanticSimilarity.toFixed(4)),
          hybridScore,
        };
      });

      const { embedding, ...intentWithoutEmbedding } = intent;

      return {
        query: rawQuery,
        intent: intentWithoutEmbedding,
        total: results.length,
        results,
      };
    } catch (error) {
      this.logger.error(`Hybrid search raw SQL failed: ${error.message}`, error.stack);
      // Fallback query without vector operator if vector extension is not yet initialized in DB
      return this.fallbackSearch(dto, intent, limit, offset);
    }
  }

  /**
   * Resilient fallback in case database lacks the pgvector extension.
   */
  private async fallbackSearch(
    dto: HybridSearchQueryDto,
    intent: ExtractedIntent,
    limit: number,
    offset: number,
  ): Promise<HybridSearchResponse> {
    this.logger.warn('Executing relational text fallback search...');
    const targetCity = dto.city || intent.city;
    const targetGenre = dto.genre || intent.genre;
    const targetMaxPrice = dto.maxPrice ?? intent.maxPrice;

    const events = await this.prisma.event.findMany({
      where: {
        isPublished: true,
        ...(targetCity
          ? { venue: { city: { contains: targetCity, mode: 'insensitive' } } }
          : {}),
        ...(targetGenre
          ? {
              OR: [
                { title: { contains: targetGenre, mode: 'insensitive' } },
                { description: { contains: targetGenre, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        venue: true,
        seats: {
          select: { price: true, status: true },
        },
      },
      take: limit,
      skip: offset,
    });

    const results: HybridSearchResultItem[] = events
      .filter((e) => {
        if (targetMaxPrice !== undefined && e.seats.length > 0) {
          const lowest = Math.min(...e.seats.map((s) => Number(s.price)));
          return lowest <= targetMaxPrice;
        }
        return true;
      })
      .map((e) => {
        const prices = e.seats.map((s) => Number(s.price));
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const availableSeats = e.seats.filter((s) => s.status === 'AVAILABLE').length;

        return {
          id: e.id,
          title: e.title,
          slug: e.slug,
          description: e.description,
          startTime: e.startTime,
          endTime: e.endTime,
          bannerUrl: e.bannerUrl,
          venue: {
            id: e.venue.id,
            name: e.venue.name,
            city: e.venue.city,
            country: e.venue.country,
          },
          pricing: { minPrice, maxPrice },
          availableSeats,
          semanticSimilarity: 0.75,
          hybridScore: 0.78,
        };
      });

    const { embedding, ...intentWithoutEmbedding } = intent;

    return {
      query: dto.q || '',
      intent: intentWithoutEmbedding,
      total: results.length,
      results,
    };
  }
}
