package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

public class CreateArticleCommand {
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final ContentStatus status;

    public CreateArticleCommand(String applicationId, String title, String slug, String content, ContentStatus status) {
        this.applicationId = applicationId;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.status = status;
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
}
