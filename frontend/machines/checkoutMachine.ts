import { setup, createMachine, assign, createActor } from 'xstate';
import { useSyncExternalStore, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// TYPES & INTERFACES
// ---------------------------------------------------------------------------

export interface SeatItem {
  id: string;
  sectionId?: string;
  sectionName?: string;
  row: string;
  seatNumber: string;
  price: number;
}

export interface CheckoutContext {
  eventId: string;
  userId: string;
  selectedSeats: SeatItem[];
  subtotal: number;
  bookingFee: number;
  facilityCharge: number;
  grandTotal: number;

  // Virtual Waiting Room
  queuePosition: number | null;
  queueEstimatedWaitSeconds: number | null;

  // Hold & Distributed Lock
  bookingId: string | null;
  bookingReference: string | null;
  expiresAt: string | null;
  ttlRemainingSeconds: number;

  // Payment State & Guards
  paymentMethod: 'card' | 'wallet';
  paymentReference: string | null;
  isSubmittingPayment: boolean;

  // Terminal & Storage Artifacts
  qrCodeDataUrl: string | null;
  errorMessage: string | null;
}

export type CheckoutEvent =
  | { type: 'SELECT_SEAT'; seat: SeatItem }
  | { type: 'DESELECT_SEAT'; seatId: string }
  | { type: 'CLEAR_SEATS' }
  | { type: 'PROCEED_TO_QUEUE' }
  | { type: 'QUEUE_UPDATE'; position: number; estimatedWaitSeconds: number }
  | { type: 'QUEUE_PASSED'; bookingId: string; bookingReference: string; expiresAt: string; ttlSeconds: number }
  | { type: 'QUEUE_REJECTED'; reason: string }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'HOLD_ACQUIRED'; bookingId: string; bookingReference: string; expiresAt: string; ttlSeconds: number }
  | { type: 'TICK'; remainingSeconds?: number }
  | { type: 'RELEASE_HOLD' }
  | { type: 'START_PAYMENT'; paymentMethod?: 'card' | 'wallet' }
  | { type: 'SUBMIT_PAYMENT' }
  | { type: 'PAYMENT_SUCCESS'; paymentReference: string; qrCodeDataUrl?: string }
  | { type: 'PAYMENT_FAILED'; error: string }
  | { type: 'EXPIRE' }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'RESTART' };

// Pricing helper constants
export const BOOKING_FEE_PER_SEAT = 6.5;
export const FACILITY_CHARGE_PER_SEAT = 3.0;

export function calculateTotals(seats: SeatItem[]) {
  const subtotal = seats.reduce((acc, s) => acc + s.price, 0);
  const bookingFee = seats.length > 0 ? seats.length * BOOKING_FEE_PER_SEAT : 0;
  const facilityCharge = seats.length > 0 ? seats.length * FACILITY_CHARGE_PER_SEAT : 0;
  const grandTotal = subtotal + bookingFee + facilityCharge;
  return { subtotal, bookingFee, facilityCharge, grandTotal };
}

// ---------------------------------------------------------------------------
// XSTATE V5 MACHINE SETUP
// ---------------------------------------------------------------------------

