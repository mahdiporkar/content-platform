package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;

public class VideoResponse {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String description;
    private final String locale;
    private final ContentStatus status;
    private final Instant publishedAt;
    private final String objectKey;
    private final String contentType;
    private final long sizeBytes;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final Instant deletedAt;
    private final String presignedUrl;

    public VideoResponse(String id,
                         String applicationId,
                         String title,
                         String description,
                         String locale,
                         ContentStatus status,
                         Instant publishedAt,
                         String objectKey,
                         String contentType,
                         long sizeBytes,
                         Instant createdAt,
                         Instant updatedAt,
                         Instant deletedAt,
                         String presignedUrl) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.description = description;
        this.locale = locale;
        this.status = status;
        this.publishedAt = publishedAt;
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.presignedUrl = presignedUrl;
    }

    public String getId() {
        return id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getLocale() {
        return locale;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public Instant getPublishedAt() {
        return publishedAt;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public String getPresignedUrl() {
        return presignedUrl;
    }
}
