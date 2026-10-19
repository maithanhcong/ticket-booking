import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConfirmBookingDto {
  @IsString({ message: 'bookingId must be a valid string or UUID' })
  @IsNotEmpty({ message: 'bookingId is required' })
  bookingId: string;

  @IsString()
  @IsNotEmpty({ message: 'paymentReference is required' })
  paymentReference: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
