package com.contentplatform.backend.interfaces.web.request;

public class SitemapOverrideRequest {
    private String customUrl;
    private Boolean excluded;
    private Double priorityOverride;
    private String changefreqOverride;

    public String getCustomUrl() {
        return customUrl;
    }

    public void setCustomUrl(String customUrl) {
        this.customUrl = customUrl;
    }

    public Boolean getExcluded() {
        return excluded;
    }

    public void setExcluded(Boolean excluded) {
        this.excluded = excluded;
    }

    public Double getPriorityOverride() {
        return priorityOverride;
    }

    public void setPriorityOverride(Double priorityOverride) {
        this.priorityOverride = priorityOverride;
    }

    public String getChangefreqOverride() {
        return changefreqOverride;
    }

    public void setChangefreqOverride(String changefreqOverride) {
        this.changefreqOverride = changefreqOverride;
    }
}

