import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisService } from '../../modules/redis/redis.service';

interface CachedIdempotentResponse {
  statusCode: number;
  body: any;
  cachedAt: string;
}

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  // In-flight processing lock TTL: 120 seconds
  private static readonly IN_FLIGHT_LOCK_TTL_SECONDS = 120;
  // Successful response retention TTL: 24 hours (86,400 seconds)
  private static readonly CACHE_RETENTION_TTL_SECONDS = 86_400;

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const rawHeader = req.headers['x-idempotency-key'];
    const idempotencyKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestException(
        'Missing required header: "X-Idempotency-Key". Please provide a unique key for this operation.',
      );
    }

    const redisKey = `idempotency:${idempotencyKey.trim()}`;

    // 1. Check if this key already exists
    const existingEntry = await this.redisService.get(redisKey);

    if (existingEntry) {
      if (existingEntry === 'IN_FLIGHT') {
        this.logger.warn(`Concurrent request detected for idempotency key: ${idempotencyKey}`);
        throw new ConflictException(
          'A request with this idempotency key is currently being processed. Please retry shortly.',
        );
      }

      // Existing cached response found -> Replay without re-executing business logic
      try {
        const cached: CachedIdempotentResponse = JSON.parse(existingEntry);
        this.logger.log(
          `Idempotency HIT for key: ${idempotencyKey}. Replaying status ${cached.statusCode}.`,
        );

        res.setHeader('X-Cache-Lookup', 'HIT');
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(cached.statusCode).json(cached.body);

        // Returning false stops route handler execution while response is already dispatched
        return false;
      } catch (parseError) {
        this.logger.error(`Error parsing cached idempotency record: ${parseError.message}`);
        await this.redisService.del(redisKey);
      }
    }

    // 2. Atomically acquire the IN_FLIGHT lock with NX (Not Exists)
    const acquired = await this.redisService.setNx(
      redisKey,
      'IN_FLIGHT',
      IdempotencyGuard.IN_FLIGHT_LOCK_TTL_SECONDS,
    );

    if (!acquired) {
      this.logger.warn(`Race condition collision on idempotency key: ${idempotencyKey}`);
      throw new ConflictException(
        'A request with this idempotency key is currently being processed. Please retry shortly.',
      );
    }

    // 3. Intercept response dispatch to cache successful result or clear key on failure
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseCaptured = false;

    const captureAndCache = (body: any) => {
      if (responseCaptured) return;
      responseCaptured = true;

      const statusCode = res.statusCode;

      if (statusCode >= 200 && statusCode < 300) {
        // Cache successful response for 24 hours
        const cachePayload: CachedIdempotentResponse = {
          statusCode,
          body,
          cachedAt: new Date().toISOString(),
        };

        this.redisService
          .set(
            redisKey,
            JSON.stringify(cachePayload),
            'EX',
            IdempotencyGuard.CACHE_RETENTION_TTL_SECONDS,
          )
          .catch((err) => {
            this.logger.error(`Failed to cache idempotent response: ${err.message}`);
          });
      } else {
        // Clear in-flight lock so user can correct errors and retry
        this.redisService.del(redisKey).catch((err) => {
          this.logger.error(`Failed to purge failed idempotency key: ${err.message}`);
        });
      }
    };

    res.json = function (body: any): Response {
      captureAndCache(body);
      return originalJson(body);
    };

    res.send = function (body: any): Response {
      // In case body is JSON string or object
      let parsed = body;
      try {
        if (typeof body === 'string') {
          parsed = JSON.parse(body);
        }
      } catch {
        // Keep raw if not JSON
      }
      captureAndCache(parsed);
      return originalSend(body);
    };

    return true;
  }
}
