package com.contentplatform.backend.interfaces.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public class TenantRouteDefinitionRequest {
    @NotBlank private String key;
    @NotBlank private String path;
    @NotEmpty private Map<String, String> titles;
    private String icon;
    private String cssClass;
    private Map<String, Object> metadata;
    public String getKey() { return key; } public void setKey(String key) { this.key = key; }
    public String getPath() { return path; } public void setPath(String path) { this.path = path; }
    public Map<String, String> getTitles() { return titles; } public void setTitles(Map<String, String> titles) { this.titles = titles; }
    public String getIcon() { return icon; } public void setIcon(String icon) { this.icon = icon; }
    public String getCssClass() { return cssClass; } public void setCssClass(String cssClass) { this.cssClass = cssClass; }
    public Map<String, Object> getMetadata() { return metadata; } public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
