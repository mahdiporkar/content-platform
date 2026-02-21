package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateVideoFromAssetRequest {
    @NotBlank
    private String applicationId;

    @NotBlank
    private String assetId;

    @NotBlank
    private String title;

    private String description;

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

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
