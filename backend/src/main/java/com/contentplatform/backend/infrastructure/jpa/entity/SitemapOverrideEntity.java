package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sitemap_overrides")
public class SitemapOverrideEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "content_type", nullable = false, length = 64)
    private String contentType;

    @Column(name = "content_id", nullable = false, length = 64)
    private String contentId;

    @Column(name = "custom_url", length = 1024)
    private String customUrl;

    @Column(name = "excluded", nullable = false)
    private boolean excluded;

    @Column(name = "priority_override", precision = 2, scale = 1)
    private Double priorityOverride;

    @Column(name = "changefreq_override", length = 16)
    private String changefreqOverride;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SitemapOverrideEntity() {
    }

    public SitemapOverrideEntity(String id,
                                 String tenantId,
                                 String contentType,
                                 String contentId,
                                 String customUrl,
                                 boolean excluded,
                                 Double priorityOverride,
                                 String changefreqOverride,
                                 Instant createdAt,
                                 Instant updatedAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.contentType = contentType;
        this.contentId = contentId;
        this.customUrl = customUrl;
        this.excluded = excluded;
        this.priorityOverride = priorityOverride;
        this.changefreqOverride = changefreqOverride;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getContentType() {
        return contentType;
    }

    public String getContentId() {
        return contentId;
    }

    public String getCustomUrl() {
        return customUrl;
    }

    public boolean isExcluded() {
        return excluded;
    }

    public Double getPriorityOverride() {
        return priorityOverride;
    }

    public String getChangefreqOverride() {
        return changefreqOverride;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

