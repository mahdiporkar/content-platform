package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sitemap_settings")
public class SitemapSettingsEntity {
    @Id
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "base_url", length = 255)
    private String baseUrl;

    @Column(name = "sitemap_path", nullable = false, length = 255)
    private String sitemapPath;

    @Column(name = "cache_ttl_seconds", nullable = false)
    private int cacheTtlSeconds;

    @Column(name = "regen_strategy", nullable = false, length = 32)
    private String regenStrategy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SitemapSettingsEntity() {
    }

    public SitemapSettingsEntity(String tenantId,
                                 boolean enabled,
                                 String baseUrl,
                                 String sitemapPath,
                                 int cacheTtlSeconds,
                                 String regenStrategy,
                                 Instant createdAt,
                                 Instant updatedAt) {
        this.tenantId = tenantId;
        this.enabled = enabled;
        this.baseUrl = baseUrl;
        this.sitemapPath = sitemapPath;
        this.cacheTtlSeconds = cacheTtlSeconds;
        this.regenStrategy = regenStrategy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getTenantId() {
        return tenantId;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getSitemapPath() {
        return sitemapPath;
    }

    public int getCacheTtlSeconds() {
        return cacheTtlSeconds;
    }

    public String getRegenStrategy() {
        return regenStrategy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

