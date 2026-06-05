package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "menus")
public class MenuEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "location", nullable = false)
    private MenuLocation location;

    @Column(name = "language_code", nullable = false, length = 5)
    private String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MenuStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MenuEntity() {
    }

    public MenuEntity(String id, String applicationId, String code, String title, MenuLocation location,
                      String languageCode, MenuStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.code = code;
        this.title = title;
        this.location = location;
        this.languageCode = languageCode;
        this.status = status;
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
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String applicationId, String code, String title, MenuLocation location, String languageCode,
                       MenuStatus status, Instant updatedAt) {
        this.applicationId = applicationId;
        this.code = code;
        this.title = title;
        this.location = location;
        this.languageCode = languageCode;
        this.status = status;
        this.updatedAt = updatedAt;
    }

    public void setStatus(MenuStatus status, Instant updatedAt) {
        this.status = status;
        this.updatedAt = updatedAt;
    }
}
