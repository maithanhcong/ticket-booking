import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateBookingDto {
  @IsString({ message: 'eventId must be a valid string or UUID' })
  @IsNotEmpty({ message: 'eventId is required' })
  eventId: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString({ message: 'userId must be a valid string or UUID' })
  userId?: string;

  @IsOptional()
  @IsString()
  bookingReference?: string;

  @IsOptional()
  @IsArray()
  seatIds?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}

