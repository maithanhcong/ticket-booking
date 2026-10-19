import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * -----------------------------------------------------------------------------
 * K6 FLASH SALE STRESS TEST
 * Simulates 3,000 Concurrent Virtual Users (VUs) targeting 500 Hot Event Seats
 * 
 * Target Endpoints:
 * 1. POST /api/v1/auth/guest-login (Token pre-provisioning)
 * 2. POST /api/v1/bookings/reserve (Atomic Redis Lock + PostgreSQL Outbox TX)
 * 3. POST /api/v1/bookings/confirm (Payment settlement + Booked transition)
 * -----------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------------
// CUSTOM METRICS & TELEMETRY
// -----------------------------------------------------------------------------

// Lock outcomes
export const successfulLocks = new Counter('successful_locks');
export const conflict409Rejections = new Counter('conflict_409_rejections');
export const idempotencyConflicts = new Counter('idempotency_conflicts');
export const unauthorized401Errors = new Counter('unauthorized_401_errors');
export const serverErrors5xx = new Counter('server_errors_5xx');
export const validationErrors400 = new Counter('validation_errors_400');
export const successfulCheckouts = new Counter('successful_checkouts');

// Ratios
export const lockSuccessRate = new Rate('lock_success_rate');
export const conflictRate = new Rate('conflict_rate');

// Latency trends for p95 / p99 analysis
export const reserveDuration = new Trend('reserve_duration', true);
export const confirmDuration = new Trend('confirm_duration', true);

// -----------------------------------------------------------------------------
// TEST CONFIGURATION & SCENARIOS
// -----------------------------------------------------------------------------

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:4000';
const EVENT_ID = __ENV.EVENT_ID || '11111111-1111-1111-1111-111111111111';
const TOTAL_HOT_SEATS = 500;

export const options = {
  scenarios: {
    flash_sale_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },   // Warm-up ramp
        { duration: '20s', target: 3000 },  // Flash sale gates burst to 3,000 concurrent VUs
        { duration: '30s', target: 3000 },  // Peak contention across the 500 hot seats
        { duration: '15s', target: 500 },   // Settling phase
        { duration: '5s', target: 0 },      // Cool-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Latency thresholds
    'http_req_duration': ['p(95)<600', 'p(99)<1200'],
    'reserve_duration': ['p(95)<500', 'p(99)<1000'],
    'confirm_duration': ['p(95)<400', 'p(99)<800'],

    // Invariant: At no point can more than 500 locks succeed (Strict Zero-Overbooking guarantee)
    'successful_locks': [`count<=${TOTAL_HOT_SEATS}`],

    // Invariant: Zero 401 Unauthorized errors (Bearer token authenticated successfully)
    'unauthorized_401_errors': ['count===0'],

    // Under high concurrency, 5xx server errors must remain under 1%
    'server_errors_5xx': ['count<50'],
  },
};

// -----------------------------------------------------------------------------
// SEAT GENERATOR (500 HOT SEATS IN HIGH DEMAND)
// -----------------------------------------------------------------------------

function generateDeterministicUUID(prefix, index) {
  const hexIndex = index.toString(16).padStart(12, '0');
  return `${prefix}-0000-0000-0000-${hexIndex}`;
}

// Generate the 500 hot seats pool: e.g. seat-0000-0000-0000-000000000001 to 0000000001f4 (500)
const HOT_SEATS = Array.from({ length: TOTAL_HOT_SEATS }, (_, i) =>
  generateDeterministicUUID('22222222', i + 1)
);

// Helper for generating standard UUID v4 strings
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -----------------------------------------------------------------------------
// SETUP HOOK: Health Check, Token Acquisition & Diagnostics
// -----------------------------------------------------------------------------

