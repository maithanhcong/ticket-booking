import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates trending/popular events based on confirmed bookings aggregation in PostgreSQL
   * with deterministic fallback score: (initialCapacity - availableSeats) * popularityMultiplier.
   * Supports timeframe=week|month and category filtering (SPORTS, KPOP, EDM, CONCERT).
   */
  async findTrending(
    timeframe?: 'week' | 'month',
    category?: string,
    limit: number = 10,
  ) {
    const take = limit && limit > 0 ? limit : 10;

    // Timeframe cutoff calculation
    const now = new Date();
    let sinceDate: Date | undefined;
    if (timeframe === 'week') {
      sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
      sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Category filter construction
    const where: any = { isPublished: true };
    if (category && category !== 'All' && category !== 'all') {
      const normalizedCat = category.trim().toUpperCase();
      let keywords: string[] = [category];

      if (normalizedCat === 'SPORTS') {
        keywords = ['Sports', 'Football', 'Soccer', 'Basketball', 'UFC', 'F1', 'Tennis', 'Championship', 'League', 'Grand Prix', 'Tournament', 'Arena'];
      } else if (normalizedCat === 'KPOP' || normalizedCat === 'K-POP') {
        keywords = ['K-Pop', 'Kpop', 'Blackpink', 'BTS', 'NewJeans', 'TWICE', 'aespa', 'Stray Kids', 'SEVENTEEN', 'Idol'];
      } else if (normalizedCat === 'EDM') {
        keywords = ['EDM', 'Electronic', 'DJ', 'Rave', 'Tomorrowland', 'Ultra', 'Dance', 'Symphony'];
      } else if (normalizedCat === 'CONCERT' || normalizedCat === 'CONCERTS') {
        keywords = ['Concert', 'Tour', 'Live', 'Music', 'Band', 'Coldplay', 'Rock', 'Pop', 'Vocal', 'Symphony'];
      }

      where.OR = keywords.flatMap((kw) => [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
      ]);
    }

    const bookingWhere: any = {
      status: BookingStatus.CONFIRMED,
    };
    if (sinceDate) {
      bookingWhere.createdAt = { gte: sinceDate };
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        venue: true,
        seats: {
          select: { price: true, status: true },
        },
        bookings: {
          where: bookingWhere,
          select: { id: true, totalAmount: true, createdAt: true },
        },
        _count: {
          select: {
            bookings: {
              where: bookingWhere,
            },
          },
        },
      },
    });

    // Score and rank each event
    const scoredEvents = events.map((ev) => {
      const confirmedBookingsCount = ev._count?.bookings || ev.bookings.length;
      const prices = ev.seats.map((s) => Number(s.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const totalSeats = ev.seats.length;
      const initialCapacity = ev.venue?.capacity || totalSeats || 500;
      const availableSeats = ev.seats.filter((s) => s.status === 'AVAILABLE').length;
      const bookedSeats = Math.max(0, totalSeats - availableSeats);

      // Deterministic popularity multiplier derived from event title
      let hash = 0;
      for (let i = 0; i < ev.title.length; i++) {
        hash = (hash * 31 + ev.title.charCodeAt(i)) % 1000;
      }
      const popularityMultiplier = 1.0 + (hash % 15) / 10; // 1.0 to 2.4

      // Deterministic fallback score using (initialCapacity - availableSeats) * popularityMultiplier
      const fallbackScore = Math.max(1, (initialCapacity - availableSeats)) * popularityMultiplier;

      // Live confirmed bookings count is heavily weighted (+150 per confirmed booking)
      const popularityScore = confirmedBookingsCount * 150 + fallbackScore;

      return {
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        startTime: ev.startTime,
        endTime: ev.endTime,
        bannerUrl: ev.bannerUrl,
        venue: ev.venue,
        minPrice,
        maxPrice,
        availableSeats,
        totalSeats,
        bookedSeats,
        initialCapacity,
        confirmedBookingsCount,
        popularityMultiplier,
        popularityScore: Math.round(popularityScore * 10) / 10,
      };
    });

    // Sort descending by popularityScore
    scoredEvents.sort((a, b) => b.popularityScore - a.popularityScore);

    // Slice to requested limit and assign rank
    const rankedEvents = scoredEvents.slice(0, take).map((ev, index) => ({
      ...ev,
      rank: index + 1,
    }));

    return {
      timeframe: timeframe || 'all-time',
      category: category || 'all',
      total: rankedEvents.length,
      events: rankedEvents,
    };
  }

  /**
   * Retrieves all published events without artificial low limits.
   * Defaults to 100 to ensure all 50+ seeded events are returned.
   */
  async findAll(limit: number = 100, offset: number = 0, category?: string) {
    const take = limit && limit > 0 ? limit : 100;
    const skip = offset && offset > 0 ? offset : 0;

    const where: any = { isPublished: true };
    if (category && category !== 'All') {
      where.OR = [
        { title: { contains: category, mode: 'insensitive' } },
        { description: { contains: category, mode: 'insensitive' } },
      ];
    }

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        take,
        skip,
        include: {
          venue: true,
          seats: {
            select: { price: true, status: true },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const formattedEvents = events.map((ev) => {
      const prices = ev.seats.map((s) => Number(s.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const availableSeats = ev.seats.filter((s) => s.status === 'AVAILABLE').length;

      return {
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        startTime: ev.startTime,
        endTime: ev.endTime,
        bannerUrl: ev.bannerUrl,
        venue: ev.venue,
        minPrice,
        maxPrice,
        availableSeats,
        totalSeats: ev.seats.length,
      };
    });

    return {
      total,
      limit: take,
      offset: skip,
      events: formattedEvents,
    };
  }

  /**
   * Retrieves a single event by UUID or slug
   */
  async findOne(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const event = await this.prisma.event.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        venue: true,
        seats: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID or slug "${idOrSlug}" not found.`);
    }

    return event;
  }
}
