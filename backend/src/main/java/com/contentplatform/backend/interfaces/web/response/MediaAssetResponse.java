package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MediaAssetKind;

import java.time.Instant;

public class MediaAssetResponse {
    private final String id;
    private final String applicationId;
    private final MediaAssetKind kind;
    private final String objectKey;
    private final String originalName;
    private final String contentType;
    private final long sizeBytes;
    private final String url;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MediaAssetResponse(String id,
                              String applicationId,
                              MediaAssetKind kind,
                              String objectKey,
                              String originalName,
                              String contentType,
                              long sizeBytes,
                              String url,
                              Instant createdAt,
                              Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.kind = kind;
        this.objectKey = objectKey;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.url = url;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public MediaAssetKind getKind() {
        return kind;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getOriginalName() {
        return originalName;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
