export const RABBITMQ_CONSTANTS = {
  // Hold / Delay topology
  BOOKING_HOLD_EXCHANGE: 'booking.hold.exchange',
  BOOKING_HOLD_QUEUE: 'booking.hold.queue',
  BOOKING_HOLD_ROUTING_KEY: 'booking.hold',

  // Dead Letter Exchange (DLX) auto-release topology
  BOOKING_DLX_EXCHANGE: 'booking.dlx.exchange',
  BOOKING_RELEASE_QUEUE: 'booking.release.queue',
  BOOKING_RELEASE_ROUTING_KEY: 'booking.release',

  // Default TTL for holding reservations: 10 minutes = 600,000 milliseconds
  HOLD_TTL_MS: 600_000,
} as const;

export interface BookingHoldMessage {
  bookingId: string;
  bookingReference: string;
  eventId: string;
  userId: string;
  seatIds: string[];
  expiresAt: string;
}
