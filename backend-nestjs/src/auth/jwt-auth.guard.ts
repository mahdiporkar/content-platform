import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtTokenService } from './jwt-token.service';
import { AdminUserEntity, AdminUserStatus } from '../entities/admin-user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly publicPrefixes = ['/api/v1/content', '/api/v1/management', '/api/public/media', '/media', '/public'];

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepo: Repository<AdminUserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || request.url;
    if (request.method === 'OPTIONS' || path === '/api/v1/auth/login' || this.isPublicPath(path)) {
      return true;
    }

    const header = request.headers['authorization'];
    if (!header) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const [scheme, token] = header.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header.');
    }

    try {
      const payload = this.jwtTokenService.verify(token);
      const admin = await this.adminUserRepo.findOne({ where: { id: payload.sub } });
      if (!admin || admin.status === AdminUserStatus.SUSPENDED || admin.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Invalid or expired token.');
      }
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
