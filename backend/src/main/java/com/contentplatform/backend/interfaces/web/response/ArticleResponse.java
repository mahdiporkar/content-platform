package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;

public class ArticleResponse {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final String locale;
    private final ContentStatus status;
    private final Instant publishedAt;
    private final int readingTimeMinutes;
    private final Instant createdAt;
    private final Instant updatedAt;

    public ArticleResponse(String id, String applicationId, String title, String slug, String content, String locale,
                           ContentStatus status, Instant publishedAt, int readingTimeMinutes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.locale = locale;
        this.status = status;
        this.publishedAt = publishedAt;
        this.readingTimeMinutes = readingTimeMinutes;
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

    public String getLocale() {
        return locale;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public int getReadingTimeMinutes() {
        return readingTimeMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
