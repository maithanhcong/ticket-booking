import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PrismaService } from '../../database/prisma.service';
import {
  ExtractedBookingIntent,
  RecommendedSeatOutput,
  AiBookingResponse,
  BookingOption,
  IntentType,
  ResponseType,
  EventSummaryItem,
} from './dto/parse-intent.dto';

const CATALOG_EVENT_SUMMARIES: EventSummaryItem[] = [
  {
    id: 'f1-singapore-grand-prix-arena',
    title: 'Formula 1 Singapore Grand Prix: Concert & Trackside Arena',
    category: 'Motorsport',
    date: '18 - 20 Th09, 2026',
    venue: 'Marina Bay Street Circuit, Singapore',
    city: 'Singapore',
    minPrice: 198,
    coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    description: 'Chặng đua đêm rực lửa Marina Bay kết hợp đại nhạc hội The Padang Stage quốc tế.',
  },
  {
    id: 'coldplay-music-of-the-spheres-hanoi',
    title: 'Coldplay: Music of the Spheres World Tour',
    category: 'Concert',
    date: '15 - 16 Th11, 2026',
    venue: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    city: 'Hanoi',
    minPrice: 85,
    coverImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    description: 'Đại nhạc hội Music of the Spheres với visual vũ trụ laser và vòng tay LED đồng bộ.',
  },
  {
    id: 'historic-festival-42-lime-rock',
    title: 'Historic Festival 42 Lime Rock Park',
    category: 'Motorsport',
    date: '04 - 07 Th09, 2026',
    venue: 'Lime Rock Park, Lakeville, Connecticut',
    city: 'Lakeville',
    minPrice: 65,
    coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    description: 'Lễ hội đua xe cổ điển danh tiếng quy tụ hàng trăm siêu xe và xe đua lịch sử.',
  },
  {
    id: 'seventeen-right-here-world-tour',
    title: 'SEVENTEEN [RIGHT HERE] World Tour Singapore',
    category: 'K-Pop',
    date: '24 - 25 Th10, 2026',
    venue: 'Singapore National Stadium',
    city: 'Singapore',
    minPrice: 110,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    description: 'World tour bùng nổ của 13 thành viên SEVENTEEN với dàn dựng sân khấu 360 độ.',
  },
  {
    id: 'blackpink-born-pink-encore',
    title: 'BLACKPINK [BORN PINK] World Tour Encore Seoul',
    category: 'K-Pop',
    date: '12 - 13 Th12, 2026',
    venue: 'Gocheok Sky Dome, Seoul',
    city: 'Seoul',
    minPrice: 120,
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    description: 'Chuyến lưu diễn vòng quanh thế giới của 4 cô gái BLACKPINK với quy mô hoành tráng.',
  },
  {
    id: 'tomorrowland-winter-festival',
    title: 'Tomorrowland Winter: The Great Frost Edition',
    category: 'Festival',
    date: '21 - 28 Th03, 2026',
    venue: 'Alpe d Huez, France',
    city: 'Alpe d Huez',
    minPrice: 150,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    description: 'Đại nhạc hội EDM huyền thoại trên đỉnh núi tuyết kỳ vĩ bậc nhất thế giới.',
  },
  {
    id: 'coachella-valley-festival-pass',
    title: 'Coachella Valley Music and Arts Festival VIP Pass',
    category: 'Festival',
    date: '10 - 19 Th04, 2026',
    venue: 'Empire Polo Club, Indio, California',
    city: 'Indio',
    minPrice: 240,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    description: 'Lễ hội âm nhạc và nghệ thuật lớn nhất hành tinh với dàn Headliner đỉnh cao.',
  },
  {
    id: 'premier-league-asia-trophy-singapore',
    title: 'Premier League Asian Tour: Liverpool FC vs Arsenal FC',
    category: 'Sports',
    date: '26 Th07, 2026',
    venue: 'National Stadium, Singapore',
    city: 'Singapore',
    minPrice: 95,
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    description: 'Trận đại chiến rực lửa giữa hai thế lực bóng đá Anh Quốc ngay tại Đông Nam Á.',
  },
  {
    id: 'taylor-swift-eras-tour-tokyo',
    title: 'Taylor Swift | The Eras Tour Tokyo Dome',
    category: 'Concert',
    date: '07 - 10 Th02, 2026',
    venue: 'Tokyo Dome, Bunkyo, Tokyo',
    city: 'Tokyo',
    minPrice: 135,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    description: 'Kỷ nguyên âm nhạc bất hủ của Taylor Swift với hành trình 44 ca khúc qua mọi thời kỳ.',
  },
  {
    id: 'linkin-park-from-zero-tokyo',
    title: 'Linkin Park: From Zero World Tour',
    category: 'Concert',
    date: '15 - 16 Th04, 2026',
    venue: 'Saitama Super Arena, Tokyo',
    city: 'Tokyo',
    minPrice: 105,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    description: 'Sự trở lại lịch sử của tượng đài Rock thế giới với album và chuyến lưu diễn From Zero.',
  },
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private flashModel: GenerativeModel | null = null;
  private embeddingModel: GenerativeModel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initGemini();
  }

  private initGemini() {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey || apiKey.includes('placeholder')) {
      this.logger.warn('GEMINI_API_KEY not configured or is placeholder. Using deterministic heuristic fallback.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // High-quota model: gemini-3.1-flash-lite (15 RPM, 500 RPD, 250K TPM)
      this.flashModel = this.genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      // Embedding model for contextual vectors: gemini-embedding-001 / text-embedding-004
      this.embeddingModel = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-001',
      });

      this.logger.log('Google Generative AI SDK initialized with high-quota gemini-3.1-flash-lite (500 RPD).');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to initialize Google Generative AI: ${errorMsg}`);
    }
  }

  /**
   * Generates a strictly 1536-dimensional text embedding for semantic search and recommendations.
   * Matches PostgreSQL "vector(1536)" column constraint.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.embeddingModel && text.trim().length > 0) {
      try {
        const result = await this.embeddingModel.embedContent({
          content: { parts: [{ text }], role: 'user' },
          outputDimensionality: 1536,
        } as any);
        if (result.embedding?.values && result.embedding.values.length > 0) {
          const values = result.embedding.values;
          if (values.length === 1536) return values;
          if (values.length > 1536) return values.slice(0, 1536);
          return values.concat(new Array(1536 - values.length).fill(0));
        }
      } catch (err: unknown) {
        try {
          const result = await this.embeddingModel.embedContent(text);
          if (result.embedding?.values && result.embedding.values.length > 0) {
            const values = result.embedding.values;
            if (values.length === 1536) return values;
            if (values.length > 1536) return values.slice(0, 1536);
            return values.concat(new Array(1536 - values.length).fill(0));
          }
        } catch (fallbackErr: unknown) {
          const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          this.logger.warn(`Gemini embedding error, falling back to deterministic vector: ${errorMsg}`);
        }
      }
    }

    // Deterministic fallback vector (strictly 1536 dimensions)
    return this.generateDeterministicVector(text);
  }

  /**
   * Parses natural language booking intent and handles 2 query levels:
   * LEVEL 1: EVENT_LIST (Browse/search event categories without a specific event)
   * LEVEL 2: SEAT_OPTIONS (Specific event seat scoring & multi-option recommendations)
   */
  async parseBookingIntent(prompt: string, eventId?: string): Promise<AiBookingResponse> {
    const intent = await this.extractStructuredIntent(prompt);

    // LEVEL 1: If no specific eventId was provided AND query is asking to browse/search events by category
    if (!eventId && intent.queryLevel === 'EVENT_LIST' && !intent.eventName) {
      const matchedEvents = this.findMatchingEvents(intent.category, prompt);
      const catText = intent.category ? `thể loại ${intent.category}` : 'nổi bật';
      return {
        type: 'EVENT_LIST',
        intent,
        events: matchedEvents,
        rationale: `Tìm thấy ${matchedEvents.length} sự kiện ${catText} đang mở bán vé trên hệ thống AuraTickets.`,
      };
    }

    // LEVEL 2: Concrete Event & Seat Options
    const targetEventId =
      eventId || (await this.resolveEventIdByName(intent.eventName, intent.city)) || 'coldplay-music-of-the-spheres-hanoi';

    const { options, primaryOption } = await this.scoreAndSelectMultiOptions(targetEventId, intent);

    return {
      type: 'SEAT_OPTIONS',
      intent: { ...intent, queryLevel: 'SEAT_OPTIONS' },
      options,
      recommendedSeatIds: primaryOption.seatIds,
      recommendedSeats: primaryOption.seats,
      rationale: primaryOption.rationale,
      targetEventId,
    };
  }

  private findMatchingEvents(category: string | null, prompt: string): EventSummaryItem[] {
    const lower = prompt.toLowerCase();
    let matches = CATALOG_EVENT_SUMMARIES;

    if (category) {
      matches = matches.filter(
        (ev) => ev.category.toLowerCase() === category.toLowerCase()
      );
    } else if (lower.includes('k-pop') || lower.includes('kpop')) {
      matches = matches.filter((ev) => ev.category === 'K-Pop');
    } else if (lower.includes('motorsport') || lower.includes('đua xe') || lower.includes('f1')) {
      matches = matches.filter((ev) => ev.category === 'Motorsport');
    } else if (lower.includes('festival') || lower.includes('lễ hội')) {
      matches = matches.filter((ev) => ev.category === 'Festival');
    } else if (lower.includes('thể thao') || lower.includes('bóng đá')) {
      matches = matches.filter((ev) => ev.category === 'Sports');
    } else if (lower.includes('concert') || lower.includes('ca nhạc')) {
      matches = matches.filter((ev) => ev.category === 'Concert');
    }

    return matches.length > 0 ? matches.slice(0, 4) : CATALOG_EVENT_SUMMARIES.slice(0, 4);
  }

  /**
   * Uses Gemini 3.1 Flash-Lite with structured JSON output schema to parse booking prompt.
   */
  private async extractStructuredIntent(prompt: string): Promise<ExtractedBookingIntent> {
    const systemPrompt = `You are AuraTickets' high-precision AI Booking Agent.
