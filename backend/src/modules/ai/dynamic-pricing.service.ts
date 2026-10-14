import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { DynamicPricingResponse } from './dto/dynamic-pricing.dto';

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Calculates real-time surge pricing multiplier based on demand velocity,
   * stadium capacity ratio, and countdown urgency.
   */
  async calculateDynamicPricing(eventId: string): Promise<DynamicPricingResponse> {
    const now = Date.now();

    // 1. Fetch Capacity Ratio & Event Time from Database
    let capacityRatio = 0.45; // Default healthy baseline
    let hoursUntilEvent = 48;

    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          seats: {
            select: { status: true },
          },
        },
      });

      if (event && event.seats.length > 0) {
        const totalSeats = event.seats.length;
        const takenSeats = event.seats.filter(
          (s) => s.status === 'BOOKED' || s.status === 'LOCKED',
        ).length;
        capacityRatio = Number((takenSeats / totalSeats).toFixed(3));

        const diffMs = new Date(event.startTime).getTime() - now;
        hoursUntilEvent = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Prisma query for dynamic pricing event ${eventId}: ${errorMsg}. Using heuristic metrics.`);
    }

    // 2. Fetch Demand Velocity from Redis (Calls to reservation locks in the last 5 minutes)
    const velocityLast5Min = await this.getRecentBookingVelocity(eventId);

    // 3. Mathematical Surge Multiplier Calculation (1.0x to 1.5x)
    // - Capacity Factor: 0% -> 0.0, 100% -> +0.25x
    const capacityFactor = Math.min(1.0, capacityRatio) * 0.25;

    // - Velocity Factor: 0 calls -> 0.0, >= 50 calls/5min -> +0.15x
    const velocityFactor = Math.min(1.0, velocityLast5Min / 50) * 0.15;

    // - Urgency Factor: If within 24 hours of gate opening -> up to +0.10x
    const urgencyFactor = hoursUntilEvent <= 24 ? Math.max(0, (24 - hoursUntilEvent) / 24) * 0.1 : 0.0;

    let surgeMultiplier = 1.0 + capacityFactor + velocityFactor + urgencyFactor;
    surgeMultiplier = Math.min(1.5, Math.max(1.0, Number(surgeMultiplier.toFixed(2))));

    // 4. Categorize Demand Level & Human-Readable Alerts
    let demandLevel: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'SURGE' = 'NORMAL';
    let headline = 'Standard Tier Pricing';
    let description = 'Ample seats available at nominal face-value pricing.';

    if (surgeMultiplier >= 1.35 || capacityRatio >= 0.85) {
      demandLevel = 'SURGE';
      headline = '⚡ High Demand Surge (+35% to +50%)';
      description = `Critical capacity reached (${Math.round(capacityRatio * 100)}% booked). Dynamic surge pricing is active.`;
    } else if (surgeMultiplier >= 1.2 || capacityRatio >= 0.7) {
      demandLevel = 'HIGH';
      headline = '🔥 High Demand Warning (+20%)';
      description = `High checkout velocity with ${Math.round(capacityRatio * 100)}% stadium capacity reserved.`;
    } else if (surgeMultiplier >= 1.1 || capacityRatio >= 0.5) {
      demandLevel = 'ELEVATED';
      headline = '📈 Elevated Demand (+10%)';
      description = 'Popular event with steady booking pace. Lock your seats now.';
    } else if (capacityRatio < 0.25) {
      demandLevel = 'LOW';
      headline = 'Early Bird Access (1.0x)';
      description = 'Face-value standard admission. Optimal seat availability across all zones.';
    }

    return {
      eventId,
      baseMultiplier: 1.0,
      surgeMultiplier,
      capacityRatio,
      velocityLast5Min,
      hoursUntilEvent,
      demandLevel,
      headline,
      description,
      demandNotice: `${headline}: ${description}`,
    };
  }

  /**
   * Tracks and increments reservation attempt velocity in Redis.
   */
  async recordReservationAttempt(eventId: string): Promise<void> {
    const key = `pricing:event:${eventId}:velocity`;
    try {
      const client = this.redisService.getClient();
      const current = await client.incr(key);
      if (current === 1) {
        // Set 5-minute rolling TTL
        await client.expire(key, 300);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Could not record reservation velocity in Redis: ${errorMsg}`);
    }
  }

  private async getRecentBookingVelocity(eventId: string): Promise<number> {
    const key = `pricing:event:${eventId}:velocity`;
    try {
      const client = this.redisService.getClient();
      const val = await client.get(key);
      return val ? parseInt(val, 10) : 12; // Baseline healthy velocity
    } catch {
      return 12;
    }
  }
}
