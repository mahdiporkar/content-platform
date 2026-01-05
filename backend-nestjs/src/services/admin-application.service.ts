import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationEntity } from '../entities/application.entity';
import { ApplicationUpsertRequestDto } from '../dto/requests/application-upsert-request.dto';
import { ApplicationResponseDto } from '../dto/responses/application-response.dto';

@Injectable()
export class AdminApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
  ) {}

  private mapApplication(application: ApplicationEntity): ApplicationResponseDto {
    return new ApplicationResponseDto(
      application.id,
      application.name,
      application.websiteUrl ?? null,
      application.tags ?? null,
      application.seo ?? null,
      application.gallery ?? null,
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
      websiteUrl: request.websiteUrl?.trim() || null,
      tags: this.normalizeTags(request.tags),
      seo: request.seo ?? null,
      gallery: request.gallery ?? null,
    });
    const saved = await this.applicationRepo.save(application);
    return this.mapApplication(saved);
  }

  async update(id: string, request: ApplicationUpsertRequestDto): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    application.name = request.name.trim();
    application.websiteUrl = request.websiteUrl?.trim() || null;
    application.tags = this.normalizeTags(request.tags);
    application.seo = request.seo ?? null;
    application.gallery = request.gallery ?? null;
    const saved = await this.applicationRepo.save(application);
    return this.mapApplication(saved);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.applicationRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Application not found.');
    }
    await this.applicationRepo.remove(existing);
  }
}
