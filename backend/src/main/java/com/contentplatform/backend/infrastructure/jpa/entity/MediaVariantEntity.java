package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "variant_type", nullable = false, length = 32)
    private String variantType;

    @Column(name = "purpose", nullable = false, length = 32)
    private String purpose;

    @Column(name = "size_key", length = 8)
    private String sizeKey;

    @Column(name = "min_width")
    private Integer minWidth;

    @Column(name = "max_width")
    private Integer maxWidth;

    @Column(name = "device", length = 16)
    private String device;

    @Column(name = "format", length = 32)
    private String format;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "duration")
    private Double duration;

    @Column(name = "bitrate")
    private Integer bitrate;

    @Column(name = "bucket", nullable = false, length = 255)
    private String bucket;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "file_url", length = 1024)
    private String fileUrl;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MediaVariantEntity() {
    }

    public MediaVariantEntity(String id,
                              String mediaAssetId,
                              String applicationId,
                              String variantType,
                              String purpose,
                              String sizeKey,
                              Integer minWidth,
                              Integer maxWidth,
                              String device,
                              String format,
                              Integer width,
                              Integer height,
                              Double duration,
                              Integer bitrate,
                              String bucket,
                              String objectKey,
                              String fileUrl,
                              long sizeBytes,
                              boolean isDefault,
                              int sortOrder,
                              Instant createdAt,
                              Instant updatedAt) {
        this.id = id;
        this.mediaAssetId = mediaAssetId;
        this.applicationId = applicationId;
        this.variantType = variantType;
        this.purpose = purpose;
        this.sizeKey = sizeKey;
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.device = device;
        this.format = format;
        this.width = width;
        this.height = height;
        this.duration = duration;
        this.bitrate = bitrate;
        this.bucket = bucket;
        this.objectKey = objectKey;
        this.fileUrl = fileUrl;
        this.sizeBytes = sizeBytes;
        this.isDefault = isDefault;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getMediaAssetId() {
        return mediaAssetId;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getVariantType() {
        return variantType;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getSizeKey() {
        return sizeKey;
    }

    public Integer getMinWidth() {
        return minWidth;
    }

    public Integer getMaxWidth() {
        return maxWidth;
    }

    public String getDevice() {
        return device;
    }

    public String getFormat() {
        return format;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }

    public Double getDuration() {
        return duration;
    }

    public Integer getBitrate() {
        return bitrate;
    }

    public String getBucket() {
        return bucket;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