export const checkoutMachineSetup = setup({
  types: {
    context: {} as CheckoutContext,
    events: {} as CheckoutEvent,
  },
  guards: {
    hasSelectedSeats: ({ context }) => context.selectedSeats.length > 0,
    canSubmitPayment: ({ context }) => !context.isSubmittingPayment && context.ttlRemainingSeconds > 0,
    isHoldValid: ({ context }) => context.ttlRemainingSeconds > 0,
  },
  actions: {
    addSeat: assign({
      selectedSeats: ({ context, event }) => {
        if (event.type !== 'SELECT_SEAT') return context.selectedSeats;
        const exists = context.selectedSeats.some((s) => s.id === event.seat.id);
        const updated = exists ? context.selectedSeats : [...context.selectedSeats, event.seat];
        return updated;
      },
      subtotal: ({ context, event }) => {
        if (event.type !== 'SELECT_SEAT') return context.subtotal;
        const exists = context.selectedSeats.some((s) => s.id === event.seat.id);
        const updated = exists ? context.selectedSeats : [...context.selectedSeats, event.seat];
        return calculateTotals(updated).subtotal;
      },
      bookingFee: ({ context, event }) => {
        if (event.type !== 'SELECT_SEAT') return context.bookingFee;
        const exists = context.selectedSeats.some((s) => s.id === event.seat.id);
        const updated = exists ? context.selectedSeats : [...context.selectedSeats, event.seat];
        return calculateTotals(updated).bookingFee;
      },
      facilityCharge: ({ context, event }) => {
        if (event.type !== 'SELECT_SEAT') return context.facilityCharge;
        const exists = context.selectedSeats.some((s) => s.id === event.seat.id);
        const updated = exists ? context.selectedSeats : [...context.selectedSeats, event.seat];
        return calculateTotals(updated).facilityCharge;
      },
      grandTotal: ({ context, event }) => {
        if (event.type !== 'SELECT_SEAT') return context.grandTotal;
        const exists = context.selectedSeats.some((s) => s.id === event.seat.id);
        const updated = exists ? context.selectedSeats : [...context.selectedSeats, event.seat];
        return calculateTotals(updated).grandTotal;
      },
      errorMessage: () => null,
    }),

    removeSeat: assign({
      selectedSeats: ({ context, event }) => {
        if (event.type !== 'DESELECT_SEAT') return context.selectedSeats;
        return context.selectedSeats.filter((s) => s.id !== event.seatId);
      },
      subtotal: ({ context, event }) => {
        if (event.type !== 'DESELECT_SEAT') return context.subtotal;
        const updated = context.selectedSeats.filter((s) => s.id !== event.seatId);
        return calculateTotals(updated).subtotal;
      },
      bookingFee: ({ context, event }) => {
        if (event.type !== 'DESELECT_SEAT') return context.bookingFee;
        const updated = context.selectedSeats.filter((s) => s.id !== event.seatId);
        return calculateTotals(updated).bookingFee;
      },
      facilityCharge: ({ context, event }) => {
        if (event.type !== 'DESELECT_SEAT') return context.facilityCharge;
        const updated = context.selectedSeats.filter((s) => s.id !== event.seatId);
        return calculateTotals(updated).facilityCharge;
      },
      grandTotal: ({ context, event }) => {
        if (event.type !== 'DESELECT_SEAT') return context.grandTotal;
        const updated = context.selectedSeats.filter((s) => s.id !== event.seatId);
        return calculateTotals(updated).grandTotal;
      },
    }),

    clearAllSeats: assign({
      selectedSeats: () => [],
      subtotal: () => 0,
      bookingFee: () => 0,
      facilityCharge: () => 0,
      grandTotal: () => 0,
      errorMessage: () => null,
    }),

    updateQueueState: assign({
      queuePosition: ({ event }) => (event.type === 'QUEUE_UPDATE' ? event.position : null),
      queueEstimatedWaitSeconds: ({ event }) =>
        event.type === 'QUEUE_UPDATE' ? event.estimatedWaitSeconds : null,
    }),

    setHoldInfo: assign({
      bookingId: ({ event }) =>
        event.type === 'HOLD_ACQUIRED' || event.type === 'QUEUE_PASSED' ? event.bookingId : null,
      bookingReference: ({ event }) =>
        event.type === 'HOLD_ACQUIRED' || event.type === 'QUEUE_PASSED' ? event.bookingReference : null,
      expiresAt: ({ event }) =>
        event.type === 'HOLD_ACQUIRED' || event.type === 'QUEUE_PASSED' ? event.expiresAt : null,
      ttlRemainingSeconds: ({ event }) =>
        event.type === 'HOLD_ACQUIRED' || event.type === 'QUEUE_PASSED' ? event.ttlSeconds : 600,
      queuePosition: () => null,
      queueEstimatedWaitSeconds: () => null,
      errorMessage: () => null,
    }),

    decrementTimer: assign({
      ttlRemainingSeconds: ({ context, event }) => {
        if (event.type === 'TICK' && event.remainingSeconds !== undefined) {
          return Math.max(0, event.remainingSeconds);
        }
        return Math.max(0, context.ttlRemainingSeconds - 1);
      },
    }),

    setPaymentMethod: assign({
      paymentMethod: ({ event }) =>
        event.type === 'START_PAYMENT' && event.paymentMethod ? event.paymentMethod : 'card',
      errorMessage: () => null,
    }),

    markPaymentSubmitting: assign({
      isSubmittingPayment: () => true,
      errorMessage: () => null,
    }),

    handlePaymentSuccess: assign({
      isSubmittingPayment: () => false,
      paymentReference: ({ event }) =>
        event.type === 'PAYMENT_SUCCESS' ? event.paymentReference : null,
      qrCodeDataUrl: ({ event }) =>
        event.type === 'PAYMENT_SUCCESS' ? event.qrCodeDataUrl || null : null,
      errorMessage: () => null,
    }),

    handlePaymentFailure: assign({
      isSubmittingPayment: () => false,
      errorMessage: ({ event }) =>
        event.type === 'PAYMENT_FAILED' ? event.error : 'Payment processing failed.',
    }),

    setRejectionError: assign({
      errorMessage: ({ event }) =>
        event.type === 'QUEUE_REJECTED' ? event.reason : 'Request rejected by queue manager.',
      queuePosition: () => null,
    }),

    resetContext: assign(() => ({
      selectedSeats: [],
      subtotal: 0,
      bookingFee: 0,
      facilityCharge: 0,
      grandTotal: 0,
      queuePosition: null,
      queueEstimatedWaitSeconds: null,
      bookingId: null,
      bookingReference: null,
      expiresAt: null,
      ttlRemainingSeconds: 0,
      paymentMethod: 'card' as const,
      paymentReference: null,
      isSubmittingPayment: false,
      qrCodeDataUrl: null,
      errorMessage: null,
    })),

    // Navigation Lock Actions
    lockBrowserNavigation: () => {
      if (typeof window !== 'undefined') {
        window.history.pushState({ inCheckoutPayment: true }, document.title);

        const onPopState = () => {
          window.history.pushState({ inCheckoutPayment: true }, document.title);
          console.warn('[CheckoutMachine] Back-navigation blocked during active payment state.');
        };

        const onBeforeUnload = (e: BeforeUnloadEvent) => {
          e.preventDefault();
          e.returnValue = 'Payment is in progress. Leaving will interrupt your transaction.';
          return e.returnValue;
        };

        window.addEventListener('popstate', onPopState);
        window.addEventListener('beforeunload', onBeforeUnload);

        (window as any).__checkoutNavLockCleanups = [
          () => window.removeEventListener('popstate', onPopState),
          () => window.removeEventListener('beforeunload', onBeforeUnload),
        ];
      }
    },

    unlockBrowserNavigation: () => {
      if (typeof window !== 'undefined' && (window as any).__checkoutNavLockCleanups) {
        (window as any).__checkoutNavLockCleanups.forEach((fn: () => void) => fn());
        delete (window as any).__checkoutNavLockCleanups;
      }
    },
  },
});

