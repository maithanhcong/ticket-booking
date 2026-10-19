# Ticket Booking Engine - k6 Flash Sale Stress Test

This directory contains the high-concurrency k6 stress test simulating a high-demand ticket flash sale.

## Test Scenario Overview

- **Concurrency**: 3,000 Concurrent Virtual Users (VUs) ramp up rapidly to simulate flash sale gates opening.
- **Hot Inventory**: 500 Hot Event Seats under intense race condition contention.
- **Workflow**:
  1. Virtual users select 1 to 2 seats from the hot seats pool.
  2. Send idempotent seat reservation requests (`POST /api/v1/bookings/reserve`) with unique `X-Idempotency-Key` headers.
  3. Acquire atomic Redis distributed locks and create PostgreSQL transactional outbox pending bookings.
  4. Users with successful locks simulate checkout delays and finalize their bookings (`POST /api/v1/bookings/confirm`).
  5. Contending users receive HTTP 409 Conflict without data corruption or double booking.

## Invariant Guarantees Verified

- **Zero Overbooking**: Across 3,000 competing users, total `successful_locks` can never exceed 500.
- **Latency SLAs**: Request duration tracked at `p95` (< 500ms) and `p99` (< 1000ms).
- **Graceful Error Handling**: Race conditions return clean 409 Conflict responses instead of 500 Internal Server Errors.

## Prerequisites & Installation

### Windows
```powershell
# Via Winget
winget install Grafana.k6

# Or via Chocolatey
choco install k6
```

### macOS
```bash
brew install k6
```

### Linux (Debian / Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Docker
```bash
docker pull grafana/k6:latest
```

---

## Running the Stress Test

### Default Local Run (Against `http://localhost:4000`)
```bash
k6 run k6/flash_sale_test.js
```

### Custom Target URL & Event ID
```bash
k6 run -e TARGET_URL=http://localhost:4000 -e EVENT_ID=evt-cyber-symphony-2026 k6/flash_sale_test.js
```

### Via Docker
```bash
docker run --rm -i -v ${PWD}/k6:/k6 grafana/k6 run /k6/flash_sale_test.js
```

### Quick Smoke Test (Low VUs)
To verify connectivity with 50 VUs before the full 3,000 VU load:
```bash
k6 run --vus 50 --duration 10s k6/flash_sale_test.js
```

---

## Metric Reference

| Metric | Type | Description |
|---|---|---|
| `successful_locks` | Counter | Total seat lock leases granted (HTTP 201). Must be $\le$ 500. |
| `conflict_409_rejections` | Counter | Clean race condition rejections when seat is taken. |
| `successful_checkouts` | Counter | Bookings confirmed through payment. |
| `reserve_duration` | Trend | Latency distribution (p90, p95, p99) for seat locking. |
| `confirm_duration` | Trend | Latency distribution (p90, p95, p99) for payment confirmation. |
| `server_errors_5xx` | Counter | Internal server errors (must remain minimal/zero). |
