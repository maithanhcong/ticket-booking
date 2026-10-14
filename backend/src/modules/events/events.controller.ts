import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Exposes dynamic trending ranking endpoint.
   * GET /api/v1/events/trending?timeframe=week|month&category=SPORTS|KPOP|EDM|CONCERT&limit=10
   */
  @Get('trending')
  async getTrendingEvents(
    @Query('timeframe') timeframe?: 'week' | 'month',
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.eventsService.findTrending(timeframe, category, parsedLimit);
  }

  /**
   * Catalog endpoint returning all available events.
   * Default take is 100 to ensure all 50+ seeded events are displayed without truncation.
   */
  @Get()
  async getAllEvents(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('category') category?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.eventsService.findAll(parsedLimit, parsedOffset, category);
  }

  /**
   * Retrieves single event by ID or slug.
   */
  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
