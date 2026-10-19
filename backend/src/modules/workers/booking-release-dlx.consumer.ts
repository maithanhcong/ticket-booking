import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RABBITMQ_CONSTANTS, BookingHoldMessage } from '../rabbitmq/rabbitmq.constants';
import { PrismaService } from '../../database/prisma.service';
import { SeatReservationService } from '../seats/seat-reservation.service';
import { BookingStatus, SeatStatus } from '@prisma/client';
import { SeatingGateway } from '../websocket/seating.gateway';

@Injectable()
export class BookingReleaseDlxConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingReleaseDlxConsumer.name);
  private consumerChannel: amqp.Channel;
  private isShuttingDown = false;

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly prisma: PrismaService,
    private readonly seatReservationService: SeatReservationService,
    private readonly seatingGateway: SeatingGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startConsuming();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.consumerChannel) {
      await this.consumerChannel.close();
      this.logger.log('BookingReleaseDlxConsumer channel gracefully closed.');
    }
  }

  private retryCounts = new Map<string, number>();

  private async startConsuming(): Promise<void> {
    try {
      this.consumerChannel = await this.rabbitmqService.createConsumerChannel();

      // Ensure fairness across concurrent consumers
      await this.consumerChannel.prefetch(20);

      this.logger.log(
        `Starting DLX consumer on queue: ${RABBITMQ_CONSTANTS.BOOKING_RELEASE_QUEUE}`,
      );

      await this.consumerChannel.consume(
        RABBITMQ_CONSTANTS.BOOKING_RELEASE_QUEUE,
        async (msg) => {
          if (!msg) return;

          const msgKey = msg.properties.messageId || msg.content.toString('utf8').slice(0, 80);

          try {
            await this.handleDeadLetteredMessage(msg);
            this.retryCounts.delete(msgKey);
            this.consumerChannel.ack(msg);
          } catch (error) {
            this.logger.error(
              `Error processing DLX release message: ${error.message}`,
              error.stack,
            );

            if (!this.isShuttingDown) {
              const currentAttempts = (this.retryCounts.get(msgKey) || 0) + 1;
              this.retryCounts.set(msgKey, currentAttempts);

              const xDeath = msg.properties.headers?.['x-death'];
              let xDeathCount = 0;
              if (Array.isArray(xDeath) && xDeath.length > 0) {
                xDeathCount = Number(xDeath[0]?.count) || 0;
              }
              const totalRetries = Math.max(currentAttempts - 1, xDeathCount);

              if (totalRetries >= 3) {
                this.logger.error(
                  `🚨 [DLX Consumer] Exceeded max retry limit (${totalRetries} >= 3 retries). Dropping poison message to prevent infinite requeue loop. Error: ${error.message}`,
                );
                this.retryCounts.delete(msgKey);
                this.consumerChannel.nack(msg, false, false);
              } else {
                this.logger.warn(
                  `[DLX Consumer] Transient failure (retry attempt ${totalRetries + 1}/3). Requeueing: ${error.message}`,
                );
                this.consumerChannel.nack(msg, false, true);
              }
            }
          }
        },
        { noAck: false },
      );
    } catch (error) {
      this.logger.error(`Failed to register DLX consumer: ${error.message}`, error.stack);
    }
  }

  private async handleDeadLetteredMessage(msg: amqp.ConsumeMessage): Promise<void> {
    const rawContent = msg.content.toString('utf8');
    const message: BookingHoldMessage = JSON.parse(rawContent);

    this.logger.warn(
      `DLX Expiration Triggered: Checking bookingId=${message.bookingId}, eventId=${message.eventId}, seats=${message.seatIds.length}`,
    );

    // 1. Fetch current booking state
    const booking = await this.prisma.booking.findUnique({
      where: { id: message.bookingId },
      include: { items: true },
    });

    if (!booking) {
      this.logger.warn(`Booking ${message.bookingId} not found in database. Releasing Redis keys.`);
      await this.seatReservationService.forceReleaseSeats(message.eventId, message.seatIds);
      return;
    }

    // 2. If the customer already paid and confirmed, do NOT release
    if (booking.status === BookingStatus.CONFIRMED) {
      this.logger.log(
        `Booking ${booking.bookingReference} was already CONFIRMED. Retaining seats.`,
      );
      return;
    }

    // 3. If already cancelled, ensure Redis keys are cleaned
    if (booking.status === BookingStatus.CANCELLED) {
      this.logger.log(
        `Booking ${booking.bookingReference} is already CANCELLED. Cleaning any remnant keys.`,
      );
      await this.seatReservationService.forceReleaseSeats(message.eventId, message.seatIds);
      return;
    }

    // 4. Booking is still PENDING after 10-minute DLX timeout -> Reclaim inventory
    this.logger.warn(
      `Booking ${booking.bookingReference} EXPIRED (unpaid after TTL). Reclaiming ${message.seatIds.length} seats.`,
    );

    await this.prisma.$transaction(async (tx) => {
      // Mark booking as CANCELLED
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      // Reset seats to AVAILABLE and clear reservation locks with version increment
      await tx.seat.updateMany({
        where: {
          id: { in: message.seatIds },
          eventId: message.eventId,
        },
        data: {
          status: SeatStatus.AVAILABLE,
          lockedUntil: null,
          lockedByUserId: null,
          version: { increment: 1 },
        },
      });

      // Record in Outbox table for downstream event publication
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Booking',
          aggregateId: booking.id,
          eventType: 'booking.expired_timeout',
          payload: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            eventId: message.eventId,
            seatIds: message.seatIds,
            reason: 'PAYMENT_TTL_EXPIRED',
            releasedAt: new Date().toISOString(),
          },
        },
      });
    });

    // 5. Release locks in Redis so other customers can immediately select them
    const releasedRedisCount = await this.seatReservationService.forceReleaseSeats(
      message.eventId,
      message.seatIds,
    );

    // 6. Broadcast seat release via WebSocket to live seating attendees
    if (this.seatingGateway) {
      for (const seatId of message.seatIds) {
        this.seatingGateway.enqueueSeatUpdate(message.eventId, seatId, 'AVAILABLE');
      }
    }

    this.logger.log(
      `Successfully cancelled expired booking ${booking.bookingReference}. Released ${releasedRedisCount} Redis keys and DB seats.`,
    );
  }
}
