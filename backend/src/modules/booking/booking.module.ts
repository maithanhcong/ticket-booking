import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { SeatsModule } from '../seats/seats.module';
import { AuthModule } from '../auth/auth.module';
import { SeatingWebSocketModule } from '../websocket/seating-websocket.module';

@Module({
  imports: [SeatsModule, AuthModule, SeatingWebSocketModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}

