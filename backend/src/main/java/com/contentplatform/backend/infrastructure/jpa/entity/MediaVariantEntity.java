package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.MediaVariantType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "media_variants")
public class MediaVariantEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "media_asset_id", nullable = false, length = 36)
    private String mediaAssetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "variant_type", nullable = false, length = 32)
    private MediaVariantType variantType;

    @Column(name = "bucket", nullable = false, length = 255)
    private String bucket;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MediaVariantEntity() {
    }

    public String getId() {
        return id;
    }

    public String getMediaAssetId() {
        return mediaAssetId;
    }

    public MediaVariantType getVariantType() {
        return variantType;
    }

    public String getBucket() {
        return bucket;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
