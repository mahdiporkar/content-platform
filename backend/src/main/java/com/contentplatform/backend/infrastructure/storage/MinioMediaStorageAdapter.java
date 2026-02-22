package com.contentplatform.backend.infrastructure.storage;

import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.MediaUploadResult;
import com.contentplatform.backend.application.port.out.StorageObjectRef;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class MinioMediaStorageAdapter implements MediaStoragePort {
    private final MinioClient minioClient;
    private final String bucket;

    public MinioMediaStorageAdapter(MinioClient minioClient,
                                    @Value("${minio.bucket}") String bucket) {
        this.minioClient = minioClient;
        this.bucket = bucket;
    }

    @Override
    public MediaUploadResult upload(String objectKey, InputStream inputStream, long sizeBytes, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .stream(inputStream, sizeBytes, -1)
                .contentType(contentType)
                .build());
            return new MediaUploadResult(objectKey, sizeBytes, contentType);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to upload media", ex);
        }
    }

    @Override
    public String getPresignedUrl(String objectKey, int expirySeconds) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.GET)
                    .expiry(expirySeconds)
                    .build()
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate presigned url", ex);
        }
    }

    @Override
    public void deleteObject(String bucket, String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to delete media object", ex);
        }
    }

    @Override
    public void deleteMany(List<StorageObjectRef> objects) {
        for (StorageObjectRef object : objects) {
            deleteObject(object.bucket(), object.objectKey());
        }
    }
}
