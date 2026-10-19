import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface AuthJwtPayload {
  sub: string;
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing. Please sign in to proceed.');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'ticket-vault-jwt-secret-key-2026';
      const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret,
      });

      // Normalize user payload
      (request as any).user = {
        ...payload,
        id: payload.id || payload.sub,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token. Please sign in again.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
