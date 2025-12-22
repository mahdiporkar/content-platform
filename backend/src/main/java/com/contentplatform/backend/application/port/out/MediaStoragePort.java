package com.contentplatform.backend.application.port.out;

import java.io.InputStream;

public interface MediaStoragePort {
    MediaUploadResult upload(String objectKey, InputStream inputStream, long sizeBytes, String contentType);
    String getPresignedUrl(String objectKey, int expirySeconds);
}
