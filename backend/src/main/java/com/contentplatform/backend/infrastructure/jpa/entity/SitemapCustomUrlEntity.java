package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sitemap_custom_urls")
public class SitemapCustomUrlEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "path_or_url", nullable = false, length = 1024)
    private String pathOrUrl;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "lastmod_mode", nullable = false, length = 16)
    private String lastmodMode;

    @Column(name = "lastmod_value")
    private Instant lastmodValue;

    @Column(name = "changefreq", length = 16)
    private String changefreq;

    @Column(name = "priority", precision = 2, scale = 1)
    private Double priority;

    @Column(name = "notes", length = 512)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SitemapCustomUrlEntity() {
    }

    public SitemapCustomUrlEntity(String id,
                                  String tenantId,
                                  String pathOrUrl,
                                  boolean enabled,
                                  String lastmodMode,
                                  Instant lastmodValue,
                                  String changefreq,
                                  Double priority,
                                  String notes,
                                  Instant createdAt,
                                  Instant updatedAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.pathOrUrl = pathOrUrl;
        this.enabled = enabled;
        this.lastmodMode = lastmodMode;
        this.lastmodValue = lastmodValue;
        this.changefreq = changefreq;
        this.priority = priority;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getPathOrUrl() {
        return pathOrUrl;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getLastmodMode() {
        return lastmodMode;
    }

    public Instant getLastmodValue() {
        return lastmodValue;
    }

    public String getChangefreq() {
        return changefreq;
    }

    public Double getPriority() {
        return priority;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

