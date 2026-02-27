package com.contentplatform.backend.interfaces.web.request;

public class SitemapSettingsRequest {
    private boolean enabled;
    private String baseUrl;
    private String sitemapPath;
    private Integer cacheTtlSeconds;
    private String regenStrategy;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getSitemapPath() {
        return sitemapPath;
    }

    public void setSitemapPath(String sitemapPath) {
        this.sitemapPath = sitemapPath;
    }

    public Integer getCacheTtlSeconds() {
        return cacheTtlSeconds;
    }

    public void setCacheTtlSeconds(Integer cacheTtlSeconds) {
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    public String getRegenStrategy() {
        return regenStrategy;
    }

    public void setRegenStrategy(String regenStrategy) {
        this.regenStrategy = regenStrategy;
    }
}

