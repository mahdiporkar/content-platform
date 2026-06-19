import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplicationEntity, ApplicationStatus } from '../entities/application.entity';
import { ApplicationTokenService } from '../services/application-token.service';

@Injectable()
export class ManagementTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly tokenService: ApplicationTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const applicationId = this.getHeader(request, 'x-application-id');
    const token = this.getBearerToken(request);
    if (!applicationId || !token) {
      throw new UnauthorizedException('Missing management credentials.');
    }

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (
      !application ||
      !this.tokenService.matches(token, application.managementTokenHash, application.managementTokenSalt)
    ) {
      throw new UnauthorizedException('Invalid management credentials.');
    }
    if (application.status === ApplicationStatus.SUSPENDED) {
      throw new ForbiddenException('Application is suspended.');
    }

    application.managementTokenLastUsedAt = new Date();
    await this.applicationRepo.save(application);
    (request as Request & { application?: ApplicationEntity }).application = application;
    return true;
  }

  private getHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name] as string | string[] | undefined;
    return Array.isArray(value) ? value[0] : value;
  }

  private getBearerToken(request: Request): string | undefined {
    const header = this.getHeader(request, 'authorization');
    if (!header) return undefined;
    const [scheme, token] = header.trim().split(/\s+/);
    return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
  }
}
