import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export type SeatLiveStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface SeatStatusUpdate {
  seatId: string;
  status: SeatLiveStatus;
  lockedByUserId?: string;
  updatedAt: number;
}

export interface BatchedSeatPayload {
  eventId: string;
  timestamp: number;
  count: number;
  updates: SeatStatusUpdate[];
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/seating',
})
export class SeatingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(SeatingGateway.name);

  @WebSocketServer()
  server: Server;

  // Buffer holding pending updates grouped by eventId
  private pendingUpdates = new Map<string, Map<string, SeatStatusUpdate>>();
  private flushIntervalTimer: NodeJS.Timeout;
  private readonly BATCH_INTERVAL_MS = 100; // 100ms batching flush

  afterInit(server: Server) {
    this.logger.log('Seating WebSocket Gateway initialized on namespace /seating');

    // Start 100ms high-frequency batch emission loop
    this.flushIntervalTimer = setInterval(() => {
      this.flushBatchedUpdates();
    }, this.BATCH_INTERVAL_MS);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  onModuleDestroy() {
    if (this.flushIntervalTimer) {
      clearInterval(this.flushIntervalTimer);
    }
  }

  /**
   * Client subscribes to real-time seat updates for a specific event
   */
  @SubscribeMessage('join_event')
  handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data || {};
    if (!eventId) return;

    const roomName = `event:${eventId}`;
    client.join(roomName);
    this.logger.debug(`Client ${client.id} joined room ${roomName}`);

    client.emit('joined_event', {
      eventId,
      status: 'connected',
      timestamp: Date.now(),
    });
  }

  /**
   * Client leaves event room
   */
  @SubscribeMessage('leave_event')
  handleLeaveEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    const { eventId } = data || {};
    if (!eventId) return;

    const roomName = `event:${eventId}`;
    client.leave(roomName);
    this.logger.debug(`Client ${client.id} left room ${roomName}`);
  }

  /**
   * Enqueues a seat status change into the 100ms buffer.
   * If the same seat receives multiple updates within 100ms, keeps the latest state.
   */
  enqueueSeatUpdate(
    eventId: string,
    seatId: string,
    status: SeatLiveStatus,
    lockedByUserId?: string,
  ) {
    if (!this.pendingUpdates.has(eventId)) {
      this.pendingUpdates.set(eventId, new Map<string, SeatStatusUpdate>());
    }

    const eventBuffer = this.pendingUpdates.get(eventId)!;
    eventBuffer.set(seatId, {
      seatId,
      status,
      lockedByUserId,
      updatedAt: Date.now(),
    });
  }

  /**
   * Flushes all pending updates to subscribed room clients every 100ms.
   */
  private flushBatchedUpdates() {
    if (this.pendingUpdates.size === 0) return;

    for (const [eventId, seatMap] of this.pendingUpdates.entries()) {
      if (seatMap.size === 0) continue;

      const updates = Array.from(seatMap.values());
      const payload: BatchedSeatPayload = {
        eventId,
        timestamp: Date.now(),
        count: updates.length,
        updates,
      };

      // Emit batched payload exclusively to clients watching this event
      this.server.to(`event:${eventId}`).emit('seats:batch_update', payload);

      // Clear event buffer for next 100ms window
      seatMap.clear();
    }
  }

  /**
   * Optional helper for interactive client testing/simulation
   */
  @SubscribeMessage('simulate_activity')
  handleSimulateActivity(
    @MessageBody() data: { eventId: string; seatIds: string[]; status: SeatLiveStatus },
  ) {
    const { eventId, seatIds, status } = data;
    if (!eventId || !seatIds) return;

    for (const id of seatIds) {
      this.enqueueSeatUpdate(eventId, id, status);
    }
  }
}
