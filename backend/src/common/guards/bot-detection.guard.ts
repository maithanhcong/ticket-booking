import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisService } from '../../modules/redis/redis.service';

export interface BotRiskAssessment {
  riskScore: number;
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
}

@Injectable()
export class BotDetectionGuard implements CanActivate {
  private readonly logger = new Logger(BotDetectionGuard.name);

  // Velocity threshold: max 6 reservation attempts per 10 seconds per IP
  private static readonly VELOCITY_WINDOW_SECONDS = 10;
  private static readonly VELOCITY_BURST_THRESHOLD = 6;

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const clientIp = this.extractClientIp(req);
    const latencyHeader = req.headers['x-interaction-latency'];
    const entropyHeader = req.headers['x-mouse-entropy'];

    const latencyMs = latencyHeader ? parseFloat(Array.isArray(latencyHeader) ? latencyHeader[0] : latencyHeader) : null;
    const mouseEntropy = entropyHeader ? parseFloat(Array.isArray(entropyHeader) ? entropyHeader[0] : entropyHeader) : null;

    let riskScore = 0.0;
    const reasons: string[] = [];

    // 1. Telemetry Factor: Interaction Latency (< 1200ms indicates automated script/macro)
    if (latencyMs !== null && !isNaN(latencyMs)) {
      if (latencyMs < 500) {
        riskScore += 0.50;
        reasons.push(`Superhuman interaction speed (${latencyMs}ms < 500ms)`);
      } else if (latencyMs < 1200) {
        riskScore += 0.35;
        reasons.push(`Suspiciously fast reservation latency (${latencyMs}ms < 1200ms)`);
      }
    } else {
      // Header omitted: minor suspicion if automated headless agent
      riskScore += 0.15;
      reasons.push('Missing X-Interaction-Latency telemetry header');
    }

    // 2. Telemetry Factor: Mouse Entropy (< 0.5 indicates linear programmatic/headless clicks)
    if (mouseEntropy !== null && !isNaN(mouseEntropy)) {
      if (mouseEntropy < 0.2) {
        riskScore += 0.45;
        reasons.push(`Zero/near-zero mouse trajectory entropy (${mouseEntropy.toFixed(2)})`);
      } else if (mouseEntropy < 0.8) {
        riskScore += 0.25;
        reasons.push(`Low mouse movement jitter entropy (${mouseEntropy.toFixed(2)})`);
      }
    } else {
      riskScore += 0.15;
      reasons.push('Missing X-Mouse-Entropy telemetry header');
    }

    // 3. Sliding-Window Velocity Rate-Limiting via Redis
    const rateLimitKey = `bot:velocity:${clientIp}`;
    let currentVelocity = 1;
    try {
      const count = await this.redisService.incr(rateLimitKey);
      currentVelocity = count;
      if (count === 1) {
        await this.redisService.expire(rateLimitKey, BotDetectionGuard.VELOCITY_WINDOW_SECONDS);
      }
      if (count > BotDetectionGuard.VELOCITY_BURST_THRESHOLD) {
        const excess = count - BotDetectionGuard.VELOCITY_BURST_THRESHOLD;
        const velocityRisk = Math.min(0.40, excess * 0.10);
        riskScore += velocityRisk;
        reasons.push(`High request velocity burst (${count} calls in ${BotDetectionGuard.VELOCITY_WINDOW_SECONDS}s)`);
      }
    } catch (err: unknown) {
      this.logger.debug(`Redis rate limit check error: ${err}`);
    }

    // Cap risk score at 1.0
    const finalRiskScore = Math.min(1.0, Math.max(0.0, Number(riskScore.toFixed(2))));
    const isBot = finalRiskScore >= 0.85;
    const isSuspicious = finalRiskScore >= 0.50 && !isBot;

    // Attach analysis to request context
    const assessment: BotRiskAssessment = {
      riskScore: finalRiskScore,
      isBot,
      isSuspicious,
      reasons,
    };
    (req as any).botAssessment = assessment;

    res.setHeader('X-Bot-Risk-Score', finalRiskScore.toString());

    // 4. Honeypot & Shadowban Mechanism for Confirmed Bots
    if (isBot) {
      this.logger.warn(
        `🚨 Scalper Bot Blocked [IP: ${clientIp}, Score: ${finalRiskScore}]: ${reasons.join(', ')}. Diverting to Shadowban Honeypot.`,
      );
      res.setHeader('X-Bot-Shadowban', 'true');

      // Add a brief deliberate latency to drain bot connection pools
      await new Promise((resolve) => setTimeout(resolve, 800));

      res.status(200).json({
        success: false,
        status: 'QUEUED',
        message: 'High traffic detected. Placed in priority virtual queue position #9842. Please wait.',
        retryAfter: 45,
        riskScore: finalRiskScore,
        virtualQueuePosition: 9842,
        isHoneypot: true,
      });
      return false; // Terminates execution chain: seats are not locked in Redis or DB
    }

    if (isSuspicious) {
      this.logger.log(
        `⚠️ Suspicious user activity flagged [IP: ${clientIp}, Score: ${finalRiskScore}]: ${reasons.join(', ')}`,
      );
    }

    return true;
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }
}