// ---------------------------------------------------------------------------
// LINEAR CHECKOUT STATE MACHINE DEFINITION
// SELECTING -> WAITING_ROOM -> HOLDING -> PAYMENT_PENDING -> CONFIRMED / EXPIRED
// ---------------------------------------------------------------------------

export const checkoutMachine = checkoutMachineSetup.createMachine({
  id: 'checkoutMachine',
  initial: 'SELECTING',
  context: {
    eventId: '',
    userId: '',
    selectedSeats: [],
    subtotal: 0,
    bookingFee: 0,
    facilityCharge: 0,
    grandTotal: 0,
    queuePosition: null,
    queueEstimatedWaitSeconds: null,
    bookingId: null,
    bookingReference: null,
    expiresAt: null,
    ttlRemainingSeconds: 600,
    paymentMethod: 'card',
    paymentReference: null,
    isSubmittingPayment: false,
    qrCodeDataUrl: null,
    errorMessage: null,
  },

  states: {
    // -------------------------------------------------------------------------
    // 1. SELECTING: User picks or alters seats on interactive seat map
    // -------------------------------------------------------------------------
    SELECTING: {
      on: {
        SELECT_SEAT: {
          actions: 'addSeat',
        },
        DESELECT_SEAT: {
          actions: 'removeSeat',
        },
        CLEAR_SEATS: {
          actions: 'clearAllSeats',
        },
        PROCEED_TO_QUEUE: {
          guard: 'hasSelectedSeats',
          target: 'WAITING_ROOM',
        },
      },
    },

    // -------------------------------------------------------------------------
    // 2. WAITING_ROOM: High-traffic flash sale queue / admission controller
    // -------------------------------------------------------------------------
    WAITING_ROOM: {
      on: {
        QUEUE_UPDATE: {
          actions: 'updateQueueState',
        },
        QUEUE_PASSED: {
          actions: 'setHoldInfo',
          target: 'HOLDING',
        },
        QUEUE_REJECTED: {
          actions: 'setRejectionError',
          target: 'SELECTING',
        },
        LEAVE_QUEUE: {
          actions: 'clearAllSeats',
          target: 'SELECTING',
        },
      },
    },

    // -------------------------------------------------------------------------
    // 3. HOLDING: Atomic Redis distributed lock acquired (10-minute hold lease)
    // -------------------------------------------------------------------------
    HOLDING: {
      on: {
        TICK: [
          {
            guard: ({ context }) => context.ttlRemainingSeconds <= 1,
            target: 'EXPIRED',
          },
          {
            actions: 'decrementTimer',
          },
        ],
        HOLD_ACQUIRED: {
          actions: 'setHoldInfo',
        },
        START_PAYMENT: {
          guard: 'isHoldValid',
          actions: 'setPaymentMethod',
          target: 'PAYMENT_PENDING',
        },
        RELEASE_HOLD: {
          actions: 'clearAllSeats',
          target: 'SELECTING',
        },
        EXPIRE: {
          target: 'EXPIRED',
        },
      },
    },

    // -------------------------------------------------------------------------
    // 4. PAYMENT_PENDING: Active checkout & payment authorization
    // Invariants enforced:
    // - Strict forward linearity (no back-navigation allowed to HOLDING or SELECTING)
    // - Hardware & browser back-button locked via navigation lock
    // - Double-submission blocked via 'processing' substate & canSubmitPayment guard
    // -------------------------------------------------------------------------
    PAYMENT_PENDING: {
      entry: 'lockBrowserNavigation',
      exit: 'unlockBrowserNavigation',
      initial: 'idle',

      on: {
        TICK: [
          {
            guard: ({ context }) => context.ttlRemainingSeconds <= 1,
            target: 'EXPIRED',
          },
          {
            actions: 'decrementTimer',
          },
        ],
        EXPIRE: {
          target: 'EXPIRED',
        },
        NAVIGATE_BACK: {
          // Intentionally empty: back navigation explicitly blocked
        },
      },

      states: {
        idle: {
          on: {
            SUBMIT_PAYMENT: {
              guard: 'canSubmitPayment',
              actions: 'markPaymentSubmitting',
              target: 'processing',
            },
          },
        },

        processing: {
          // While in processing, further SUBMIT_PAYMENT events are discarded
          on: {
            PAYMENT_SUCCESS: {
              actions: 'handlePaymentSuccess',
              target: '#checkoutMachine.CONFIRMED',
            },
            PAYMENT_FAILED: {
              actions: 'handlePaymentFailure',
              target: 'idle',
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // 5. CONFIRMED: Order finalized in PostgreSQL & Outbox, ready for offline storage
    // -------------------------------------------------------------------------
    CONFIRMED: {
      entry: 'unlockBrowserNavigation',
      on: {
        RESTART: {
          actions: 'resetContext',
          target: 'SELECTING',
        },
      },
    },

    // -------------------------------------------------------------------------
    // 6. EXPIRED: 10-minute hold lease lapsed; seats returned to arena pool
    // -------------------------------------------------------------------------
    EXPIRED: {
      entry: 'unlockBrowserNavigation',
      on: {
        RESTART: {
          actions: 'resetContext',
          target: 'SELECTING',
        },
      },
    },
  },
});

/**
 * Custom React hook for subscribing to the Checkout XState v5 Actor.
 * Works seamlessly with Next.js App Router and React 18 Concurrent features.
 */
export function useCheckoutMachine(initialEventId?: string, initialUserId?: string) {
  const actorRef = useRef<ReturnType<typeof createActor<typeof checkoutMachine>> | null>(null);

  if (!actorRef.current) {
    const actor = createActor(checkoutMachine);
    actorRef.current = actor;
    actor.start();
  }

  const actor = actorRef.current;

  const snapshot = useSyncExternalStore(
    (onStoreChange) => {
      const subscription = actor.subscribe(onStoreChange);
      return () => subscription.unsubscribe();
    },
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  useEffect(() => {
    return () => {
      // Ensure browser navigation lock is removed on unmount
      if (typeof window !== 'undefined' && (window as any).__checkoutNavLockCleanups) {
        (window as any).__checkoutNavLockCleanups.forEach((fn: () => void) => fn());
        delete (window as any).__checkoutNavLockCleanups;
      }
    };
  }, []);

  return [snapshot, actor.send, actor] as const;
}
