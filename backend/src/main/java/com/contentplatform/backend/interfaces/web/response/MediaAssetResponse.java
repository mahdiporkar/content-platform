package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;

import java.time.Instant;

public class MediaAssetResponse {
    private final String id;
    private final String applicationId;
    private final String ownerUserId;
    private final MediaAssetKind kind;
    private final MediaAssetState state;
    private final String bucket;
    private final String objectKey;
    private final String originalName;
    private final String contentType;
    private final long sizeBytes;
    private final String url;
    private final Instant trashedAt;
    private final Instant purgedAt;
    private final String deletedByUserId;
    private final boolean pinned;
    private final long refCount;
    private final boolean canPurge;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MediaAssetResponse(String id,
                              String applicationId,
                              String ownerUserId,
                              MediaAssetKind kind,
                              MediaAssetState state,
                              String bucket,
                              String objectKey,
                              String originalName,
                              String contentType,
                              long sizeBytes,
                              String url,
                              Instant trashedAt,
                              Instant purgedAt,
                              String deletedByUserId,
                              boolean pinned,
                              long refCount,
                              boolean canPurge,
                              Instant createdAt,
                              Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.ownerUserId = ownerUserId;
        this.kind = kind;
        this.state = state;
        this.bucket = bucket;
        this.objectKey = objectKey;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.url = url;
        this.trashedAt = trashedAt;
        this.purgedAt = purgedAt;
        this.deletedByUserId = deletedByUserId;
        this.pinned = pinned;
        this.refCount = refCount;
        this.canPurge = canPurge;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public MediaAssetKind getKind() {
        return kind;
    }

    public MediaAssetState getState() {
        return state;
    }

    public String getBucket() {
        return bucket;
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

    public Instant getTrashedAt() {
        return trashedAt;
    }

    public Instant getPurgedAt() {
        return purgedAt;
    }

    public String getDeletedByUserId() {
        return deletedByUserId;
    }

    public boolean isPinned() {
        return pinned;
    }

    public long getRefCount() {
        return refCount;
    }

    public boolean isCanPurge() {
        return canPurge;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
