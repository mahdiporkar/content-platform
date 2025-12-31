import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

type UploadResult = {
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('MINIO_URL') || 'http://localhost:9000';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin';
    const parsed = new URL(url);
    this.client = new Client({
      endPoint: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80,
      useSSL: parsed.protocol === 'https:',
      accessKey,
      secretKey,
    });
    this.bucket = this.config.get<string>('MINIO_BUCKET') || 'media';
    this.publicUrl = (this.config.get<string>('MINIO_PUBLIC_URL') || url).replace(/\/$/, '');
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicUrl}/${this.bucket}/${objectKey}`;
  }

  async upload(applicationId: string, kind: string | undefined, file: Express.Multer.File): Promise<UploadResult> {
    if (!applicationId) {
      throw new BadRequestException('Application ID is required.');
    }
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    const objectKey = this.buildObjectKey(applicationId, kind, file.originalname);
    await this.client.putObject(this.bucket, objectKey, file.buffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream',
    });
    return {
      objectKey,
      contentType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      url: this.getPublicUrl(objectKey),
    };
  }

  private buildObjectKey(applicationId: string, kind: string | undefined, originalName: string | undefined) {
    const normalizedKind = this.normalizeKind(kind);
    const now = new Date();
    const safeName = (originalName || 'file').replace(/\s+/g, '-');
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${applicationId}/${normalizedKind}/${year}/${month}/${uuidv4()}-${safeName}`;
  }

  private normalizeKind(kind: string | undefined) {
    const normalized = (kind || 'file').toLowerCase().trim();
    if (normalized === 'image' || normalized === 'video' || normalized === 'file') {
      return normalized;
    }
    return 'file';
  }
}
