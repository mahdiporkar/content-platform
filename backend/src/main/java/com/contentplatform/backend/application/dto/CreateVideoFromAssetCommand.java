package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

public class CreateVideoFromAssetCommand {
    private final String applicationId;
    private final String assetId;
    private final String title;
    private final String description;
    private final ContentStatus status;
    private final String locale;

    public CreateVideoFromAssetCommand(String applicationId,
                                       String assetId,
                                       String title,
                                       String description,
                                       ContentStatus status,
                                       String locale) {
        this.applicationId = applicationId;
        this.assetId = assetId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.locale = locale;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getAssetId() {
        return assetId;
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

    public String getLocale() {
        return locale;
    }
}
