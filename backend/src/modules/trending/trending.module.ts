import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../../database/prisma.module';
import { TrendingService } from './trending.service';
import { TrendingController } from './trending.controller';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [TrendingController],
  providers: [TrendingService],
  exports: [TrendingService],
})
export class TrendingModule {}
