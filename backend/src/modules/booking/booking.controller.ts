import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { LockSeatsDto } from './dto/lock-seats.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard';
import { BotDetectionGuard } from '../../common/guards/bot-detection.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Direct booking persistence endpoint (POST /api/v1/bookings).
   * Creates a confirmed booking and stores it in the database for the active user.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Body() dto: CreateBookingDto,
    @CurrentUser('id') authenticatedUserId: string,
  ) {
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const validUserId = isUuid(authenticatedUserId)
      ? authenticatedUserId
      : isUuid(dto.userId)
      ? dto.userId!
      : '00000000-0000-0000-0000-000000000002';

    return this.bookingService.createDirectBooking(dto, validUserId);
  }

  /**
   * High-concurrency seat reservation endpoint.
   * Guarded by JwtAuthGuard for authentication and IdempotencyGuard for duplicate protection.
   */
  @Post('reserve')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, BotDetectionGuard, IdempotencyGuard)
  async reserveSeats(
    @Body() dto: LockSeatsDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @CurrentUser('id') authenticatedUserId: string,
  ) {
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const validUserId = isUuid(authenticatedUserId)
      ? authenticatedUserId
      : isUuid(dto.userId)
      ? dto.userId
      : '00000000-0000-0000-0000-000000000002';

    dto.userId = validUserId;
    return this.bookingService.reserveSeats(dto, idempotencyKey);
  }

  /**
   * Finalizes booking checkout after payment verification.
   * Guarded by JwtAuthGuard and IdempotencyGuard.
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  async confirmBooking(
    @Body() dto: ConfirmBookingDto,
    @CurrentUser('id') authenticatedUserId: string,
  ) {
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const validUserId = isUuid(authenticatedUserId)
      ? authenticatedUserId
      : '00000000-0000-0000-0000-000000000002';

    return this.bookingService.confirmBooking(dto, validUserId);
  }

  /**
   * Retrieves all confirmed bookings and ticket passes for the authenticated user.
   */
  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  async getMyTickets(@CurrentUser('id') userId: string) {
    return this.bookingService.getUserBookings(userId);
  }

  /**
   * Cancels a booking and credits an instant refund to the user's wallet.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async cancelBooking(
    @Param('id') bookingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.cancelAndRefundBooking(bookingId, userId);
  }

  /**
   * Retrieves current seat statuses for an event.
   * Public endpoint to sync seat map and prevent double-booking.
   */
  @Get('events/:id/seats')
  async getEventSeats(@Param('id') eventId: string) {
    return this.bookingService.getEventSeats(eventId);
  }

  /**
   * Deletes a refunded or cancelled booking from user record.
   * Only allowed for CANCELLED or REFUNDED bookings.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteBooking(
    @Param('id') bookingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.deleteRefundedBooking(bookingId, userId);
  }

  /**
   * Transfers an active confirmed booking to another user by recipient email.
   */
  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async transferBooking(
    @Param('id') bookingId: string,
    @Body() dto: TransferTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.transferBooking(bookingId, userId, dto);
  }
}

