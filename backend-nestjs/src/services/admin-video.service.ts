import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { VideoUpdateRequestDto } from '../dto/requests/video-update-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { VideoEntity } from '../entities/video.entity';
import { MinioService } from './minio.service';

@Injectable()
export class AdminVideoService {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    private readonly minioService: MinioService,
  ) {}

  private mapVideo(video: VideoEntity): VideoResponseDto {
    return new VideoResponseDto(
      video.id,
      video.applicationId,
      video.title,
      video.description,
      video.tags ?? null,
      video.seo ?? null,
      video.gallery ?? null,
      video.status,
      video.publishedAt ? video.publishedAt.toISOString() : null,
      video.objectKey,
      video.contentType,
      video.sizeBytes,
      video.createdAt.toISOString(),
      video.updatedAt.toISOString(),
      this.minioService.getPublicUrl(video.objectKey),
    );
  }

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  async upload(
    file: Express.Multer.File,
    title: string,
    description: string | undefined,
    applicationId: string,
    status: ContentStatus,
    tags?: string[],
    seo?: Record<string, unknown>,
    gallery?: Record<string, unknown>[],
  ): Promise<VideoResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    const upload = await this.minioService.upload(applicationId, 'video', file);
    const video = this.videoRepo.create({
      id: uuidv4(),
      applicationId,
      title: title.trim(),
      description: description?.trim() || null,
      tags: this.normalizeTags(tags),
      seo: seo ?? null,
      gallery: gallery ?? null,
      status,
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
      objectKey: upload.objectKey,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
    });
    const saved = await this.videoRepo.save(video);
    return this.mapVideo(saved);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    video.status = request.status;
    video.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    const saved = await this.videoRepo.save(video);
    return this.mapVideo(saved);
  }

  async getById(id: string): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    return this.mapVideo(video);
  }

  async update(id: string, request: VideoUpdateRequestDto): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    video.title = request.title.trim();
    video.description = request.description?.trim() || null;
    video.tags = this.normalizeTags(request.tags);
    video.seo = request.seo ?? null;
    video.gallery = request.gallery ?? null;
    video.status = request.status;
    video.publishedAt = request.status === ContentStatus.PUBLISHED ? video.publishedAt ?? new Date() : null;
    const saved = await this.videoRepo.save(video);
    return this.mapVideo(saved);
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<VideoResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.videoRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map((video) => this.mapVideo(video));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
