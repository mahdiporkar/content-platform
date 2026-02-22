package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "media_assets")
public class MediaAssetEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "owner_user_id", length = 36)
    private String ownerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 16)
    private MediaAssetKind kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 16)
    private MediaAssetState state;

    @Column(name = "bucket", nullable = false, length = 255)
    private String bucket;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "original_name", length = 512)
    private String originalName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "trashed_at")
    private Instant trashedAt;

    @Column(name = "purged_at")
    private Instant purgedAt;

    @Column(name = "deleted_by_user_id", length = 36)
    private String deletedByUserId;

    @Column(name = "pinned", nullable = false)
    private boolean pinned;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MediaAssetEntity() {
    }

    public MediaAssetEntity(String id,
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
        this.trashedAt = trashedAt;
        this.purgedAt = purgedAt;
        this.deletedByUserId = deletedByUserId;
        this.pinned = pinned;
        this.metadata = metadata;
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
