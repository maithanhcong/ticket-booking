import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber, Min, Max } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class GuestLoginDto {
  @IsOptional()
  @IsString()
  role?: 'CUSTOMER' | 'ADMIN';

  @IsOptional()
  @IsString()
  preset?: 'alex' | 'demo' | 'admin';
}

export class TopUpDto {
  @IsOptional()
  @IsNumber({}, { message: 'Số tiền nạp phải là định dạng số' })
  @Min(1, { message: 'Số tiền nạp tối thiểu là $1' })
  @Max(10000, { message: 'Số tiền nạp tối đa mỗi giao dịch là $10,000' })
  amount?: number;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;
}

