package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ChangeStatusRequest {
    @NotBlank
    private String applicationId;

    @NotNull
    private ContentStatus status;

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public void setStatus(ContentStatus status) {
        this.status = status;
    }
}
