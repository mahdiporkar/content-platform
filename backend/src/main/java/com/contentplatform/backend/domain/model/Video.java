package com.contentplatform.backend.domain.model;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;
import java.util.Objects;

public class Video {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String description;
    private final ContentStatus status;
    private final Instant publishedAt;
    private final String objectKey;
    private final String contentType;
    private final long sizeBytes;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Video(String id,
                 String applicationId,
                 String title,
                 String description,
                 ContentStatus status,
                 Instant publishedAt,
                 String objectKey,
                 String contentType,
                 long sizeBytes,
                 Instant createdAt,
                 Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.applicationId = Objects.requireNonNull(applicationId, "applicationId must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.description = description;
        this.status = Objects.requireNonNull(status, "status must not be null");
        this.publishedAt = publishedAt;
        this.objectKey = Objects.requireNonNull(objectKey, "objectKey must not be null");
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

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
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
}
