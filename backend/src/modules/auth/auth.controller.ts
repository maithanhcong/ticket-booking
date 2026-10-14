import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GuestLoginDto, TopUpDto, ForgotPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Standard Email/Password login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Password reset request endpoint (public)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Fast Demo / Guest Login endpoint for quick UI testing
   */
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  async guestLogin(@Body() dto?: GuestLoginDto) {
    return this.authService.guestLogin(dto);
  }

  /**
   * Profile verification endpoint
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  /**
   * Wallet top-up endpoint
   */
  @Post('top-up')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async topUp(@CurrentUser('id') userId: string, @Body() dto: TopUpDto) {
    return this.authService.topUp(userId, dto?.amount ?? 500);
  }
}

