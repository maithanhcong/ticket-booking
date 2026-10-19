import { Module } from '@nestjs/common';
import { SeatReservationService } from './seat-reservation.service';

@Module({
  providers: [SeatReservationService],
  exports: [SeatReservationService],
})
export class SeatsModule {}
