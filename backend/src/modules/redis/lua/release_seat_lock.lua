-- =============================================================================
-- RELEASE SEAT LOCK (ATOMIC MULTI-KEY OWNERSHIP CHECK / FORCE RELEASE)
-- =============================================================================
-- Description:
--   Safely releases locks for the given seat keys.
--   Only deletes the key if its value contains the expected userId/bookingId,
--   or if ARGV[1] is explicitly "FORCE".
--
-- Arguments:
--   KEYS: Array of seat lock keys (e.g. lock:event:<eventId>:seat:<seatId>)
--   ARGV[1]: Expected holder identifier (e.g. userId) or "FORCE"
--
-- Returns:
--   Number of keys successfully deleted
-- =============================================================================

local expectedHolder = ARGV[1]
local deletedCount = 0

for i = 1, #KEYS do
    local key = KEYS[i]
    local val = redis.call('GET', key)

    if val then
        if expectedHolder == "FORCE" then
            redis.call('DEL', key)
            deletedCount = deletedCount + 1
        else
            -- Check if current value contains the expected holder ID
            -- (Supports raw string ID or JSON payload substring match)
            if string.find(val, expectedHolder, 1, true) ~= nil then
                redis.call('DEL', key)
                deletedCount = deletedCount + 1
            end
        end
    end
end

return deletedCount
