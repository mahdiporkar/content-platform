import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplicationEntity, ApplicationStatus } from '../entities/application.entity';
import { JwtPayload, JwtTokenService } from './jwt-token.service';
import { MediaPolicy } from '../entities/application.entity';
import { AdminUserRole } from '../entities/admin-user.entity';
import { ApplicationTokenService } from '../services/application-token.service';
import { ApplicationHeaderService } from '../services/application-header.service';

@Injectable()
export class ApplicationTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly jwtTokenService: JwtTokenService,
    private readonly applicationTokenService: ApplicationTokenService,
    private readonly headerService: ApplicationHeaderService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = this.headerService.parse(request);
    const headerAppId = headers.applicationId;
    const tokenHeader = headers.applicationToken;
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
    if (!appTokenHeader) {
      throw new UnauthorizedException('Missing application token.');
    }
    if (!(await this.matchesApplicationToken(application, appTokenHeader))) {
      throw new UnauthorizedException('Invalid application credentials.');
    }

    if (application.mediaPolicy === MediaPolicy.JWT_REQUIRED) {
      // Reserved for future consumer/user JWT on the delivery plane.
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

  private async matchesApplicationToken(application: ApplicationEntity, rawToken: string): Promise<boolean> {
    if (this.applicationTokenService.matches(rawToken, application.apiTokenHash, application.apiTokenSalt)) {
      return true;
    }
    if (!application.apiToken || application.apiToken !== rawToken) {
      return false;
    }

    const migrated = this.applicationTokenService.hashToken(rawToken);
    application.apiTokenHash = migrated.tokenHash;
    application.apiTokenSalt = migrated.tokenSalt;
    application.apiToken = null;
    application.lastRotatedAt = new Date();
    await this.applicationRepo.save(application);
    return true;
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
