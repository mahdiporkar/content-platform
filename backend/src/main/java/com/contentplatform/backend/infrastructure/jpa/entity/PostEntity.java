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
@Table(name = "posts")
public class PostEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContentStatus status;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PostEntity() {
    }

    public PostEntity(String id, String applicationId, String title, String slug, String content,
                      ContentStatus status, Instant publishedAt, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.status = status;
        this.publishedAt = publishedAt;
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

    public String getSlug() {
        return slug;
    }

    public String getContent() {
        return content;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
