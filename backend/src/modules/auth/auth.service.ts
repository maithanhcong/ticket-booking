import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto, GuestLoginDto, ForgotPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new customer account.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: UserRole.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user,
    };
  }

  /**
   * Authenticates user via email and password.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const { passwordHash, ...userProfile } = user;
    const accessToken = this.generateToken(userProfile);

    return {
      accessToken,
      user: userProfile,
    };
  }

  /**
   * Fast Demo / Guest Login endpoint.
   * Allows instant one-click authentication without entering credentials.
   */
  async guestLogin(dto?: GuestLoginDto) {
    const preset = dto?.preset || 'alex';

    let targetEmail = 'alex.vance@example.com';
    let defaultFirst = 'Alex';
    let defaultLast = 'Vance';
    let role: UserRole = UserRole.CUSTOMER;

    if (preset === 'admin' || dto?.role === 'ADMIN') {
      targetEmail = 'admin@auratickets.com';
      defaultFirst = 'System';
      defaultLast = 'Administrator';
      role = UserRole.ADMIN;
    } else if (preset === 'demo') {
      targetEmail = 'demo@auratickets.com';
      defaultFirst = 'Demo';
      defaultLast = 'Customer';
    }

    let user = await this.prisma.user.findUnique({
      where: { email: targetEmail },
    });

    // Auto-provision demo account if not found in database yet
    if (!user) {
      const defaultHash = await bcrypt.hash('Password123!', 10);
      user = await this.prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: defaultHash,
          firstName: defaultFirst,
          lastName: defaultLast,
          role,
          balance: 1500.0,
        },
      });
      this.logger.log(`Created on-the-fly demo user: ${targetEmail}`);
    }

    const { passwordHash, ...userProfile } = user;
    const accessToken = this.generateToken(userProfile);

    return {
      accessToken,
      user: userProfile,
      isDemoSession: true,
    };
  }

  /**
   * Fetches current authenticated user profile.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }

  /**
   * Credits wallet balance for the authenticated user.
   */
  async topUp(userId: string, amount: number = 500) {
    const safeAmount = Number(amount) || 500;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: safeAmount },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Generates mock password reset token and dispatch instructions.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const resetToken = `rst_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    this.logger.log(`Password reset requested for email: ${email}. Generated token: ${resetToken}`);

    return {
      success: true,
      message: 'Password reset link has been dispatched to your email.',
      email,
      ...(user ? { resetToken } : {}),
    };
  }

  private generateToken(user: { id: string; email: string; role: string; firstName: string; lastName: string }) {
    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return this.jwtService.sign(payload);
  }
}