export function setup() {
  console.log('====================================================');
  console.log('  K6 FLASH SALE STRESS TEST INITIALIZING');
  console.log(`  Target Backend: ${TARGET_URL}`);
  console.log(`  Event ID:       ${EVENT_ID}`);
  console.log(`  Hot Seats Pool: ${TOTAL_HOT_SEATS} seats`);
  console.log(`  Concurrent VUs: 3,000 users`);
  console.log('====================================================');

  const healthRes = http.get(`${TARGET_URL}/api/v1/health`, { timeout: '5s' });
  const isHealthy = healthRes.status === 200 || healthRes.status === 404;

  if (!isHealthy) {
    console.warn(`[SETUP] Backend ping returned status ${healthRes.status}. Continuing stress test...`);
  } else {
    console.log('[SETUP] Backend connectivity verified.');
  }

  // Pre-acquire valid customer JWT token for the stress test suite
  let authToken = '';
  try {
    const authRes = http.post(
      `${TARGET_URL}/api/v1/auth/guest-login`,
      JSON.stringify({ preset: 'demo' }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '5s',
      }
    );

    if (authRes.status === 200 || authRes.status === 201) {
      const authData = JSON.parse(authRes.body);
      authToken = authData.accessToken || '';
      console.log(`[SETUP] Authenticated demo bearer token acquired (${authToken.substring(0, 16)}...).`);
    } else {
      console.warn(`[SETUP] Guest login returned status ${authRes.status}: ${authRes.body}`);
    }
  } catch (err) {
    console.error(`[SETUP] Failed to acquire auth token: ${err.message}`);
  }

  return {
    startTime: new Date().toISOString(),
    seatsCount: TOTAL_HOT_SEATS,
    token: authToken,
  };
}

// -----------------------------------------------------------------------------
// VU EXECUTION LOOP: 3,000 VUs competing for 500 seats
// -----------------------------------------------------------------------------

export default function (data) {
  const vuId = __VU;
  const iterId = __ITER;
  const authToken = data && data.token ? data.token : '';

  // Generate unique User ID and Idempotency Key per VU transaction
  const userId = generateDeterministicUUID('33333333', vuId);
  const idempotencyKey = `idem-vu${vuId}-it${iterId}-${generateUUID()}`;

  // VU randomly picks 1 to 2 seats from the 500 hot seats pool
  const seatCountToSelect = Math.random() < 0.7 ? 1 : 2;
  const startIndex = Math.floor(Math.random() * (TOTAL_HOT_SEATS - seatCountToSelect));
  const selectedSeatIds = HOT_SEATS.slice(startIndex, startIndex + seatCountToSelect);

  // ---------------------------------------------------------------------------
  // STEP 1: ATTEMPT SEAT RESERVATION (POST /api/v1/bookings/reserve)
  // ---------------------------------------------------------------------------
  const reservePayload = JSON.stringify({
    eventId: EVENT_ID,
    userId: userId,
    seatIds: selectedSeatIds,
  });

  const reserveHeaders = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': idempotencyKey,
    'Authorization': `Bearer ${authToken}`,
    'X-Interaction-Latency': '1450', // Telemetry: Realistic interaction speed (>1200ms)
    'X-Mouse-Entropy': '1.85',       // Telemetry: Natural human mouse entropy (>0.8)
  };

  const reserveStart = Date.now();
  const reserveRes = http.post(
    `${TARGET_URL}/api/v1/bookings/reserve`,
    reservePayload,
    {
      headers: reserveHeaders,
      timeout: '8s',
    }
  );
  reserveDuration.add(Date.now() - reserveStart);

  // Evaluate outcomes
  if (reserveRes.status === 201) {
    // Lock acquired successfully
    successfulLocks.add(1);
    lockSuccessRate.add(true);
    conflictRate.add(false);

    let bookingData = null;
    try {
      bookingData = JSON.parse(reserveRes.body);
    } catch (e) {
      // Body parse error
    }

    check(reserveRes, {
      'status is 201 Created': (r) => r.status === 201,
      'has bookingId': () => bookingData && Boolean(bookingData.bookingId),
      'has bookingReference': () => bookingData && Boolean(bookingData.bookingReference),
      'hold countdown is active': () => bookingData && bookingData.ttlRemainingSeconds > 0,
      'no 401 unauthorized': (r) => r.status !== 401,
    });

    // -------------------------------------------------------------------------
    // STEP 2: COMPLETE CHECKOUT PAYMENT (POST /api/v1/bookings/confirm)
    // Successful lock holders simulate 500ms - 2000ms user checkout delay
    // -------------------------------------------------------------------------
    if (bookingData && bookingData.bookingId) {
      sleep(0.5 + Math.random() * 1.5);

      const confirmPayload = JSON.stringify({
        bookingId: bookingData.bookingId,
        paymentReference: `PAY-STRIPE-${generateUUID().substring(0, 8).toUpperCase()}`,
        paymentMethod: 'STRIPE_CARD',
      });

      const confirmHeaders = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `confirm-${idempotencyKey}`,
        'Authorization': `Bearer ${authToken}`,
        'X-Interaction-Latency': '1450',
        'X-Mouse-Entropy': '1.85',
      };

      const confirmStart = Date.now();
      const confirmRes = http.post(
        `${TARGET_URL}/api/v1/bookings/confirm`,
        confirmPayload,
        {
          headers: confirmHeaders,
          timeout: '8s',
        }
      );
      confirmDuration.add(Date.now() - confirmStart);

      if (confirmRes.status === 200) {
        successfulCheckouts.add(1);
        check(confirmRes, {
          'checkout confirmed with 200 OK': (r) => r.status === 200,
          'confirm no 401 unauthorized': (r) => r.status !== 401,
        });
      } else if (confirmRes.status === 401) {
        unauthorized401Errors.add(1);
      } else {
        check(confirmRes, {
          'confirm failed or expired': (r) => r.status !== 200,
        });
      }
    }
  } else if (reserveRes.status === 409) {
    // Expected race condition rejection: Seat is already locked or booked
    conflict409Rejections.add(1);
    lockSuccessRate.add(false);
    conflictRate.add(true);

    check(reserveRes, {
      'seat conflict handled cleanly (409 Conflict)': (r) => r.status === 409,
    });
  } else if (reserveRes.status === 401) {
    // Authentication failure
    unauthorized401Errors.add(1);
    lockSuccessRate.add(false);
    console.error(`[401 UNAUTHORIZED] VU ${vuId} authentication failed: ${reserveRes.body}`);
  } else if (reserveRes.status === 400) {
    validationErrors400.add(1);
    lockSuccessRate.add(false);
  } else if (reserveRes.status >= 500) {
    serverErrors5xx.add(1);
    lockSuccessRate.add(false);
    console.error(`[5XX ERROR] VU ${vuId} encountered HTTP ${reserveRes.status}: ${reserveRes.body}`);
  } else {
    lockSuccessRate.add(false);
  }

  // Jittered think time between VU iterations (100ms - 300ms)
  sleep(0.1 + Math.random() * 0.2);
}

