package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

public class ChangeStatusCommand {
    private final String id;
    private final String applicationId;
    private final ContentStatus status;

    public ChangeStatusCommand(String id, String applicationId, ContentStatus status) {
        this.id = id;
        this.applicationId = applicationId;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public ContentStatus getStatus() {
        return status;
    }
}
