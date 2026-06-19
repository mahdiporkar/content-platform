package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.TenantRouteStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "tenant_routes", uniqueConstraints = @UniqueConstraint(columnNames = {"application_id", "source", "route_key"}))
public class TenantRouteEntity {
    @Id
    @Column(length = 36)
    private String id;
    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;
    @Column(nullable = false, length = 100)
    private String source;
    @Column(name = "route_key", nullable = false, length = 150)
    private String routeKey;
    @Column(name = "path_template", nullable = false, columnDefinition = "text")
    private String pathTemplate;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, String> titles;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantRouteStatus status;
    private String icon;
    @Column(name = "css_class")
    private String cssClass;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
    @Column(name = "last_synced_at", nullable = false)
    private Instant lastSyncedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TenantRouteEntity() {}

    public TenantRouteEntity(String id, String applicationId, String source, String routeKey, String pathTemplate,
                             Map<String, String> titles, TenantRouteStatus status, String icon, String cssClass,
                             Map<String, Object> metadata, Instant lastSyncedAt, Instant createdAt, Instant updatedAt) {
        this.id = id; this.applicationId = applicationId; this.source = source; this.routeKey = routeKey;
        this.pathTemplate = pathTemplate; this.titles = titles; this.status = status; this.icon = icon;
        this.cssClass = cssClass; this.metadata = metadata; this.lastSyncedAt = lastSyncedAt;
        this.createdAt = createdAt; this.updatedAt = updatedAt;
    }

    public void synchronize(String pathTemplate, Map<String, String> titles, String icon, String cssClass,
                            Map<String, Object> metadata, Instant now) {
        this.pathTemplate = pathTemplate; this.titles = titles; this.icon = icon; this.cssClass = cssClass;
        this.metadata = metadata; this.status = TenantRouteStatus.AVAILABLE; this.lastSyncedAt = now; this.updatedAt = now;
    }
    public void markUnavailable(Instant now) {
        this.status = TenantRouteStatus.UNAVAILABLE; this.lastSyncedAt = now; this.updatedAt = now;
    }
    public String getId() { return id; }
    public String getApplicationId() { return applicationId; }
    public String getSource() { return source; }
    public String getRouteKey() { return routeKey; }
    public String getPathTemplate() { return pathTemplate; }
    public Map<String, String> getTitles() { return titles; }
    public TenantRouteStatus getStatus() { return status; }
    public String getIcon() { return icon; }
    public String getCssClass() { return cssClass; }
    public Instant getUpdatedAt() { return updatedAt; }
}
