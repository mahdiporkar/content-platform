import { Controller, Get, NotFoundException, Param, Req, Res, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { ApplicationEntity, ApplicationStatus } from '../entities/application.entity';
import { MinioService } from '../services/minio.service';
import { DomainPolicyService } from '../services/domain-policy.service';

@Controller('/media')
export class MediaGatewayController {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly minioService: MinioService,
    private readonly domainPolicy: DomainPolicyService,
  ) {}

  @Get(':appId/*')
  async proxyMedia(
    @Param('appId') appId: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const objectPath = (request.params as Record<string, string | undefined>)[0];
    const normalizedObjectPath = objectPath?.replace(/^\/+/, '');
    if (!normalizedObjectPath) {
      throw new NotFoundException('Media not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: appId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    if (application.status === ApplicationStatus.SUSPENDED) {
      throw new ForbiddenException('Application is suspended.');
    }
    if (this.domainPolicy.hasOriginSignal(request)) {
      this.domainPolicy.ensureAllowed(application, request);
    }

    const objectKey = normalizedObjectPath.startsWith(`${appId}/`)
      ? normalizedObjectPath
      : `${appId}/${normalizedObjectPath}`;

    try {
      const stat = await this.minioService.statObject(objectKey);

      response.setHeader('Content-Type', stat.metaData?.['content-type'] || 'application/octet-stream');
      response.setHeader('ETag', stat.etag);
      response.setHeader('Accept-Ranges', 'bytes');
      response.setHeader('Cache-Control', 'public, max-age=3600');

      const range = request.headers.range;
      if (range) {
        const parsed = this.parseRange(range, stat.size);
        if (!parsed) {
          response.status(416).end();
          return;
        }
        const { start, end } = parsed;
        const length = end - start + 1;
        response.status(206);
        response.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        response.setHeader('Content-Length', length.toString());
        const stream = await this.minioService.getObject(objectKey, start, length);
        stream.pipe(response);
        return;
      }

      response.setHeader('Content-Length', stat.size.toString());
      const stream = await this.minioService.getObject(objectKey);
      stream.pipe(response);
    } catch (error) {
      if (this.isMinioNotFoundError(error)) {
        throw new NotFoundException('Media not found.');
      }
      throw error;
    }
  }

  private parseRange(range: string, totalSize: number): { start: number; end: number } | null {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      return null;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : totalSize - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= totalSize) {
      return null;
    }
    return { start, end };
  }

  private isMinioNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const candidate = error as { code?: string; statusCode?: number; message?: string };
    return (
      candidate.statusCode === 404 ||
      candidate.code === 'NotFound' ||
      candidate.code === 'NoSuchKey' ||
      candidate.message === 'Not Found'
    );
  }
}
