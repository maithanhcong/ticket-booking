import { Module } from '@nestjs/common';
import { SeatingGateway } from './seating.gateway';

@Module({
  providers: [SeatingGateway],
  exports: [SeatingGateway],
})
export class SeatingWebSocketModule {}
