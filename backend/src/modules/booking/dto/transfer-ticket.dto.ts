import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TransferTicketDto {
  @IsEmail({}, { message: 'A valid recipient email address is required.' })
  @IsNotEmpty()
  recipientEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Security PIN is required to authorize transfer.' })
  @MinLength(4, { message: 'Security PIN must be at least 4 characters long.' })
  securityPin: string;
}
