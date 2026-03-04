import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationEntity, ApplicationStatus, MediaPolicy } from '../entities/application.entity';
import { ApplicationUpsertRequestDto } from '../dto/requests/application-upsert-request.dto';
import { ApplicationResponseDto } from '../dto/responses/application-response.dto';
import { AuditLogService } from './audit-log.service';
import { ApplicationTokenService } from './application-token.service';
import { PublicMediaUrlService } from './public-media-url.service';

@Injectable()
export class AdminApplicationService {
  private readonly logger = new Logger(AdminApplicationService.name);

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly auditLog: AuditLogService,
    private readonly applicationTokenService: ApplicationTokenService,
    private readonly publicMediaUrlService: PublicMediaUrlService,
  ) {}

  private mapApplication(application: ApplicationEntity, rawToken?: string | null): ApplicationResponseDto {
    return new ApplicationResponseDto(
      application.id,
      application.name,
      application.description ?? null,
      application.status,
      application.rateLimitPolicy ?? null,
      application.mediaPolicy,
      application.allowedDomains ?? null,
      rawToken ?? null,
      application.apiTokenHash ? 'configured' : this.maskToken(application.apiToken),
      application.tokenCreatedAt ? application.tokenCreatedAt.toISOString() : null,
      application.lastRotatedAt ? application.lastRotatedAt.toISOString() : null,
      application.lastUsedAt ? application.lastUsedAt.toISOString() : null,
      application.websiteUrl ?? null,
      application.publicBaseUrlOverride ?? null,
      application.mediaBaseUrlOverride ?? null,
      application.tags ?? null,
      application.seo ?? null,
      this.normalizeGalleryUrls(application) ?? null,
      application.createdAt.toISOString(),
      application.updatedAt.toISOString(),
    );
  }

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  async list(): Promise<ApplicationResponseDto[]> {
    const applications = await this.applicationRepo.find({ order: { name: 'ASC' } });
    return applications.map((application) => this.mapApplication(application));
  }

  async getById(id: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return this.mapApplication(application);
  }

  async create(request: ApplicationUpsertRequestDto): Promise<ApplicationResponseDto> {
    const issuedToken = this.issueToken(request.apiToken?.trim());
    const application = this.applicationRepo.create({
      id: request.id?.trim() || uuidv4(),
      name: request.name.trim(),
      description: request.description?.trim() || null,
      status: request.status ?? ApplicationStatus.ACTIVE,
      rateLimitPolicy: request.rateLimitPolicy ?? null,
      mediaPolicy: request.mediaPolicy ?? MediaPolicy.PUBLIC_VIA_GATEWAY,
      allowedDomains: this.normalizeDomains(request.allowedDomains),
      apiToken: null,
      apiTokenHash: issuedToken.tokenHash,
      apiTokenSalt: issuedToken.tokenSalt,
      tokenCreatedAt: new Date(),
      lastRotatedAt: new Date(),
      websiteUrl: request.websiteUrl?.trim() || null,
      publicBaseUrlOverride: request.publicBaseUrlOverride?.trim() || null,
      mediaBaseUrlOverride: request.mediaBaseUrlOverride?.trim() || null,
      tags: this.normalizeTags(request.tags),
      seo: request.seo ? (request.seo as Record<string, unknown>) : null,
      gallery: request.gallery ? (request.gallery as unknown as Record<string, unknown>[]) : null,
    });
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.create',
      entityType: 'application',
      entityId: saved.id,
    });
    return this.mapApplication(saved, issuedToken.rawToken);
  }

  async update(id: string, request: ApplicationUpsertRequestDto): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    application.name = request.name.trim();
    application.description = request.description?.trim() || null;
    application.status = request.status ?? application.status ?? ApplicationStatus.ACTIVE;
    application.rateLimitPolicy = request.rateLimitPolicy ?? null;
    application.mediaPolicy = request.mediaPolicy ?? application.mediaPolicy ?? MediaPolicy.PUBLIC_VIA_GATEWAY;
    application.allowedDomains = this.normalizeDomains(request.allowedDomains);
    application.websiteUrl = request.websiteUrl?.trim() || null;
    application.publicBaseUrlOverride = request.publicBaseUrlOverride?.trim() || null;
    application.mediaBaseUrlOverride = request.mediaBaseUrlOverride?.trim() || null;
    application.tags = this.normalizeTags(request.tags);
    application.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    application.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;

    let rawToken: string | null = null;
    if (request.apiToken?.trim()) {
      const issuedToken = this.issueToken(request.apiToken.trim());
      application.apiToken = null;
      application.apiTokenHash = issuedToken.tokenHash;
      application.apiTokenSalt = issuedToken.tokenSalt;
      application.tokenCreatedAt = new Date();
      application.lastRotatedAt = new Date();
      rawToken = issuedToken.rawToken;
    } else if (!application.apiTokenHash && !application.apiToken) {
      const issuedToken = this.issueToken();
      application.apiTokenHash = issuedToken.tokenHash;
      application.apiTokenSalt = issuedToken.tokenSalt;
      application.tokenCreatedAt = new Date();
      application.lastRotatedAt = new Date();
      rawToken = issuedToken.rawToken;
    }
    const saved = await this.saveUpdatedApplication(application);
    return this.mapApplication(saved, rawToken);
  }

  private issueToken(providedToken?: string): { rawToken: string; tokenHash: string; tokenSalt: string } {
    if (providedToken) {
      this.logger.warn('Manual application tokens are deprecated. Rotate generated tokens instead.');
      return this.applicationTokenService.hashToken(providedToken);
    }
    return this.applicationTokenService.generate();
  }

  private normalizeDomains(domains?: string[]): string[] | null {
    if (!domains) {
      return null;
    }
    const normalized = domains
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean)
      .map((domain) => domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, ''));
    return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
  }

  async rotateToken(id: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const issuedToken = this.issueToken();
    application.apiToken = null;
    application.apiTokenHash = issuedToken.tokenHash;
    application.apiTokenSalt = issuedToken.tokenSalt;
    application.tokenCreatedAt = new Date();
    application.lastRotatedAt = new Date();
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.token.rotate',
      entityType: 'application',
      entityId: saved.id,
    });
    return this.mapApplication(saved, issuedToken.rawToken);
  }

  async revokeToken(id: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    application.apiToken = null;
    application.apiTokenHash = null;
    application.apiTokenSalt = null;
    application.tokenCreatedAt = null;
    application.lastRotatedAt = new Date();
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.token.revoke',
      entityType: 'application',
      entityId: saved.id,
    });
    return this.mapApplication(saved);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.applicationRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Application not found.');
    }
    await this.applicationRepo.remove(existing);
    await this.auditLog.record({
      action: 'application.delete',
      entityType: 'application',
      entityId: id,
    });
  }

  private async saveUpdatedApplication(application: ApplicationEntity): Promise<ApplicationEntity> {
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.update',
      entityType: 'application',
      entityId: saved.id,
    });
    return saved;
  }

  private maskToken(token: string | null | undefined): string | null {
    if (!token) {
      return null;
    }
    if (token.length <= 10) {
      return '***';
    }
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  }

  private normalizeGalleryUrls(application: ApplicationEntity): Record<string, unknown>[] | null {
    if (!application.gallery) {
      return null;
    }
    return application.gallery.map((item) => {
      const record = { ...(item as Record<string, unknown>) };
      if (typeof record.url === 'string') {
        record.url = this.publicMediaUrlService.toPublicMediaUrl(application, record.url);
      }
      return record;
    });
  }
}
