import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { HybridSearchService, HybridSearchResponse } from './hybrid-search.service';
import { IntentParserService } from './intent-parser.service';
import { HybridSearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: HybridSearchService,
    private readonly intentParser: IntentParserService,
  ) {}

  /**
   * Primary Hybrid Search endpoint: Combines PostgreSQL pgvector cosine distance (<=>)
   * with metadata filtering (location, date, budget).
   * Example: /search?q=rock show under 500k in Hanoi
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(@Query() dto: HybridSearchQueryDto): Promise<HybridSearchResponse> {
    return this.searchService.search(dto);
  }

  @Get('hybrid')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchHybrid(@Query() dto: HybridSearchQueryDto): Promise<HybridSearchResponse> {
    return this.searchService.search(dto);
  }

  /**
   * Intent Extraction preview endpoint for query debugging
   * Example: /search/intent?q=rock show under 500k in Hanoi
   */
  @Get('intent')
  async parseIntent(@Query('q') q: string) {
    const intent = await this.intentParser.parseIntent(q || '');
    const { embedding, ...parsed } = intent;
    return {
      ...parsed,
      embeddingDimensions: embedding.length,
      sampleVectorSlice: embedding.slice(0, 5),
    };
  }
}
