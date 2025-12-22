package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "videos")
public class VideoEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContentStatus status;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected VideoEntity() {
    }

    public VideoEntity(String id, String applicationId, String title, String description,
                       ContentStatus status, Instant publishedAt, String objectKey,
                       String contentType, long sizeBytes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.publishedAt = publishedAt;
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
