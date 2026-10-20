import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { BookingHoldMessage } from '../rabbitmq/rabbitmq.constants';
import { OutboxStatus } from '@prisma/client';

@Injectable()
export class OutboxPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPollerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly pollIntervalMs = 3000; // Poll every 3 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  onModuleInit(): void {
    this.logger.log(`Starting OutboxPollerService with ${this.pollIntervalMs}ms interval...`);
    this.timer = setInterval(() => {
      this.pollOutboxEvents().catch((err) => {
        this.logger.error(`Unhandled error during outbox polling tick: ${err.message}`, err.stack);
      });
    }, this.pollIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.log('OutboxPollerService stopped.');
    }
  }

  /**
   * Periodically scans OutboxEvent table for PENDING events and publishes them to RabbitMQ.
   */
  async pollOutboxEvents(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: {
          status: OutboxStatus.PENDING,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 50,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingEvents.length} pending outbox events...`);

      for (const event of pendingEvents) {
        try {
          if (
            event.eventType === 'BOOKING_HOLD_INITIALIZED' ||
            event.eventType === 'booking.created'
          ) {
            const payload = event.payload as unknown as BookingHoldMessage;
            await this.rabbitmqService.publishBookingHold(payload);
          }

          // Mark event as COMPLETED upon successful publishing
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.COMPLETED,
              processedAt: new Date(),
            },
          });
        } catch (error: any) {
          const nextRetry = event.retryCount + 1;
          const isFailed = nextRetry >= 5;

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: isFailed ? OutboxStatus.FAILED : OutboxStatus.PENDING,
              retryCount: { increment: 1 },
              lastError: error?.message || String(error),
            },
          });

          this.logger.warn(
            `Failed to process OutboxEvent id=${event.id}, eventType=${event.eventType} (retry ${nextRetry}/5): ${error?.message}`,
          );
        }
      }
    } catch (dbError: any) {
      this.logger.error(`Database error while polling OutboxEvent: ${dbError.message}`, dbError.stack);
    } finally {
      this.isProcessing = false;
    }
  }
}
