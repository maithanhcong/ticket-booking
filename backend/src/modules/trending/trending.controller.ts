import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { TrendingService, TrendingEventItem } from './trending.service';

@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  /**
   * Fetches Top Trending events based on time-decay views algorithm
   * Query Latency: < 2ms directly from Redis Sorted Sets
   * GET /trending?limit=10
   */
  @Get()
  async getTopTrending(@Query('limit') limit?: string): Promise<{
    status: string;
    algorithm: string;
    data: TrendingEventItem[];
  }> {
    const count = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    const data = await this.trendingService.getTopTrending(count);
    return {
      status: 'success',
      algorithm: 'Score = views / ((hours_since_created + 2) ^ 1.5)',
      data,
    };
  }

  /**
   * Records an event view and dynamically recalculates trending score
   * POST /trending/:id/view
   */
  @Post(':id/view')
  async recordView(@Param('id') id: string) {
    return this.trendingService.recordView(id);
  }

  /**
   * Force recalculation of all scores across events
   * POST /trending/recalculate
   */
  @Post('recalculate')
  async recalculate() {
    const updated = await this.trendingService.recalculateAllScores();
    return { status: 'success', eventsUpdated: updated };
  }
}
