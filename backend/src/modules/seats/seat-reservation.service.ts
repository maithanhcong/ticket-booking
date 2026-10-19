import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface SeatLockPayload {
  userId: string;
  bookingId?: string;
  status: 'LOCKED';
  lockedAt: string;
}

export interface AcquireSeatsLockResult {
  success: boolean;
  conflictingSeatId?: string;
  lockedCount: number;
}

@Injectable()
export class SeatReservationService {
  private readonly logger = new Logger(SeatReservationService.name);

  // Default TTL for temporary seat reservations: 10 minutes (600 seconds)
  public static readonly DEFAULT_LOCK_TTL_SECONDS = 600;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates standard canonical Redis key for a seat lock.
   */
  public getSeatKey(eventId: string, seatId: string): string {
    return `lock:event:${eventId}:seat:${seatId}`;
  }

  /**
   * Extracts seatId from standard Redis key.
   */
  private extractSeatId(key: string): string {
    const parts = key.split(':');
    return parts[parts.length - 1] || key;
  }

  /**
   * Atomically acquires locks on multiple seats for an event.
   * If even a single seat is already locked, the operation rolls back completely (all-or-nothing).
   *
   * @param eventId - Target event UUID
   * @param seatIds - Array of seat UUIDs to lock
   * @param userId - User UUID requesting the reservation
   * @param bookingId - Optional booking reference or ID
   * @param ttlSeconds - Lock TTL in seconds (default 600 = 10 minutes)
   */
  async acquireSeatsLock(
    eventId: string,
    seatIds: string[],
    userId: string,
    bookingId?: string,
    ttlSeconds: number = SeatReservationService.DEFAULT_LOCK_TTL_SECONDS,
  ): Promise<AcquireSeatsLockResult> {
    if (!seatIds || seatIds.length === 0) {
      throw new Error('Cannot lock an empty array of seats');
    }

    // Sort seat IDs to guarantee deterministic order and prevent distributed deadlocks
    const uniqueSortedSeatIds = Array.from(new Set(seatIds)).sort();
    const keys = uniqueSortedSeatIds.map((seatId) => this.getSeatKey(eventId, seatId));

    const payload: SeatLockPayload = {
      userId,
      bookingId,
      status: 'LOCKED',
      lockedAt: new Date().toISOString(),
    };

    const serializedPayload = JSON.stringify(payload);

    this.logger.debug(
      `Attempting to lock ${keys.length} seats for event=${eventId}, user=${userId}, ttl=${ttlSeconds}s`,
    );

    const [status, result] = await this.redisService.evalAcquireLock(
      keys,
      serializedPayload,
      ttlSeconds,
    );

    if (status === 1) {
      this.logger.log(
        `Successfully locked ${keys.length} seats for event=${eventId}, user=${userId}`,
      );
      return {
        success: true,
        lockedCount: keys.length,
      };
    }

    // Collision detected
    const conflictingSeatId = this.extractSeatId(result);
    this.logger.warn(
      `Seat lock collision detected. Conflicting key: ${result} (seatId: ${conflictingSeatId}) for user=${userId}`,
    );

    return {
      success: false,
      conflictingSeatId,
      lockedCount: 0,
    };
  }

  /**
   * Safely releases seat locks, verifying ownership by userId.
   */
  async releaseSeatsLock(eventId: string, seatIds: string[], userId: string): Promise<number> {
    if (!seatIds || seatIds.length === 0) return 0;

    const keys = seatIds.map((seatId) => this.getSeatKey(eventId, seatId));
    const releasedCount = await this.redisService.evalReleaseLock(keys, userId);

    this.logger.log(
      `Released ${releasedCount}/${keys.length} seats for event=${eventId} by user=${userId}`,
    );
    return releasedCount;
  }

  /**
   * Force releases seat locks regardless of current holder (used by DLX auto-release worker or admin cancellation).
   */
  async forceReleaseSeats(eventId: string, seatIds: string[]): Promise<number> {
    if (!seatIds || seatIds.length === 0) return 0;

    const keys = seatIds.map((seatId) => this.getSeatKey(eventId, seatId));
    const releasedCount = await this.redisService.evalReleaseLock(keys, 'FORCE');

    this.logger.warn(`Force-released ${releasedCount}/${keys.length} seats for event=${eventId}`);
    return releasedCount;
  }

  /**
   * Retrieves current lock details for a specific seat, or null if unlocked.
   */
  async getSeatLock(eventId: string, seatId: string): Promise<SeatLockPayload | null> {
    const key = this.getSeatKey(eventId, seatId);
    const data = await this.redisService.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as SeatLockPayload;
    } catch {
      return null;
    }
  }

  /**
   * Bulk inspects multiple seats lock statuses.
   */
  async getBulkSeatLocks(
    eventId: string,
    seatIds: string[],
  ): Promise<Map<string, SeatLockPayload | null>> {
    const results = new Map<string, SeatLockPayload | null>();
    if (!seatIds.length) return results;

    const pipeline = this.redisService.getClient().pipeline();
    const keys = seatIds.map((seatId) => this.getSeatKey(eventId, seatId));

    for (const key of keys) {
      pipeline.get(key);
    }

    const responses = await pipeline.exec();

    seatIds.forEach((seatId, index) => {
      const [err, val] = responses[index] || [];
      if (!err && typeof val === 'string') {
        try {
          results.set(seatId, JSON.parse(val) as SeatLockPayload);
        } catch {
          results.set(seatId, null);
        }
      } else {
        results.set(seatId, null);
      }
    });

    return results;
  }
}
