import { Injectable } from '@nestjs/common';
import { MinioService } from './minio.service';
import { StorageObjectRef, StorageProvider } from './storage-provider';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  constructor(private readonly minio: MinioService) {}

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.minio.deleteObject(key, bucket);
  }

  async deleteMany(objects: StorageObjectRef[]): Promise<void> {
    // Remove each object explicitly to keep per-object bucket support.
    for (const object of objects) {
      await this.deleteObject(object.bucket, object.key);
    }
  }
}
