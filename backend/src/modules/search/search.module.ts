import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IntentParserService } from './intent-parser.service';
import { HybridSearchService } from './hybrid-search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [IntentParserService, HybridSearchService],
  exports: [HybridSearchService, IntentParserService],
})
export class SearchModule {}
