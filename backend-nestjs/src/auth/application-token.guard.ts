import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplicationEntity, ApplicationStatus } from '../entities/application.entity';
import { JwtPayload, JwtTokenService } from './jwt-token.service';
import { MediaPolicy } from '../entities/application.entity';
import { AdminUserRole } from '../entities/admin-user.entity';

@Injectable()
export class ApplicationTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headerAppId =
      this.getHeader(request, 'x-app-id') || this.getHeader(request, 'x-application-id');
    const tokenHeader = this.getHeader(request, 'x-application-token');
    const bearerToken = this.getBearerToken(request);
    const paramAppId = request.params?.applicationId || request.params?.appId;

    const applicationId = paramAppId || headerAppId;
    if (!applicationId) {
      throw new UnauthorizedException('Missing application id.');
    }
    if (headerAppId && paramAppId && headerAppId !== paramAppId) {
      throw new UnauthorizedException('Application id mismatch.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new UnauthorizedException('Invalid application credentials.');
    }
    if (application.status === ApplicationStatus.SUSPENDED) {
      throw new ForbiddenException('Application is suspended.');
    }
    await this.enforceAccessPolicy(request, application, tokenHeader, bearerToken);
    await this.markUsed(application);

    return true;
  }

  private async enforceAccessPolicy(
    request: Request,
    application: ApplicationEntity,
    appTokenHeader: string | undefined,
    bearerToken: string | undefined,
  ): Promise<void> {
    if (application.mediaPolicy === MediaPolicy.JWT_REQUIRED) {
      if (!bearerToken) {
        throw new UnauthorizedException('Missing JWT bearer token.');
      }
      const payload = this.verifyJwt(bearerToken);
      if (!this.hasApplicationAccess(payload, application.id)) {
        throw new ForbiddenException('You do not have access to this application.');
      }
      (request as Request & { user?: JwtPayload }).user = payload;
      (request as Request & { application?: ApplicationEntity }).application = application;
      return;
    }

    if (!appTokenHeader) {
      (request as Request & { application?: ApplicationEntity }).application = application;
      return;
    }
    if (!application.apiToken || application.apiToken !== appTokenHeader) {
      throw new UnauthorizedException('Invalid application credentials.');
    }
    (request as Request & { application?: ApplicationEntity }).application = application;
  }

  private verifyJwt(token: string): JwtPayload {
    try {
      return this.jwtTokenService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT token.');
    }
  }

  private hasApplicationAccess(payload: JwtPayload, applicationId: string): boolean {
    if (payload.role === AdminUserRole.SUPER_ADMIN) {
      return true;
    }
    const allowed = new Set((payload.applicationIds || []).map((id) => id.trim()).filter(Boolean));
    return allowed.has(applicationId);
  }

  private async markUsed(application: ApplicationEntity): Promise<void> {
    application.lastUsedAt = new Date();
    await this.applicationRepo.save(application);
  }

  private getHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name] as string | string[] | undefined;
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value[0] : value;
  }

  private getBearerToken(request: Request): string | undefined {
    const header = this.getHeader(request, 'authorization');
    if (!header) {
      return undefined;
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return undefined;
    }
    return token;
  }
}
