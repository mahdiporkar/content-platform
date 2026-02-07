import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationEntity, ApplicationStatus, MediaPolicy } from '../entities/application.entity';
import { ApplicationUpsertRequestDto } from '../dto/requests/application-upsert-request.dto';
import { ApplicationResponseDto } from '../dto/responses/application-response.dto';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AdminApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly auditLog: AuditLogService,
  ) {}

  private mapApplication(application: ApplicationEntity): ApplicationResponseDto {
    return new ApplicationResponseDto(
      application.id,
      application.name,
      application.description ?? null,
      application.status,
      application.rateLimitPolicy ?? null,
      application.mediaPolicy,
      application.allowedDomains ?? null,
      application.apiToken ?? null,
      application.tokenCreatedAt ? application.tokenCreatedAt.toISOString() : null,
      application.lastUsedAt ? application.lastUsedAt.toISOString() : null,
      application.websiteUrl ?? null,
      application.publicBaseUrlOverride ?? null,
      application.mediaBaseUrlOverride ?? null,
      application.tags ?? null,
      application.seo ?? null,
      application.gallery ?? null,
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
    const application = this.applicationRepo.create({
      id: request.id?.trim() || uuidv4(),
      name: request.name.trim(),
      description: request.description?.trim() || null,
      status: request.status ?? ApplicationStatus.ACTIVE,
      rateLimitPolicy: request.rateLimitPolicy ?? null,
      mediaPolicy: request.mediaPolicy ?? MediaPolicy.PUBLIC_VIA_GATEWAY,
      allowedDomains: this.normalizeDomains(request.allowedDomains),
      apiToken: request.apiToken?.trim() || this.generateToken(),
      tokenCreatedAt: new Date(),
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
    return this.mapApplication(saved);
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
    if (request.apiToken?.trim()) {
      application.apiToken = request.apiToken.trim();
      application.tokenCreatedAt = new Date();
    } else if (!application.apiToken) {
      application.apiToken = this.generateToken();
      application.tokenCreatedAt = new Date();
    }
    application.websiteUrl = request.websiteUrl?.trim() || null;
    application.publicBaseUrlOverride = request.publicBaseUrlOverride?.trim() || null;
    application.mediaBaseUrlOverride = request.mediaBaseUrlOverride?.trim() || null;
    application.tags = this.normalizeTags(request.tags);
    application.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    application.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.update',
      entityType: 'application',
      entityId: saved.id,
    });
    return this.mapApplication(saved);
  }

  private generateToken(): string {
    return uuidv4().replace(/-/g, '');
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
    application.apiToken = this.generateToken();
    application.tokenCreatedAt = new Date();
    const saved = await this.applicationRepo.save(application);
    await this.auditLog.record({
      action: 'application.token.rotate',
      entityType: 'application',
      entityId: saved.id,
    });
    return this.mapApplication(saved);
  }

  async revokeToken(id: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    application.apiToken = null;
    application.tokenCreatedAt = null;
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
}
