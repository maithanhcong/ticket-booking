import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import Redis from 'ioredis';

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
  data?: any;
}

async function runAiScenarios() {
  console.log('===================================================================');
  console.log('🚀 AURATICKETS MULTI-MODEL AI AUTOMATED TEST SUITE');
  console.log('===================================================================\n');

  const results: TestResult[] = [];
  let app: INestApplication | null = null;
  let baseUrl = 'http://localhost:4000/api/v1';

  // 1. Check if backend is already listening on port 4000, otherwise boot local test instance
  try {
    const pingRes = await fetch(`${baseUrl}/ai/dynamic-pricing/evt-coldplay-music-spheres-2026`, { method: 'GET' });
    if (pingRes.ok) {
      console.log('✅ Connected to existing Backend on http://localhost:4000/api/v1\n');
    } else {
      throw new Error('Server not responding with 200');
    }
  } catch {
    console.log('ℹ️ Local backend not detected on 4000. Booting in-memory NestJS test instance...');
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.listen(4099);
    baseUrl = 'http://localhost:4099/api/v1';
    console.log(`✅ Test server initialized on ${baseUrl}\n`);
  }

  // Connect to Redis for setup and verification
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'redis_secure_password',
  });

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: AI Anti-Scalper & Bot Detection (Honeypot Shadowban)
    // -------------------------------------------------------------------------
    console.log('▶️ [KỊCH BẢN 1] Kiểm tra Bot Detection & Honeypot Shadowban Queue...');
    try {
      // 1a. Obtain real JWT token via guest login preset 'alex'
      const authRes = await fetch(`${baseUrl}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'alex' }),
      });
      const authData = await authRes.json();
      const token = authData.accessToken;

      if (!token) {
        throw new Error('Failed to retrieve authentication token');
      }

      // 1b. Simulate Scalper Bot Request: latency = 50ms, mouse entropy = 0.05
      const idempotencyKey = `bot-honeypot-test-${Date.now()}`;
      const botRes = await fetch(`${baseUrl}/bookings/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-idempotency-key': idempotencyKey,
          'X-Interaction-Latency': '50',
          'X-Mouse-Entropy': '0.05',
        },
        body: JSON.stringify({
          eventId: 'evt-coldplay-music-spheres-2026',
          seatIds: ['sec-vip-A-01', 'sec-vip-A-02'],
        }),
      });

      const shadowbanHeader = botRes.headers.get('x-bot-shadowban');
      const riskScoreHeader = botRes.headers.get('x-bot-risk-score');
      const botData = await botRes.json();

      const isShadowbanned =
        botData.status === 'QUEUED' &&
        botData.isHoneypot === true &&
        botData.virtualQueuePosition === 9842 &&
        Number(riskScoreHeader || botData.riskScore) >= 0.85;

      if (isShadowbanned) {
        results.push({
          scenario: 'Kịch bản 1: AI Anti-Scalper & Bot Detection',
          passed: true,
          details: `Thành công! Bot bị nhận diện (Risk Score: ${riskScoreHeader}), kích hoạt Shadowban tống vào hàng chờ ảo #${botData.virtualQueuePosition} mà không khóa ghế thật.`,
          data: { riskScore: riskScoreHeader, shadowbanHeader, response: botData },
        });
        console.log(`   ✅ PASSED: Risk Score=${riskScoreHeader} -> Diverted to Virtual Queue #9842 (Honeypot Active)`);
      } else {
        throw new Error(`Unexpected payload or bot not shadowbanned: ${JSON.stringify(botData)}`);
      }
    } catch (err: any) {
      results.push({
        scenario: 'Kịch bản 1: AI Anti-Scalper & Bot Detection',
        passed: false,
        details: `Lỗi: ${err.message}`,
      });
      console.log(`   ❌ FAILED: ${err.message}`);
    }

    // -------------------------------------------------------------------------
    // SCENARIO 2: Multi-Option Intent Parsing & Heuristic Seat Scoring
    // -------------------------------------------------------------------------
    console.log('\n▶️ [KỊCH BẢN 2] Kiểm tra Gemini Flash Multi-Option Intent Parsing...');
    try {
      const parseRes = await fetch(`${baseUrl}/ai/parse-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Tìm 2 vé VIP gần lối đi',
          eventId: 'evt-coldplay-music-spheres-2026',
        }),
      });

      const parseData = await parseRes.json();
      const hasOptions = Array.isArray(parseData.options) && parseData.options.length >= 2;
      const hasIntent = parseData.intent && parseData.intent.quantity === 2;
      const hasTiers = parseData.options?.some((o: any) => o.tier === 'VIP');

      if (hasOptions && hasIntent && hasTiers) {
        results.push({
          scenario: 'Kịch bản 2: Multi-Option Intent Parsing & Scoring',
          passed: true,
          details: `Thành công! Gemini/Heuristic trả về ${parseData.options.length} phương án: [${parseData.options.map((o: any) => o.label).join(' | ')}] với ý định ${parseData.intent.intentType}.`,
          data: { optionsCount: parseData.options.length, intent: parseData.intent },
        });
        console.log(`   ✅ PASSED: Trả về ${parseData.options.length} phương án đa dạng:`);
        parseData.options.forEach((opt: any, idx: number) => {
          console.log(`      ${idx + 1}. [${opt.tier}] ${opt.label} -> ${opt.seats.length} ghế (${opt.rationale})`);
        });
      } else {
        throw new Error(`Invalid multi-option structure: ${JSON.stringify(parseData)}`);
      }
    } catch (err: any) {
      results.push({
        scenario: 'Kịch bản 2: Multi-Option Intent Parsing & Scoring',
        passed: false,
        details: `Lỗi: ${err.message}`,
      });
      console.log(`   ❌ FAILED: ${err.message}`);
    }

    // -------------------------------------------------------------------------
    // SCENARIO 3: Dynamic Surge Pricing with Redis Demand Velocity
    // -------------------------------------------------------------------------
    console.log('\n▶️ [KỊCH BẢN 3] Kiểm tra Dynamic Pricing Engine & Redis Velocity...');
    try {
      const testEventId = 'evt-coldplay-music-spheres-2026';
      const velocityKey = `pricing:event:${testEventId}:velocity`;

      // Simulate velocity burst: 60 lock attempts in 5 minutes
      await redis.set(velocityKey, '60', 'EX', 300);

      const pricingRes = await fetch(`${baseUrl}/ai/dynamic-pricing/${testEventId}`);
      const pricingData = await pricingRes.json();

      const isSurgeActive =
        pricingData.surgeMultiplier > 1.0 &&
        pricingData.velocityLast5Min >= 60 &&
        (typeof pricingData.demandNotice === 'string' || typeof pricingData.headline === 'string');

      if (isSurgeActive) {
        results.push({
          scenario: 'Kịch bản 3: Dynamic Pricing Engine (Surge > 1.0x)',
          passed: true,
          details: `Thành công! Vận tốc đặt chỗ ${pricingData.velocityLast5Min} lượt/5m kích hoạt Surge Multiplier ${pricingData.surgeMultiplier}x.`,
          data: pricingData,
        });
        console.log(`   ✅ PASSED: Surge Multiplier = ${pricingData.surgeMultiplier}x (Velocity: ${pricingData.velocityLast5Min} locks/5m)`);
        console.log(`      Notice: "${pricingData.demandNotice}"`);
      } else {
        throw new Error(`Surge pricing not triggered: ${JSON.stringify(pricingData)}`);
      }
    } catch (err: any) {
      results.push({
        scenario: 'Kịch bản 3: Dynamic Pricing Engine',
        passed: false,
        details: `Lỗi: ${err.message}`,
      });
      console.log(`   ❌ FAILED: ${err.message}`);
    }

    // -------------------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------------------
    console.log('\n===================================================================');
    console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TỰ ĐỘNG:');
    console.log('===================================================================');
    let allPassed = true;
    for (const res of results) {
      const icon = res.passed ? '✅ [PASSED]' : '❌ [FAILED]';
      console.log(`${icon} ${res.scenario}`);
      console.log(`   ↳ ${res.details}`);
      if (!res.passed) allPassed = false;
    }
    console.log('===================================================================');
    console.log(allPassed ? '🎉 TOÀN BỘ 3 KỊCH BẢN ĐẠT CHUẨN 100% (READY FOR DEMO)' : '⚠️ CÓ KỊCH BẢN THẤT BẠI');
    console.log('===================================================================\n');
  } finally {
    await redis.quit();
    if (app) {
      await app.close();
    }
  }
}

runAiScenarios().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
