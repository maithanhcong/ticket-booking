import { IsArray, ArrayMinSize, ArrayMaxSize, IsOptional, IsString } from 'class-validator';

export class LockSeatsDto {
  @IsString({ message: 'eventId must be a valid string or UUID' })
  eventId: string;

  @IsOptional()
  @IsString({ message: 'userId must be a valid string or UUID' })
  userId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'You must select at least 1 seat' })
  @ArrayMaxSize(10, { message: 'Cannot reserve more than 10 seats per transaction' })
  @IsString({ each: true, message: 'Each seatId must be a valid string or UUID' })
  seatIds: string[];
}
