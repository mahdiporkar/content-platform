package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

public class UpdatePostCommand {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final ContentStatus status;
    private final String locale;

    public UpdatePostCommand(String id, String applicationId, String title, String slug, String content, ContentStatus status, String locale) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.status = status;
        this.locale = locale;
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

    public String getLocale() {
        return locale;
    }
}