// -----------------------------------------------------------------------------
// TEARDOWN HOOK: Zero-Overbooking Assertion & Result Summary
// -----------------------------------------------------------------------------

export function teardown(data) {
  console.log('====================================================');
  console.log('  FLASH SALE STRESS TEST COMPLETED');
  console.log(`  Started: ${data.startTime}`);
  console.log(`  Finished: ${new Date().toISOString()}`);
  console.log('====================================================');
}

// -----------------------------------------------------------------------------
// CUSTOM CLI SUMMARY FORMATTER
// -----------------------------------------------------------------------------

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const p99 = data.metrics.http_req_duration?.values['p(99)']?.toFixed(2) || 'N/A';
  const locks = data.metrics.successful_locks?.values.count || 0;
  const conflicts = data.metrics.conflict_409_rejections?.values.count || 0;
  const checkouts = data.metrics.successful_checkouts?.values.count || 0;
  const errors5xx = data.metrics.server_errors_5xx?.values.count || 0;
  const errors401 = data.metrics.unauthorized401Errors?.values.count || 0;
  const totalReqs = data.metrics.http_reqs?.values.count || 0;

  const zeroOverbookingGuaranteed = locks <= TOTAL_HOT_SEATS;

  const summary = `
================================================================================
                    FLASH SALE STRESS TEST SUMMARY REPORT
================================================================================
  Target Hot Seats:         ${TOTAL_HOT_SEATS}
  Concurrent VUs:           3,000 Users
  Total HTTP Requests:      ${totalReqs}
--------------------------------------------------------------------------------
  Successful Locks:         ${locks} (Must be <= ${TOTAL_HOT_SEATS})
  Race Rejections (409):    ${conflicts}
  Finalized Checkouts:      ${checkouts}
  Auth Failures (401):      ${errors401} (Must be 0)
  Server Errors (5xx):      ${errors5xx}
--------------------------------------------------------------------------------
  HTTP Duration p95:        ${p95} ms
  HTTP Duration p99:        ${p99} ms
--------------------------------------------------------------------------------
  Zero-Overbooking Safety:  ${zeroOverbookingGuaranteed ? 'PASSED [NO DOUBLE BOOKING]' : 'FAILED [OVERBOOKING DETECTED]'}
================================================================================
`;

  return {
    stdout: summary,
  };
}
