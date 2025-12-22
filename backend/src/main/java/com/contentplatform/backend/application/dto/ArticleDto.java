package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;

public class ArticleDto {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final ContentStatus status;
    private final Instant publishedAt;
    private final Instant createdAt;
    private final Instant updatedAt;

    public ArticleDto(String id,
                      String applicationId,
                      String title,
                      String slug,
                      String content,
                      ContentStatus status,
                      Instant publishedAt,
                      Instant createdAt,
                      Instant updatedAt) {
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
