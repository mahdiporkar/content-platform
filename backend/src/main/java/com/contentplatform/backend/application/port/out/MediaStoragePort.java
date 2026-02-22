package com.contentplatform.backend.application.port.out;

import java.io.InputStream;
import java.util.List;

public interface MediaStoragePort {
    MediaUploadResult upload(String objectKey, InputStream inputStream, long sizeBytes, String contentType);
    String getPresignedUrl(String objectKey, int expirySeconds);
    void deleteObject(String bucket, String objectKey);
    void deleteMany(List<StorageObjectRef> objects);
}
