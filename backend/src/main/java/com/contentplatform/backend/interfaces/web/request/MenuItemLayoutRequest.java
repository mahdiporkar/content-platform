package com.contentplatform.backend.interfaces.web.request;

public class MenuItemLayoutRequest {
    private String id;
    private String parentId;
    private int sortOrder;
    private Boolean isVisible;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean visible) { isVisible = visible; }
}
