package com.contentplatform.backend.interfaces.web.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class TenantRouteSyncRequest {
    @NotBlank private String source;
    @NotEmpty @Valid private List<TenantRouteDefinitionRequest> routes;
    private Boolean replaceMissing;
    public String getSource() { return source; } public void setSource(String source) { this.source = source; }
    public List<TenantRouteDefinitionRequest> getRoutes() { return routes; } public void setRoutes(List<TenantRouteDefinitionRequest> routes) { this.routes = routes; }
    public Boolean getReplaceMissing() { return replaceMissing; } public void setReplaceMissing(Boolean replaceMissing) { this.replaceMissing = replaceMissing; }
}
