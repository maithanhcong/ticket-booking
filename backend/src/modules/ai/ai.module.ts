import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DynamicPricingService } from './dynamic-pricing.service';
import { RecommendationService } from './recommendation.service';

@Module({
  controllers: [AiController],
  providers: [AiService, DynamicPricingService, RecommendationService],
  exports: [AiService, DynamicPricingService, RecommendationService],
})
export class AiModule {}
