package com.contentplatform.backend.domain.model;

import com.contentplatform.backend.domain.value.MediaAssetKind;

import java.time.Instant;
import java.util.Objects;

public class MediaAsset {
    private final String id;
    private final String applicationId;
    private final MediaAssetKind kind;
    private final String objectKey;
    private final String originalName;
    private final String contentType;
    private final long sizeBytes;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MediaAsset(String id,
                      String applicationId,
                      MediaAssetKind kind,
                      String objectKey,
                      String originalName,
                      String contentType,
                      long sizeBytes,
                      Instant createdAt,
                      Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.applicationId = Objects.requireNonNull(applicationId, "applicationId must not be null");
        this.kind = Objects.requireNonNull(kind, "kind must not be null");
        this.objectKey = Objects.requireNonNull(objectKey, "objectKey must not be null");
        this.originalName = originalName;
        this.contentType = Objects.requireNonNull(contentType, "contentType must not be null");
        this.sizeBytes = sizeBytes;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
