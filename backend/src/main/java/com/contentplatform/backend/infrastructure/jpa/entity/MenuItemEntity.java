package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.MenuItemTarget;
import com.contentplatform.backend.domain.value.MenuItemType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "menu_items")
public class MenuItemEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "menu_id", nullable = false, length = 36)
    private String menuId;

    @Column(name = "parent_id", length = 36)
    private String parentId;

    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private MenuItemType itemType;

    @Column(name = "reference_id", length = 36)
    private String referenceId;

    @Column(name = "url", columnDefinition = "text")
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "target", nullable = false)
    private MenuItemTarget target;

    @Column(name = "icon")
    private String icon;

    @Column(name = "css_class")
    private String cssClass;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_visible", nullable = false)
    private boolean visible;

    private String source;
    @Column(name = "source_key")
    private String sourceKey;
    @Column(name = "managed_by", nullable = false)
    private String managedBy = "ADMIN";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MenuItemEntity() {
    }

    public MenuItemEntity(String id, String menuId, String parentId, String title, MenuItemType itemType,
                          String referenceId, String url, MenuItemTarget target, String icon, String cssClass,
                          int sortOrder, boolean visible, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.menuId = menuId;
        this.parentId = parentId;
        this.title = title;
        this.itemType = itemType;
        this.referenceId = referenceId;
        this.url = url;
        this.target = target;
        this.icon = icon;
        this.cssClass = cssClass;
        this.sortOrder = sortOrder;
        this.visible = visible;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void setOwnership(String source, String sourceKey, String managedBy) {
        this.source = source; this.sourceKey = sourceKey; this.managedBy = managedBy;
    }

    public String getId() { return id; }
    public String getMenuId() { return menuId; }
    public String getParentId() { return parentId; }
    public String getTitle() { return title; }
    public MenuItemType getItemType() { return itemType; }
    public String getReferenceId() { return referenceId; }
    public String getUrl() { return url; }
    public MenuItemTarget getTarget() { return target; }
    public String getIcon() { return icon; }
    public String getCssClass() { return cssClass; }
    public int getSortOrder() { return sortOrder; }
    public boolean isVisible() { return visible; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getSource() { return source; }
    public String getSourceKey() { return sourceKey; }
    public String getManagedBy() { return managedBy; }

    public void update(String parentId, String title, MenuItemType itemType, String referenceId, String url,
                       MenuItemTarget target, String icon, String cssClass, int sortOrder, boolean visible,
                       Instant updatedAt) {
        this.parentId = parentId;
        this.title = title;
        this.itemType = itemType;
        this.referenceId = referenceId;
        this.url = url;
        this.target = target;
        this.icon = icon;
        this.cssClass = cssClass;
        this.sortOrder = sortOrder;
        this.visible = visible;
        this.updatedAt = updatedAt;
    }
}
