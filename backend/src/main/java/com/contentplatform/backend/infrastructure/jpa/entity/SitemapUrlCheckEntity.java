package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sitemap_url_checks")
public class SitemapUrlCheckEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "url", nullable = false, length = 2048)
    private String url;

    @Column(name = "last_checked_at", nullable = false)
    private Instant lastCheckedAt;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    protected SitemapUrlCheckEntity() {
    }

    public SitemapUrlCheckEntity(String id,
                                 String tenantId,
                                 String url,
                                 Instant lastCheckedAt,
                                 Integer httpStatus,
                                 String errorMessage) {
        this.id = id;
        this.tenantId = tenantId;
        this.url = url;
        this.lastCheckedAt = lastCheckedAt;
        this.httpStatus = httpStatus;
        this.errorMessage = errorMessage;
    }
}

