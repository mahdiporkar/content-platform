package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ArticleUpsertRequest {
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

    @Pattern(regexp = "^(fa|en|ar|zh|ru)$", message = "locale must be one of: fa, en, ar, zh, ru")
    private String locale;

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

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }
}
