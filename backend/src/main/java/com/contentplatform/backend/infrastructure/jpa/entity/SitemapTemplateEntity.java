package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sitemap_templates")
public class SitemapTemplateEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "content_type", nullable = false, length = 64)
    private String contentType;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "template", length = 512)
    private String template;

    @Column(name = "lastmod_policy", nullable = false, length = 32)
    private String lastmodPolicy;

    @Column(name = "default_changefreq", length = 16)
    private String defaultChangefreq;

    @Column(name = "default_priority", precision = 2, scale = 1)
    private Double defaultPriority;

    @Column(name = "validate_status", nullable = false, length = 16)
    private String validateStatus;

    @Column(name = "validate_errors", columnDefinition = "jsonb")
    private String validateErrors;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SitemapTemplateEntity() {
    }

    public SitemapTemplateEntity(String id,
                                 String tenantId,
                                 String contentType,
                                 boolean enabled,
                                 String template,
                                 String lastmodPolicy,
                                 String defaultChangefreq,
                                 Double defaultPriority,
                                 String validateStatus,
                                 String validateErrors,
                                 Instant createdAt,
                                 Instant updatedAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.contentType = contentType;
        this.enabled = enabled;
        this.template = template;
        this.lastmodPolicy = lastmodPolicy;
        this.defaultChangefreq = defaultChangefreq;
        this.defaultPriority = defaultPriority;
        this.validateStatus = validateStatus;
        this.validateErrors = validateErrors;
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

    public boolean isEnabled() {
        return enabled;
    }

    public String getTemplate() {
        return template;
    }

    public String getLastmodPolicy() {
        return lastmodPolicy;
    }

    public String getDefaultChangefreq() {
        return defaultChangefreq;
    }

    public Double getDefaultPriority() {
        return defaultPriority;
    }

    public String getValidateStatus() {
        return validateStatus;
    }

    public String getValidateErrors() {
        return validateErrors;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

