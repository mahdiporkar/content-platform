package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PostUpsertRequest {
    @NotBlank
    private String applicationId;

    @NotBlank
    private String title;

    @NotBlank
    private String slug;

    @NotBlank
    private String content;

    @NotNull
    private ContentStatus status;

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public void setStatus(ContentStatus status) {
        this.status = status;
    }
}
