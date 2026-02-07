import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplicationEntity, ApplicationStatus } from '../entities/application.entity';

@Injectable()
export class ApplicationTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headerAppId =
      this.getHeader(request, 'x-app-id') || this.getHeader(request, 'x-application-id');
    const tokenHeader = this.getHeader(request, 'x-application-token');
    const bearerToken = this.getBearerToken(request);
    const token = bearerToken || tokenHeader;
    const paramAppId = request.params?.applicationId || request.params?.appId;

    const applicationId = paramAppId || headerAppId;
    if (!applicationId) {
      throw new UnauthorizedException('Missing application id.');
    }
    if (headerAppId && paramAppId && headerAppId !== paramAppId) {
      throw new UnauthorizedException('Application id mismatch.');
    }
    if (!token) {
      throw new UnauthorizedException('Missing application token.');
    }

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application || !application.apiToken) {
      throw new UnauthorizedException('Invalid application credentials.');
    }
    if (application.apiToken !== token) {
      throw new UnauthorizedException('Invalid application credentials.');
    }
    if (application.status === ApplicationStatus.SUSPENDED) {
      throw new ForbiddenException('Application is suspended.');
    }
    application.lastUsedAt = new Date();
    await this.applicationRepo.save(application);
    (request as Request & { application?: ApplicationEntity }).application = application;

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
