package com.contentplatform.backend.interfaces.web.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public class MediaVariantResponse {
    private final String id;
    private final String mediaAssetId;
    private final String applicationId;
    private final String purpose;
    private final String sizeKey;
    private final Integer minWidth;
    private final Integer maxWidth;
    private final String device;
    private final String format;
    private final Integer width;
    private final Integer height;
    private final Double duration;
    private final Integer bitrate;
    private final String bucket;
    private final String objectKey;
    private final String fileUrl;
    private final long sizeBytes;
    private final boolean isDefault;
    private final int sortOrder;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MediaVariantResponse(String id,
                                String mediaAssetId,
                                String applicationId,
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

    public String getId() { return id; }
    public String getMediaAssetId() { return mediaAssetId; }
    public String getApplicationId() { return applicationId; }
    public String getPurpose() { return purpose; }
    public String getSizeKey() { return sizeKey; }
    public Integer getMinWidth() { return minWidth; }
    public Integer getMaxWidth() { return maxWidth; }
    public String getDevice() { return device; }
    public String getFormat() { return format; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public Double getDuration() { return duration; }
    public Integer getBitrate() { return bitrate; }
    public String getBucket() { return bucket; }
    public String getObjectKey() { return objectKey; }
    public String getFileUrl() { return fileUrl; }
    public long getSizeBytes() { return sizeBytes; }
    @JsonProperty("isDefault")
    public boolean getIsDefault() { return isDefault; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
