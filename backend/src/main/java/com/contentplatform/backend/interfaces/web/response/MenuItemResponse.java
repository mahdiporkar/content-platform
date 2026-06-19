package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MenuItemTarget;
import com.contentplatform.backend.domain.value.MenuItemType;

import java.time.Instant;
import java.util.List;

public class MenuItemResponse {
    private final String id;
    private final String menuId;
    private final String parentId;
    private final String title;
    private final MenuItemType itemType;
    private final String referenceId;
    private final String url;
    private final MenuItemTarget target;
    private final String icon;
    private final String cssClass;
    private final int sortOrder;
    private final boolean visible;
    private final boolean dynamic;
    private final String source;
    private final String sourceKey;
    private final String managedBy;
    private final List<MenuItemResponse> children;
    private final Instant createdAt;
    private final Instant updatedAt;

    public MenuItemResponse(String id, String menuId, String parentId, String title, MenuItemType itemType,
                            String referenceId, String url, MenuItemTarget target, String icon, String cssClass,
                            int sortOrder, boolean visible, boolean dynamic, String source, String sourceKey, String managedBy, List<MenuItemResponse> children,
                            Instant createdAt, Instant updatedAt) {
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
        this.dynamic = dynamic;
        this.source = source;
        this.sourceKey = sourceKey;
        this.managedBy = managedBy;
        this.children = children;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
    public boolean isDynamic() { return dynamic; }
    public String getSource() { return source; }
    public String getSourceKey() { return sourceKey; }
    public String getManagedBy() { return managedBy; }
    public List<MenuItemResponse> getChildren() { return children; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
