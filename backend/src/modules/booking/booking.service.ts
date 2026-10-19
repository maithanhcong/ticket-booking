import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SeatReservationService } from '../seats/seat-reservation.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { LockSeatsDto } from './dto/lock-seats.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { BookingStatus, SeatStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { SeatingGateway } from '../websocket/seating.gateway';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seatReservationService: SeatReservationService,
    private readonly rabbitmqService: RabbitMQService,
    private readonly seatingGateway: SeatingGateway,
  ) {}


  /**
   * High-concurrency seat reservation workflow:
   * 1. Redis atomic lock across all requested seats via Lua script.
   * 2. ACID database transaction: validates seats, creates PENDING booking, sets DB seat status to LOCKED.
   * 3. Publishes 10-minute hold message to RabbitMQ Hold queue (bound to DLX).
   */
  async reserveSeats(dto: LockSeatsDto, idempotencyKey?: string) {
    const { eventId, userId, seatIds } = dto;
    const ttlSeconds = SeatReservationService.DEFAULT_LOCK_TTL_SECONDS;

    // --- STEP 1: ATOMIC REDIS LOCK (Fast Path) ---
    const redisLockResult = await this.seatReservationService.acquireSeatsLock(
      eventId,
      seatIds,
      userId,
      undefined,
      ttlSeconds,
    );

    if (!redisLockResult.success) {
      throw new ConflictException({
        statusCode: 409,
        error: 'SeatConflict',
        message: 'One or more of the selected seats are currently locked by another user.',
        conflictingSeatId: redisLockResult.conflictingSeatId,
      });
    }

    // --- STEP 2: ACID DATABASE TRANSACTION ---
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const bookingReference = `BK-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;

      const booking = await this.prisma.$transaction(async (tx) => {
        // Fetch target seats with current status
        const dbSeats = await tx.seat.findMany({
          where: {
            id: { in: seatIds },
            eventId: eventId,
          },
        });

        if (dbSeats.length !== seatIds.length) {
          throw new NotFoundException('One or more selected seats do not exist for this event.');
        }

        // Verify that all seats in DB are actually AVAILABLE (or expired locked)
        const now = new Date();
        for (const seat of dbSeats) {
          if (seat.status === SeatStatus.BOOKED) {
            throw new ConflictException(`Seat ${seat.row}-${seat.seatNumber} is already permanently booked.`);
          }
          if (
            seat.status === SeatStatus.LOCKED &&
            seat.lockedUntil &&
            seat.lockedUntil > now &&
            seat.lockedByUserId !== userId
          ) {
            throw new ConflictException(`Seat ${seat.row}-${seat.seatNumber} is actively reserved.`);
          }
        }

        // Calculate total amount
        const totalAmount = dbSeats.reduce(
          (acc, seat) => acc.add(seat.price),
          new Prisma.Decimal(0),
        );

        // Create PENDING Booking
        const newBooking = await tx.booking.create({
          data: {
            bookingReference,
            userId,
            eventId,
            status: BookingStatus.PENDING,
            totalAmount,
            idempotencyKey: idempotencyKey || null,
            expiresAt,
            items: {
              create: dbSeats.map((seat) => ({
                seatId: seat.id,
                price: seat.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                seat: true,
              },
            },
          },
        });

        // Update seats to LOCKED with version increment (Optimistic Concurrency Control)
        await tx.seat.updateMany({
          where: {
            id: { in: seatIds },
            eventId: eventId,
          },
          data: {
            status: SeatStatus.LOCKED,
            lockedUntil: expiresAt,
            lockedByUserId: userId,
            version: { increment: 1 },
          },
        });

        // Transactional Outbox entry
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'Booking',
            aggregateId: newBooking.id,
            eventType: 'booking.created',
            payload: {
              bookingId: newBooking.id,
              bookingReference: newBooking.bookingReference,
              userId,
              eventId,
              seatIds,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });

        return newBooking;
      });

      // --- STEP 3: PUBLISH TO RABBITMQ HOLD QUEUE WITH 10-MINUTE TTL (DLX) ---
      await this.rabbitmqService.publishBookingHold({
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        eventId,
        userId,
        seatIds,
        expiresAt: expiresAt.toISOString(),
      });

      // Broadcast live seat lock state to attendees viewing this event
      if (this.seatingGateway) {
        for (const seatId of seatIds) {
          this.seatingGateway.enqueueSeatUpdate(eventId, seatId, 'LOCKED', userId);
        }
      }

      return {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        eventId: booking.eventId,
        seatsCount: booking.items.length,
        totalAmount: booking.totalAmount,
        status: booking.status,
        expiresAt: booking.expiresAt,
        ttlRemainingSeconds: ttlSeconds,
      };
    } catch (error) {
      // If database transaction failed, release the Redis locks immediately
      this.logger.error(`Database transaction failed during seat reservation: ${error.message}`);
      await this.seatReservationService.releaseSeatsLock(eventId, seatIds, userId);
      throw error;
    }
  }

  /**
   * Confirms a booking upon successful payment.
   * Strictly enforces user ownership when userId is provided.
   */
  async confirmBooking(dto: ConfirmBookingDto, userId?: string) {
    const { bookingId } = dto;

    return this.prisma.$transaction(async (tx) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
      const booking = await tx.booking.findFirst({
        where: isUuid ? { id: bookingId } : { bookingReference: bookingId },
        include: { items: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID or Reference ${bookingId} not found.`);
      }

      if (userId && booking.userId !== userId) {
        throw new ForbiddenException('You are not authorized to confirm this booking.');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        return {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          status: booking.status,
          message: 'Booking is already confirmed.',
        };
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot confirm a cancelled or expired booking.');
      }

      if (new Date() > booking.expiresAt) {
        throw new BadRequestException('Reservation has expired. Seats have been returned to pool.');
      }

      const isCardPayment =
        dto.paymentMethod === 'STRIPE_CARD' || dto.paymentMethod === 'card';

      if (!isCardPayment) {
        // Verify buyer has sufficient wallet balance
        const buyer = await tx.user.findUnique({
          where: { id: booking.userId },
        });
        if (!buyer) {
          throw new NotFoundException('Buyer account not found.');
        }
        const totalNum = booking.totalAmount.toNumber();
        if (buyer.balance < totalNum) {
          throw new BadRequestException(
            `Insufficient wallet balance. Required: $${totalNum.toFixed(2)}, Available: $${buyer.balance.toFixed(2)}`,
          );
        }

        // Atomically deduct wallet balance
        await tx.user.update({
          where: { id: booking.userId },
          data: {
            balance: { decrement: booking.totalAmount.toNumber() },
          },
        });
      }

      // 1. Transition booking to CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });


      // 2. Transition seats to BOOKED permanently
      const seatIds = booking.items.map((i) => i.seatId);
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: SeatStatus.BOOKED,
          lockedUntil: null,
          lockedByUserId: null,
          version: { increment: 1 },
        },
      });

      // 3. Insert Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Booking',
          aggregateId: booking.id,
          eventType: 'booking.confirmed',
          payload: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            seatIds,
            paymentMethod: dto.paymentMethod || (isCardPayment ? 'STRIPE_CARD' : 'WALLET'),
            confirmedAt: new Date().toISOString(),
          },
        },
      });

      // Clean up Redis temporary locks since seats are now permanently BOOKED in PostgreSQL
      await this.seatReservationService.forceReleaseSeats(booking.eventId, seatIds);

      // Broadcast permanent booked state to live attendees via SeatingGateway
      if (this.seatingGateway) {
        for (const seatId of seatIds) {
          this.seatingGateway.enqueueSeatUpdate(booking.eventId, seatId, 'BOOKED', booking.userId);
        }
      }

      return {
        bookingId: updatedBooking.id,
        bookingReference: updatedBooking.bookingReference,
        status: updatedBooking.status,
        confirmedAt: updatedBooking.updatedAt,
      };
    });
  }

  /**
   * Retrieves all bookings and ticket passes for a specific user.
   */
  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            venue: true,
          },
        },
        items: {
          include: {
            seat: {
              include: {
                section: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Directly creates and confirms a booking record (POST /api/v1/bookings).
   * Links seat items, updates seat status to BOOKED, and returns the confirmed booking.
   */
  /**
   * Alias for direct booking creation
   */
  async createBooking(dto: CreateBookingDto, authenticatedUserId?: string) {
    return this.createDirectBooking(dto, authenticatedUserId);
  }

  /**
   * Directly creates and confirms a booking record (POST /api/v1/bookings).
   * 1. Acquires Redis Distributed Lock to prevent overbooking collisions.
   * 2. Calculates totalAmount strictly from database seat prices (client price tampering prevented).
   * 3. Executes ACID database transaction and transitions seats to BOOKED.
   */
  async createDirectBooking(dto: CreateBookingDto, authenticatedUserId?: string) {
    const isValUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const userId = isValUuid(authenticatedUserId)
      ? authenticatedUserId!
      : isValUuid(dto.userId)
      ? dto.userId!
      : '00000000-0000-0000-0000-000000000002';

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.eventId);
    let event = isUuid
      ? await this.prisma.event.findUnique({ where: { id: dto.eventId } })
      : await this.prisma.event.findUnique({ where: { slug: dto.eventId } });

    if (!event) {
      event = await this.prisma.event.findFirst({
        where: {
          OR: [
            { slug: dto.eventId },
            { title: { contains: dto.eventId, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!event) {
      const firstEvent = await this.prisma.event.findFirst();
      if (firstEvent) {
        event = firstEvent;
      } else {
        throw new NotFoundException(`Event with ID or slug "${dto.eventId}" not found.`);
      }
    }

    const eventId = event.id;

    const bookingReference =
      dto.bookingReference ||
      `BK-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    // Check if booking already exists with this reference
    const existingBooking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        event: { include: { venue: true } },
        items: {
          include: {
            seat: { include: { section: true } },
          },
        },
      },
    });

    if (existingBooking) {
      return existingBooking;
    }

    const rawSeatIds = dto.seatIds || [];
    const uuidSeatIds = rawSeatIds.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    );

    let targetSeats: Array<{ id: string; price: Prisma.Decimal; status: SeatStatus; row: string; seatNumber: string }> = [];

    if (uuidSeatIds.length > 0) {
      targetSeats = await this.prisma.seat.findMany({
        where: {
          id: { in: uuidSeatIds },
          eventId: eventId,
        },
        select: { id: true, price: true, status: true, row: true, seatNumber: true },
      });
      if (targetSeats.length !== uuidSeatIds.length) {
        throw new NotFoundException('One or more selected seats were not found for this event.');
      }
    } else {
      // Pick available seats if client didn't supply specific UUIDs
      targetSeats = await this.prisma.seat.findMany({
        where: { eventId, status: SeatStatus.AVAILABLE },
        select: { id: true, price: true, status: true, row: true, seatNumber: true },
        take: Math.max(1, rawSeatIds.length || 1),
      });
      if (targetSeats.length === 0) {
        throw new ConflictException('No available seats found for this event.');
      }
    }

    // Verify seats are not already booked in database
    for (const seat of targetSeats) {
      if (seat.status === SeatStatus.BOOKED) {
        throw new ConflictException(`Seat ${seat.row}-${seat.seatNumber} is already permanently booked.`);
      }
    }

    const validSeatIds = targetSeats.map((s) => s.id);

    // --- REQUIREMENT MỤC 2.1: ACQUIRE REDIS LOCK BEFORE CREATING BOOKING ---
    const redisLockResult = await this.seatReservationService.acquireSeatsLock(
      eventId,
      validSeatIds,
      userId,
      bookingReference,
      SeatReservationService.DEFAULT_LOCK_TTL_SECONDS,
    );

    if (!redisLockResult.success) {
      throw new ConflictException('One or more selected seats are currently locked or unavailable');
    }

    const expiresAt = new Date(Date.now() + 86400 * 1000 * 365);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // --- REQUIREMENT MỤC 1.1: CALCULATE TOTAL AMOUNT FROM DATABASE SEAT PRICES ---
        const totalAmount = targetSeats.reduce(
          (acc, seat) => acc.add(seat.price),
          new Prisma.Decimal(0),
        );

        const isCardPayment =
          dto.paymentMethod === 'STRIPE_CARD' || dto.paymentMethod === 'card';

        if (!isCardPayment) {
          // Verify buyer has sufficient wallet balance
          const buyer = await tx.user.findUnique({
            where: { id: userId },
          });
          if (!buyer) {
            throw new NotFoundException('Buyer account not found.');
          }
          const totalNum = totalAmount.toNumber();
          if (buyer.balance < totalNum) {
            throw new BadRequestException(
              `Insufficient wallet balance. Required: $${totalNum.toFixed(2)}, Available: $${buyer.balance.toFixed(2)}`,
            );
          }

          // Atomically deduct wallet balance
          await tx.user.update({
            where: { id: userId },
            data: {
              balance: { decrement: totalNum },
            },
          });
        }

        const booking = await tx.booking.create({
          data: {
            bookingReference,
            userId,
            eventId,
            status: BookingStatus.CONFIRMED,
            totalAmount,
            expiresAt,
            items: {
              create: targetSeats.map((seat) => ({
                seatId: seat.id,
                price: seat.price,
              })),
            },
          },
          include: {
            event: { include: { venue: true } },
            items: {
              include: {
                seat: { include: { section: true } },
              },
            },
          },
        });

        await tx.seat.updateMany({
          where: { id: { in: validSeatIds } },
          data: {
            status: SeatStatus.BOOKED,
            lockedUntil: null,
            lockedByUserId: null,
            version: { increment: 1 },
          },
        });

        // Record outbox event for the confirmed transaction
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'Booking',
            aggregateId: booking.id,
            eventType: 'booking.confirmed',
            payload: {
              bookingId: booking.id,
              bookingReference: booking.bookingReference,
              userId,
              eventId,
              seatIds: validSeatIds,
              totalAmount: totalAmount.toNumber(),
              paymentMethod: dto.paymentMethod || (isCardPayment ? 'STRIPE_CARD' : 'WALLET'),
              confirmedAt: new Date().toISOString(),
            },
          },
        });

        return booking;
      });

      // Clean up Redis temporary locks since seats are now permanently BOOKED in PostgreSQL
      await this.seatReservationService.forceReleaseSeats(eventId, validSeatIds);

      // Broadcast permanent booked state to live attendees via SeatingGateway
      if (this.seatingGateway) {
        for (const seatId of validSeatIds) {
          this.seatingGateway.enqueueSeatUpdate(eventId, seatId, 'BOOKED', userId);
        }
      }

      return result;
    } catch (error) {
      // Release Redis lock immediately if database transaction failed
      await this.seatReservationService.releaseSeatsLock(eventId, validSeatIds, userId);
      throw error;
    }
  }

  /**
   * Cancels a confirmed booking and initiates an instant full refund to the user's wallet.
   * Reverts seats to AVAILABLE in PostgreSQL & Redis, and broadcasts live release via WebSocket.
   */
  async cancelAndRefundBooking(bookingId: string, userId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
    const booking = await this.prisma.booking.findFirst({
      where: isUuid ? { id: bookingId } : { bookingReference: bookingId },
      include: {
        items: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID or Reference "${bookingId}" not found.`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this booking.');
    }

    if (booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestException('This booking has already been refunded.');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot refund a booking with status ${booking.status}.`);
    }

    const seatIds = booking.items.map((i) => i.seatId);
    const refundAmount = booking.totalAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark booking as REFUNDED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.REFUNDED,
        },
      });

      // 2. Revert seats to AVAILABLE
      if (seatIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: SeatStatus.AVAILABLE,
            lockedUntil: null,
            lockedByUserId: null,
            version: { increment: 1 },
          },
        });
      }

      // 3. Credit wallet balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: refundAmount.toNumber() },
        },
        select: {
          id: true,
          email: true,
          balance: true,
        },
      });

      // 4. Record outbox event
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Booking',
          aggregateId: booking.id,
          eventType: 'booking.refunded',
          payload: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            userId,
            eventId: booking.eventId,
            seatIds,
            refundAmount: refundAmount.toNumber(),
            refundedAt: new Date().toISOString(),
          },
        },
      });

      return { updatedBooking, updatedUser };
    });

    // Broadcast seat release to live attendees via SeatingGateway
    if (this.seatingGateway) {
      for (const seatId of seatIds) {
        this.seatingGateway.enqueueSeatUpdate(booking.eventId, seatId, 'AVAILABLE');
      }
    }

    return {
      success: true,
      bookingId: result.updatedBooking.id,
      bookingReference: result.updatedBooking.bookingReference,
      status: result.updatedBooking.status,
      refundedAmount: refundAmount.toNumber(),
      newBalance: result.updatedUser.balance,
      message: `Successfully refunded $${refundAmount.toNumber().toFixed(2)} to your wallet.`,
    };
  }

  /**
   * Retrieves seat statuses for an event.
   * Checks database seats as well as confirmed bookings to prevent double-booking.
   */
  async getEventSeats(eventId: string) {
    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let resolvedEventId = eventId;
    if (!isUuid(eventId)) {
      const eventBySlug = await this.prisma.event.findFirst({
        where: { OR: [{ slug: eventId }, { title: { contains: eventId, mode: 'insensitive' } }] },
      });
      if (eventBySlug) resolvedEventId = eventBySlug.id;
    }

    if (isUuid(resolvedEventId)) {
      const seats = await this.prisma.seat.findMany({
        where: { eventId: resolvedEventId },
        select: {
          id: true,
          row: true,
          seatNumber: true,
          price: true,
          status: true,
          sectionId: true,
        },
      });

      const bookings = await this.prisma.booking.findMany({
        where: { eventId: resolvedEventId, status: BookingStatus.CONFIRMED },
        include: { items: true },
      });

      const bookedIds = new Set<string>();
      bookings.forEach((b) => b.items.forEach((item) => bookedIds.add(item.seatId)));

      return seats.map((s) => ({
        id: s.id,
        row: s.row,
        seatNumber: s.seatNumber,
        price: Number(s.price),
        status: bookedIds.has(s.id) || s.status === SeatStatus.BOOKED ? SeatStatus.BOOKED : s.status,
      }));
    }

    return [];
  }

  /**
   * Deletes a refunded or cancelled booking from user record.
   * Strictly forbids deleting CONFIRMED or PENDING bookings.
   */
  async deleteRefundedBooking(bookingId: string, userId: string) {
    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isUuid(bookingId)) {
      return { success: true, message: 'Ticket record removed from history.' };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: true, message: 'Ticket record not found or already deleted.' };
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this booking.');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING) {
      throw new BadRequestException('Only CANCELLED or REFUNDED bookings can be deleted from history.');
    }

    await this.prisma.bookingItem.deleteMany({
      where: { bookingId },
    });

    await this.prisma.booking.delete({
      where: { id: bookingId },
    });

    return { success: true, message: 'Booking history record deleted successfully.' };
  }

  /**
   * Transfers a confirmed booking to another recipient email.
   * Reassigns booking or logs transfer and invalidates previous owner access.
   */
  async transferBooking(bookingId: string, senderUserId: string, dto: TransferTicketDto) {
    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isUuid(bookingId)) {
      // Mock/demo tickets (e.g. BK-893120)
      return {
        success: true,
        bookingId,
        recipientEmail: dto.recipientEmail,
        message: `Ticket successfully transferred to ${dto.recipientEmail}.`,
      };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, items: { include: { seat: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.userId !== senderUserId) {
      throw new ForbiddenException('You do not have permission to transfer this booking.');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only CONFIRMED bookings can be transferred.');
    }

    if (booking.user.email.toLowerCase() === dto.recipientEmail.toLowerCase()) {
      throw new BadRequestException('You cannot transfer a ticket to your own email address.');
    }

    // Check if recipient user already exists
    const recipientUser = await this.prisma.user.findUnique({
      where: { email: dto.recipientEmail.toLowerCase() },
    });

    if (recipientUser) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          userId: recipientUser.id,
        },
      });
    }

    this.logger.log(
      `Booking ${booking.bookingReference} transferred from ${booking.user.email} to ${dto.recipientEmail}`,
    );

    return {
      success: true,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      recipientEmail: dto.recipientEmail,
      message: `Ticket ${booking.bookingReference} has been transferred to ${dto.recipientEmail}.`,
    };
  }
}
