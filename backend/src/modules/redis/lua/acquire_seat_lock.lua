-- =============================================================================
-- ACQUIRE SEAT LOCK (ATOMIC MULTI-KEY ALL-OR-NOTHING)
-- =============================================================================
-- Description:
--   Attempts to acquire locks on all specified seat keys for an event atomically.
--   If even a single seat is already locked or booked, no keys are modified
--   and the operation fails immediately (0, conflicting_key).
--
-- Arguments:
--   KEYS: Array of seat lock keys (e.g. lock:event:<eventId>:seat:<seatId>)
--   ARGV[1]: Lock metadata payload (e.g. JSON string with userId, bookingId, timestamp)
--   ARGV[2]: Lock TTL in seconds (e.g. 600 for 10 minutes)
--
-- Returns:
--   { 1, "OK" } on success
--   { 0, conflicting_key } on collision
-- =============================================================================

local lockPayload = ARGV[1]
local ttlSeconds = tonumber(ARGV[2])

if #KEYS == 0 then
    return { 0, "EMPTY_SEAT_LIST" }
end

-- Phase 1: Verification (All-or-Nothing check)
for i = 1, #KEYS do
    local exists = redis.call('EXISTS', KEYS[i])
    if exists == 1 then
        return { 0, KEYS[i] }
    end
end

-- Phase 2: Atomic Acquisition
for i = 1, #KEYS do
    redis.call('SET', KEYS[i], lockPayload, 'EX', ttlSeconds)
end

return { 1, "OK" }
