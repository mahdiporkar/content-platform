package com.contentplatform.backend.interfaces.web.response;

public class MediaUploadResponse {
    private final String objectKey;
    private final String contentType;
    private final long sizeBytes;
    private final String url;

    public MediaUploadResponse(String objectKey, String contentType, long sizeBytes, String url) {
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.url = url;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getUrl() {
        return url;
    }
}
