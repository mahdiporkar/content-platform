package com.contentplatform.backend.domain.model;

import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;

import java.time.Instant;
import java.util.Objects;

public class MediaAsset {
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
    private final Instant trashedAt;
    private final Instant purgedAt;
    private final String deletedByUserId;
    private final boolean pinned;
    private final String metadata;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MediaAsset(String id,
                      String applicationId,
                      String ownerUserId,
                      MediaAssetKind kind,
                      MediaAssetState state,
                      String bucket,
                      String objectKey,
                      String originalName,
                      String contentType,
                      long sizeBytes,
                      Instant trashedAt,
                      Instant purgedAt,
                      String deletedByUserId,
                      boolean pinned,
                      String metadata,
                      Instant createdAt,
                      Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.applicationId = Objects.requireNonNull(applicationId, "applicationId must not be null");
        this.ownerUserId = ownerUserId;
        this.kind = Objects.requireNonNull(kind, "kind must not be null");
        this.state = Objects.requireNonNull(state, "state must not be null");
        this.bucket = Objects.requireNonNull(bucket, "bucket must not be null");
        this.objectKey = Objects.requireNonNull(objectKey, "objectKey must not be null");
        this.originalName = originalName;
        this.contentType = Objects.requireNonNull(contentType, "contentType must not be null");
        this.sizeBytes = sizeBytes;
        this.trashedAt = trashedAt;
        this.purgedAt = purgedAt;
        this.deletedByUserId = deletedByUserId;
        this.pinned = pinned;
        this.metadata = metadata;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
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

    public String getMetadata() {
        return metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
