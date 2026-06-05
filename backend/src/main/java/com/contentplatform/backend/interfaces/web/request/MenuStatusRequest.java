package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.MenuStatus;
import jakarta.validation.constraints.NotNull;

public class MenuStatusRequest {
    @NotNull
    private MenuStatus status;

    public MenuStatus getStatus() { return status; }
    public void setStatus(MenuStatus status) { this.status = status; }
}
