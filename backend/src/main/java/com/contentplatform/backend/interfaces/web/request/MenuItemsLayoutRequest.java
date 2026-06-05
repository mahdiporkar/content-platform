package com.contentplatform.backend.interfaces.web.request;

import java.util.List;

public class MenuItemsLayoutRequest {
    private List<MenuItemLayoutRequest> items;

    public List<MenuItemLayoutRequest> getItems() { return items; }
    public void setItems(List<MenuItemLayoutRequest> items) { this.items = items; }
}
