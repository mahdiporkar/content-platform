package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.MenuItemTarget;
import com.contentplatform.backend.domain.value.MenuItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MenuItemUpsertRequest {
    private String parentId;
    @NotBlank
    private String title;
    @NotNull
    private MenuItemType itemType;
    private String referenceId;
    private String url;
    private MenuItemTarget target;
    private String icon;
    private String cssClass;
    private Integer sortOrder;
    private Boolean isVisible;

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public MenuItemType getItemType() { return itemType; }
    public void setItemType(MenuItemType itemType) { this.itemType = itemType; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public MenuItemTarget getTarget() { return target; }
    public void setTarget(MenuItemTarget target) { this.target = target; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getCssClass() { return cssClass; }
    public void setCssClass(String cssClass) { this.cssClass = cssClass; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean visible) { isVisible = visible; }
}
