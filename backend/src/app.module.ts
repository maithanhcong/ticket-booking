import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
import { SeatsModule } from './modules/seats/seats.module';
import { WorkersModule } from './modules/workers/workers.module';
import { BookingModule } from './modules/booking/booking.module';
import { SearchModule } from './modules/search/search.module';
import { TrendingModule } from './modules/trending/trending.module';
import { SeatingWebSocketModule } from './modules/websocket/seating-websocket.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    RedisModule,
    RabbitMQModule,
    SeatsModule,
    WorkersModule,
    BookingModule,
    SearchModule,
    TrendingModule,
    SeatingWebSocketModule,
    AuthModule,
    EventsModule,
    AiModule,
  ],
})
export class AppModule {}

