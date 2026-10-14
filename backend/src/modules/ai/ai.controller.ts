import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { DynamicPricingService } from './dynamic-pricing.service';
import { RecommendationService } from './recommendation.service';
import { ParseIntentDto, AiBookingResponse } from './dto/parse-intent.dto';
import { DynamicPricingResponse } from './dto/dynamic-pricing.dto';
import {
  RecommendationQueryDto,
  RecommendationResponse,
} from './dto/recommendation.dto';

@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly dynamicPricingService: DynamicPricingService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * AI Booking Agent Intent Parsing & Seat Scoring
   * Analyzes natural language prompts (e.g., "Find me 2 VIP seats near aisle under $150")
   * and highlights optimal contiguous seats directly on the stadium Konva canvas.
   */
  @Post('parse-intent')
  @HttpCode(HttpStatus.OK)
  async parseIntent(@Body() dto: ParseIntentDto): Promise<AiBookingResponse> {
    return this.aiService.parseBookingIntent(dto.prompt, dto.eventId);
  }

  /**
   * Dynamic Surge Pricing Engine
   * Calculates real-time multiplier (1.0x to 1.5x) based on Redis booking velocity,
   * stadium capacity ratio, and countdown urgency.
   */
  @Get('dynamic-pricing/:eventId')
  async getDynamicPricing(
    @Param('eventId') eventId: string,
  ): Promise<DynamicPricingResponse> {
    return this.dynamicPricingService.calculateDynamicPricing(eventId);
  }

  /**
   * Contextual Vector Recommendations
   * Employs Gemini text-embedding-004 and pgvector cosine similarity to recommend
   * high-affinity events tailored to user booking history or wishlist.
   */
  @Get('recommendations')
  async getRecommendations(
    @Query() query: RecommendationQueryDto,
  ): Promise<RecommendationResponse> {
    return this.recommendationService.getPersonalizedRecommendations(query);
  }
}
