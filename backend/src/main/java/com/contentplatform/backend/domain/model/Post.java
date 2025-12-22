package com.contentplatform.backend.domain.model;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;
import java.util.Objects;

public class Post {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final ContentStatus status;
    private final Instant publishedAt;
    private final Instant createdAt;
    private final Instant updatedAt;

    public Post(String id,
                String applicationId,
                String title,
                String slug,
                String content,
                ContentStatus status,
                Instant publishedAt,
                Instant createdAt,
                Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.applicationId = Objects.requireNonNull(applicationId, "applicationId must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.slug = Objects.requireNonNull(slug, "slug must not be null");
        this.content = Objects.requireNonNull(content, "content must not be null");
        this.status = Objects.requireNonNull(status, "status must not be null");
        this.publishedAt = publishedAt;
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
