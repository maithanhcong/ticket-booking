import { Module } from '@nestjs/common';
import { BookingReleaseDlxConsumer } from './booking-release-dlx.consumer';
import { SeatsModule } from '../seats/seats.module';
import { SeatingWebSocketModule } from '../websocket/seating-websocket.module';

@Module({
  imports: [SeatsModule, SeatingWebSocketModule],
  providers: [BookingReleaseDlxConsumer],
  exports: [BookingReleaseDlxConsumer],
})
export class WorkersModule {}

