package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;

import java.time.Instant;
import java.util.List;

public class MenuResponse {
    private final String id;
    private final String applicationId;
    private final String code;
    private final String title;
    private final MenuLocation location;
    private final String languageCode;
    private final MenuStatus status;
    private final List<MenuItemResponse> items;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MenuResponse(String id, String applicationId, String code, String title, MenuLocation location,
                        String languageCode, MenuStatus status, List<MenuItemResponse> items,
                        Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.code = code;
        this.title = title;
        this.location = location;
        this.languageCode = languageCode;
        this.status = status;
        this.items = items;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getApplicationId() { return applicationId; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public MenuLocation getLocation() { return location; }
    public String getLanguageCode() { return languageCode; }
    public MenuStatus getStatus() { return status; }
    public List<MenuItemResponse> getItems() { return items; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