Analyze the user's prompt and extract structured parameters.
Determine if user wants to browse/search event categories (LEVEL 1: "EVENT_LIST") OR wants seats/tickets for a concrete event (LEVEL 2: "SEAT_OPTIONS").

Respond strictly in JSON matching this schema:
{
  "queryLevel": "EVENT_LIST" | "SEAT_OPTIONS",
  "category": string or null (e.g. "Concert", "K-Pop", "Motorsport", "Festival", "Sports"),
  "eventName": string or null (e.g. "Coldplay", "Historic Festival 42", "F1 Singapore", "SEVENTEEN", "BLACKPINK", "Premier League"),
  "city": string or null (e.g. "Hanoi", "Singapore", "Tokyo", "Seoul"),
  "maxPrice": number or null (numeric budget ceiling in USD, e.g. 150),
  "quantity": number (default 2 if not mentioned, max 10),
  "intentType": "INQUIRY" | "BOOKING_COMMIT",
  "preferences": {
    "viewDirection": "CENTER" | "SIDE" | "BALCONY" | "ANY",
    "nearAisle": boolean
  }
}
Classification rules:
- Set queryLevel to "EVENT_LIST" if user asks generally about events, genres, or categories without naming a specific single event (e.g. "tìm concert", "sự kiện k-pop", "các giải đua xe motorsport", "festival âm nhạc", "xem bóng đá", "có sự kiện gì hot").
- Set queryLevel to "SEAT_OPTIONS" if user names a specific event (e.g. "Coldplay", "F1 Singapore", "Lime Rock", "SEVENTEEN") or requests specific seats/tickets to book.
- intentType: "BOOKING_COMMIT" if user says "chốt", "đặt ngay", "mua ngay", "lấy vé", "book now"; otherwise "INQUIRY".`;

    if (this.flashModel) {
      try {
        console.log(`[AiService] >>> Calling Google Generative AI with prompt: "${prompt}"`);
        this.logger.log(`[AiService] >>> Calling Google Generative AI with prompt: "${prompt}"`);
        const response = await this.flashModel.generateContent([
          { text: systemPrompt },
          { text: `User Prompt: "${prompt}"` },
        ]);

        const usage = response.response?.usageMetadata;
        console.log(
          `[AiService] <<< Gemini responded! Usage Metadata: promptTokens=${usage?.promptTokenCount ?? 0}, candidatesTokens=${usage?.candidatesTokenCount ?? 0}`
        );
        this.logger.log(
          `[AiService] <<< Gemini responded! Usage Metadata: promptTokens=${usage?.promptTokenCount ?? 0}, candidatesTokens=${usage?.candidatesTokenCount ?? 0}`
        );

        const rawJson = response.response.text();
        const parsed = JSON.parse(rawJson);

        const parsedIntentType: IntentType =
          parsed.intentType === 'BOOKING_COMMIT' ? 'BOOKING_COMMIT' : 'INQUIRY';

        const parsedQueryLevel: ResponseType =
          parsed.queryLevel === 'EVENT_LIST' ? 'EVENT_LIST' : 'SEAT_OPTIONS';

        return {
          queryLevel: parsedQueryLevel,
          category: parsed.category || null,
          eventName: parsed.eventName || null,
          city: parsed.city || null,
          maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
          quantity: Math.max(1, Math.min(10, Number(parsed.quantity) || 2)),
          intentType: parsedIntentType,
          preferences: {
            viewDirection: ['CENTER', 'SIDE', 'BALCONY'].includes(parsed.preferences?.viewDirection)
              ? parsed.preferences.viewDirection
              : 'ANY',
            nearAisle: Boolean(parsed.preferences?.nearAisle),
          },
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[AiService] [WARN] Gemini API call failed/skipped, falling back to local heuristic rules. Reason: ${errorMsg}`
        );
        this.logger.warn(
          `[AiService] [WARN] Gemini API call failed/skipped, falling back to local heuristic rules. Reason: ${errorMsg}`
        );
      }
    } else {
      console.warn(
        `[AiService] [WARN] Gemini API call failed/skipped, falling back to local heuristic rules. Reason: Gemini model not initialized (check GEMINI_API_KEY)`
      );
      this.logger.warn(
        `[AiService] [WARN] Gemini API call failed/skipped, falling back to local heuristic rules. Reason: Gemini model not initialized (check GEMINI_API_KEY)`
      );
    }

    // Deterministic Rule-Based Fallback
    return this.fallbackRegexParser(prompt);
  }

  /**
   * Deterministic fallback rule-based parser in case of offline/network issues.
   */
  private fallbackRegexParser(prompt: string): ExtractedBookingIntent {
    const lower = prompt.toLowerCase();

    // Check if queryLevel is EVENT_LIST
    const isCategorySearch =
      (lower.includes('concert') ||
        lower.includes('k-pop') ||
        lower.includes('kpop') ||
        lower.includes('motorsport') ||
        lower.includes('đua xe') ||
        lower.includes('festival') ||
        lower.includes('lễ hội') ||
        lower.includes('thể thao') ||
        lower.includes('bóng đá') ||
        lower.includes('sự kiện') ||
        lower.includes('danh sách')) &&
      !lower.includes('coldplay') &&
      !lower.includes('lime rock') &&
      !lower.includes('historic festival 42') &&
      !lower.includes('taylor') &&
      !lower.includes('linkin park');

    let category: string | null = null;
    if (lower.includes('k-pop') || lower.includes('kpop')) category = 'K-Pop';
    else if (lower.includes('motorsport') || lower.includes('đua xe') || lower.includes('f1')) category = 'Motorsport';
    else if (lower.includes('festival') || lower.includes('lễ hội')) category = 'Festival';
    else if (lower.includes('thể thao') || lower.includes('bóng đá')) category = 'Sports';
    else if (lower.includes('concert') || lower.includes('ca nhạc')) category = 'Concert';

    const queryLevel: ResponseType = isCategorySearch ? 'EVENT_LIST' : 'SEAT_OPTIONS';

    // Quantity
    let quantity = 2;
    const qtyMatch = lower.match(/(\d+)\s*(?:ghế|ve|vé|seats?|tickets?|passes?)/i);
    if (qtyMatch) {
      quantity = Math.max(1, Math.min(10, parseInt(qtyMatch[1], 10)));
    } else if (lower.includes('1 ') || lower.includes('một') || lower.includes('single')) {
      quantity = 1;
    } else if (lower.includes('3 ') || lower.includes('ba')) {
      quantity = 3;
    } else if (lower.includes('4 ') || lower.includes('bốn') || lower.includes('four')) {
      quantity = 4;
    }

    // Intent Type
    const commitKeywords = ['chốt', 'đặt ngay', 'mua ngay', 'lấy ', 'chốt vé', 'book now', 'buy now', 'reserve now', 'mua luôn'];
    const isCommit = commitKeywords.some((kw) => lower.includes(kw));
    const intentType: IntentType = isCommit ? 'BOOKING_COMMIT' : 'INQUIRY';

    // Max Price
    let maxPrice: number | null = null;
    const priceMatch = lower.match(/(?:dưới|duoi|under|below|less than|<\s*)\s*\$?(\d+(?:[.,]\d+)?)/i);
    if (priceMatch) {
      maxPrice = parseFloat(priceMatch[1]);
      if (maxPrice > 1000) maxPrice = maxPrice / 25000; // VND conversion
    }

    // View Direction
    let viewDirection: 'CENTER' | 'SIDE' | 'BALCONY' | 'ANY' = 'ANY';
    if (lower.includes('chính diện') || lower.includes('center') || lower.includes('trung tâm') || lower.includes('front')) {
      viewDirection = 'CENTER';
    } else if (lower.includes('cánh') || lower.includes('side') || lower.includes('wing')) {
      viewDirection = 'SIDE';
    } else if (lower.includes('tầng') || lower.includes('balcony') || lower.includes('khán đài trên')) {
      viewDirection = 'BALCONY';
    }

    // Near Aisle
    const nearAisle = lower.includes('lối đi') || lower.includes('aisle') || lower.includes('hành lang') || lower.includes('bên ngoài');

    // Event & City
    let eventName: string | null = null;
    if (lower.includes('coldplay')) eventName = 'Coldplay';
    else if (lower.includes('seventeen')) eventName = 'SEVENTEEN';
    else if (lower.includes('blackpink')) eventName = 'BLACKPINK';
    else if (lower.includes('historic festival') || lower.includes('lime rock')) eventName = 'Historic Festival 42';
    else if (lower.includes('premier league') || lower.includes('arsenal') || lower.includes('liverpool')) eventName = 'Premier League';

    let city: string | null = null;
    if (lower.includes('hà nội') || lower.includes('hanoi')) city = 'Hanoi';
    else if (lower.includes('singapore')) city = 'Singapore';
    else if (lower.includes('tokyo')) city = 'Tokyo';

    return {
      queryLevel,
      category,
      eventName,
      city,
      maxPrice,
      quantity,
      intentType,
      preferences: {
        viewDirection,
        nearAisle,
      },
    };
  }

  /**
   * Scores seats and generates Multi-Option recommendations:
   * - Option 1: VIP / Premium Choice (Prime view, aisle proximity)
   * - Option 2: Best Value Choice (Economical, contiguous seats)
   */
  private async scoreAndSelectMultiOptions(
    eventId?: string,
    intent?: ExtractedBookingIntent,
  ): Promise<{ options: BookingOption[]; primaryOption: BookingOption }> {
    const qty = intent?.quantity || 2;
    const maxPrice = intent?.maxPrice ?? null;
    const wantAisle = intent?.preferences?.nearAisle || false;
    const isBudgetSeeker = intent?.preferences?.viewDirection === 'BALCONY' || (maxPrice !== null && maxPrice <= 100);

    let dbSeats: RecommendedSeatOutput[] = [];

    if (eventId) {
      try {
        const seats = await this.prisma.seat.findMany({
          where: {
            eventId,
            status: 'AVAILABLE',
          },
          include: {
            section: true,
          },
          take: 120,
        });

        dbSeats = seats.map((s) => ({
          id: s.id,
          sectionName: s.section.name,
          row: s.row,
          seatNumber: s.seatNumber,
          price: Number(s.price),
          status: s.status,
        }));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.debug(`Could not query Prisma seats for event ${eventId}: ${errorMsg}. Using synthetic stadium seat matrix.`);
      }
    }

    if (dbSeats.length === 0) {
      dbSeats = this.generateSyntheticArenaSeats(eventId || 'evt-general');
    }

    // 1. Option 1: Premium / VIP Selection
    const vipCandidates = dbSeats.filter((s) => {
      const name = s.sectionName.toUpperCase();
      return name.includes('VIP') || name.includes('PLATINUM') || name.includes('CAT 1') || name.includes('CENTER') || s.price >= 110;
    });
    const poolA = vipCandidates.length >= qty ? vipCandidates : dbSeats;
    const seatsA = this.findBestContiguousGroup(poolA, qty, 'CENTER', true);
    const avgA = seatsA.reduce((acc, s) => acc + s.price, 0) / (seatsA.length || 1);
    const totalA = seatsA.reduce((acc, s) => acc + s.price, 0);

    const optionA: BookingOption = {
      id: 'option-premium',
      label: `Phương án 1: VIP Premium ($${Math.round(avgA)}/vé)`,
      tier: 'VIP',
      rationale: `Khu vực ${seatsA[0]?.sectionName || 'VIP Floor'}, góc nhìn chính diện sân khấu tối ưu, hàng ${seatsA[0]?.row || 'A'} ghế ${seatsA.map((s) => s.seatNumber).join(', ')}. Ưu tiên sát lối đi và âm thanh chuẩn xác.`,
      seats: seatsA,
      seatIds: seatsA.map((s) => s.id),
      totalPrice: totalA,
      averagePrice: Math.round(avgA),
      eventId: eventId || undefined,
    };

    // 2. Option 2: Best Value / Economical Selection
    const valueCandidates = dbSeats.filter((s) => {
      const name = s.sectionName.toUpperCase();
      return name.includes('BALCONY') || name.includes('LOWER WINGS') || name.includes('CAT 2') || name.includes('CAT 3') || s.price < 110;
    });
    const poolB = valueCandidates.length >= qty ? valueCandidates : dbSeats.slice().reverse();
    const seatsB = this.findBestContiguousGroup(poolB, qty, 'ANY', wantAisle);
    const avgB = seatsB.reduce((acc, s) => acc + s.price, 0) / (seatsB.length || 1);
    const totalB = seatsB.reduce((acc, s) => acc + s.price, 0);

    const savingsPercent = totalA > totalB ? Math.round(((totalA - totalB) / totalA) * 100) : 25;

    const optionB: BookingOption = {
      id: 'option-value',
      label: `Phương án 2: Tiết kiệm & Tầm nhìn tốt ($${Math.round(avgB)}/vé)`,
      tier: 'STANDARD',
      rationale: `Khu vực ${seatsB[0]?.sectionName || 'Standard Lower'}, hàng ${seatsB[0]?.row || 'G'} ghế ${seatsB.map((s) => s.seatNumber).join(', ')}. Tối ưu chi phí tiết kiệm tới ${savingsPercent}% mà vẫn giữ trọn vẹn ${qty} ghế liền kề cùng hàng.`,
      seats: seatsB,
      seatIds: seatsB.map((s) => s.id),
      totalPrice: totalB,
      averagePrice: Math.round(avgB),
      eventId: eventId || undefined,
    };

    const options = [optionA, optionB];
    const primaryOption = isBudgetSeeker ? optionB : optionA;

    return { options, primaryOption };
  }

  private findBestContiguousGroup(
    seats: RecommendedSeatOutput[],
    qty: number,
    preferredView: string,
    wantAisle: boolean,
  ): RecommendedSeatOutput[] {
    const rowGroups = new Map<string, RecommendedSeatOutput[]>();
    for (const seat of seats) {
      const key = `${seat.sectionName}__${seat.row}`;
      if (!rowGroups.has(key)) rowGroups.set(key, []);
      rowGroups.get(key)!.push(seat);
    }

    let bestGroup: RecommendedSeatOutput[] = [];
    let bestScore = -999999;

    for (const [, seatsInRow] of rowGroups) {
      seatsInRow.sort((a, b) => parseInt(a.seatNumber, 10) - parseInt(b.seatNumber, 10));
      if (seatsInRow.length < qty) continue;

      for (let i = 0; i <= seatsInRow.length - qty; i++) {
        const window = seatsInRow.slice(i, i + qty);
        let score = 100;

        let isContiguous = true;
        for (let j = 0; j < window.length - 1; j++) {
          if (parseInt(window[j + 1].seatNumber, 10) !== parseInt(window[j].seatNumber, 10) + 1) {
            isContiguous = false;
            break;
          }
        }
        if (isContiguous) score += 60;
        else score -= 30;

        const firstNum = parseInt(window[0].seatNumber, 10);
        if (wantAisle && (firstNum <= 2 || firstNum >= 16)) score += 30;

        if (score > bestScore) {
          bestScore = score;
          bestGroup = window;
        }
      }
    }

    if (bestGroup.length === 0) {
      return seats.slice(0, qty);
    }
    return bestGroup;
  }

  /**
   * Generates standard high-density stadium seating coordinates for demonstration.
   */
  private generateSyntheticArenaSeats(prefix: string): RecommendedSeatOutput[] {
    const seats: RecommendedSeatOutput[] = [];
    const sections = [
      { name: 'VIP Platinum Center', price: 145, rows: ['A', 'B', 'C'], count: 16, startX: 180, startY: 140 },
      { name: 'Cat 1 Lower Bowl', price: 120, rows: ['D', 'E', 'F'], count: 20, startX: 140, startY: 220 },
      { name: 'Cat 2 Lower Wings', price: 95, rows: ['G', 'H'], count: 18, startX: 120, startY: 300 },
      { name: 'Grand Balcony View', price: 65, rows: ['J', 'K'], count: 22, startX: 100, startY: 380 },
    ];

    for (const sec of sections) {
      for (const r of sec.rows) {
        for (let num = 1; num <= sec.count; num++) {
          seats.push({
            id: `${prefix}-${sec.name.replace(/\s+/g, '-').toLowerCase()}-${r}-${num}`,
            sectionName: sec.name,
            row: r,
            seatNumber: String(num),
            price: sec.price,
            status: 'AVAILABLE',
            x: sec.startX + num * 22,
            y: sec.startY + sec.rows.indexOf(r) * 24,
          });
        }
      }
    }
    return seats;
  }

  private async resolveEventIdByName(eventName: string | null, city: string | null): Promise<string | undefined> {
    if (!eventName && !city) return undefined;

    try {
      const condition: Record<string, unknown> = {};
      if (eventName) {
        condition.title = { contains: eventName, mode: 'insensitive' };
      }
      if (city) {
        condition.venue = { city: { contains: city, mode: 'insensitive' } };
      }

      const match = await this.prisma.event.findFirst({
        where: condition,
        select: { id: true, slug: true },
      });

      if (match?.slug) return match.slug;
      if (match?.id) return match.id;
    } catch {
      // Fall through to catalog heuristic
    }

    // Heuristic Event ID Resolution based on keywords in eventName or city
    const lower = `${eventName || ''} ${city || ''}`.toLowerCase();
    if (lower.includes('coldplay') || lower.includes('spheres') || lower.includes('chris martin')) {
      return 'coldplay-music-of-the-spheres-hanoi';
    }
    if (lower.includes('lime rock') || lower.includes('historic')) {
      return 'historic-festival-42-lime-rock';
    }
    if (lower.includes('f1') || lower.includes('formula') || lower.includes('singapore grand prix') || lower.includes('racing') || lower.includes('motorsport')) {
      return 'f1-singapore-grand-prix-arena';
    }
    if (lower.includes('seventeen')) {
      return 'seventeen-right-here-world-tour';
    }
    if (lower.includes('blackpink') || lower.includes('born pink')) {
      return 'blackpink-born-pink-encore';
    }
    if (lower.includes('tomorrowland') || lower.includes('camping') || lower.includes('rv') || lower.includes('lều')) {
      return 'tomorrowland-winter-festival';
    }
    if (lower.includes('coachella')) {
      return 'coachella-valley-festival-pass';
    }
    if (lower.includes('premier league') || lower.includes('arsenal') || lower.includes('liverpool') || lower.includes('bóng đá')) {
      return 'premier-league-asia-trophy-singapore';
    }
    if (lower.includes('taylor') || lower.includes('swift') || lower.includes('eras')) {
      return 'taylor-swift-eras-tour-tokyo';
    }
    if (lower.includes('linkin park') || lower.includes('from zero')) {
      return 'linkin-park-from-zero-tokyo';
    }

    return undefined;
  }

  private generateDeterministicVector(text: string): number[] {
    const vector: number[] = [];
    const hash = text.toLowerCase();
    for (let i = 0; i < 1536; i++) {
      const charCode = hash.charCodeAt(i % hash.length) || 42;
      const val = Math.sin((i + 1) * charCode) * 0.5;
      vector.push(Number(val.toFixed(6)));
    }
    return vector;
  }
}
