import { Module } from '@nestjs/common';
import { BookingReleaseDlxConsumer } from './booking-release-dlx.consumer';
import { OutboxPollerService } from './outbox-poller.service';
import { SeatsModule } from '../seats/seats.module';
import { SeatingWebSocketModule } from '../websocket/seating-websocket.module';

@Module({
  imports: [SeatsModule, SeatingWebSocketModule],
  providers: [BookingReleaseDlxConsumer, OutboxPollerService],
  exports: [BookingReleaseDlxConsumer, OutboxPollerService],
})
export class WorkersModule {}

