import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  private acquireLockSha: string;
  private releaseLockSha: string;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || 'redis_secure_password';

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });

    this.client.on('connect', () => {
      this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.loadLuaScripts();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis connection gracefully closed.');
  }

  /**
   * Returns the underlying ioredis client instance.
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Pre-loads Lua scripts into Redis memory to obtain SHA hashes for EVALSHA execution.
   */
  private async loadLuaScripts(): Promise<void> {
    try {
      const acquireScriptPath = path.join(__dirname, 'lua', 'acquire_seat_lock.lua');
      const releaseScriptPath = path.join(__dirname, 'lua', 'release_seat_lock.lua');

      let acquireScript: string;
      let releaseScript: string;

      if (fs.existsSync(acquireScriptPath) && fs.existsSync(releaseScriptPath)) {
        acquireScript = fs.readFileSync(acquireScriptPath, 'utf8');
        releaseScript = fs.readFileSync(releaseScriptPath, 'utf8');
      } else {
        // Safe inline fallback for bundled / test environments
        acquireScript = `
          local lockPayload = ARGV[1]
          local ttlSeconds = tonumber(ARGV[2])
          if #KEYS == 0 then return { 0, "EMPTY_SEAT_LIST" } end
          for i = 1, #KEYS do
              if redis.call('EXISTS', KEYS[i]) == 1 then
                  return { 0, KEYS[i] }
              end
          end
          for i = 1, #KEYS do
              redis.call('SET', KEYS[i], lockPayload, 'EX', ttlSeconds)
          end
          return { 1, "OK" }
        `;

        releaseScript = `
          local expectedHolder = ARGV[1]
          local deletedCount = 0
          for i = 1, #KEYS do
              local key = KEYS[i]
              local val = redis.call('GET', key)
              if val then
                  if expectedHolder == "FORCE" or string.find(val, expectedHolder, 1, true) ~= nil then
                      redis.call('DEL', key)
                      deletedCount = deletedCount + 1
                  end
              end
          end
          return deletedCount
        `;
      }

      this.acquireLockSha = (await this.client.script('LOAD', acquireScript)) as string;
      this.releaseLockSha = (await this.client.script('LOAD', releaseScript)) as string;

      this.logger.log(`Lua scripts loaded. Acquire SHA: ${this.acquireLockSha.slice(0, 8)}..., Release SHA: ${this.releaseLockSha.slice(0, 8)}...`);
    } catch (error) {
      this.logger.error(`Failed to load Lua scripts into Redis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Executes the atomic seat lock acquisition script via EVALSHA.
   */
  async evalAcquireLock(keys: string[], payload: string, ttlSeconds: number): Promise<[number, string]> {
    try {
      const result = await this.client.evalsha(
        this.acquireLockSha,
        keys.length,
        ...keys,
        payload,
        ttlSeconds.toString(),
      );
      return result as [number, string];
    } catch (error) {
      // If Redis restarted and lost scripts in cache (NOSCRIPT error), reload scripts and retry once
      if (error.message && error.message.includes('NOSCRIPT')) {
        this.logger.warn('NOSCRIPT error detected. Reloading scripts and retrying...');
        await this.loadLuaScripts();
        const result = await this.client.evalsha(
          this.acquireLockSha,
          keys.length,
          ...keys,
          payload,
          ttlSeconds.toString(),
        );
        return result as [number, string];
      }
      throw error;
    }
  }

  /**
   * Executes the atomic seat lock release script via EVALSHA.
   */
  async evalReleaseLock(keys: string[], holderIdOrForce: string): Promise<number> {
    try {
      const result = await this.client.evalsha(
        this.releaseLockSha,
        keys.length,
        ...keys,
        holderIdOrForce,
      );
      return Number(result);
    } catch (error) {
      if (error.message && error.message.includes('NOSCRIPT')) {
        this.logger.warn('NOSCRIPT error detected. Reloading scripts and retrying...');
        await this.loadLuaScripts();
        const result = await this.client.evalsha(
          this.releaseLockSha,
          keys.length,
          ...keys,
          holderIdOrForce,
        );
        return Number(result);
      }
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, mode?: 'EX', duration?: number): Promise<'OK' | null> {
    if (mode && duration) {
      return this.client.set(key, value, mode, duration);
    }
    return this.client.set(key, value);
  }

  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
