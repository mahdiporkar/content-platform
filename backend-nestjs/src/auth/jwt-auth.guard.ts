import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly publicPrefixes = ['/api/v1/auth', '/api/v1/public'];

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || request.url;
    if (request.method === 'OPTIONS' || this.isPublicPath(path)) {
      return true;
    }

    const header = request.headers['authorization'];
    if (!header) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header.');
    }

    try {
      const payload = this.jwtTokenService.verify(token);
      (request as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private isPublicPath(path: string | undefined): boolean {
    if (!path) {
      return false;
    }
    return this.publicPrefixes.some((prefix) => path.startsWith(prefix));
  }
}