package com.contentplatform.backend.interfaces.web.request;

public class SitemapCustomUrlRequest {
    private String pathOrUrl;
    private Boolean enabled;
    private String lastmodMode;
    private String lastmodValue;
    private String changefreq;
    private Double priority;
    private String notes;

    public String getPathOrUrl() {
        return pathOrUrl;
    }

    public void setPathOrUrl(String pathOrUrl) {
        this.pathOrUrl = pathOrUrl;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getLastmodMode() {
        return lastmodMode;
    }

    public void setLastmodMode(String lastmodMode) {
        this.lastmodMode = lastmodMode;
    }

    public String getLastmodValue() {
        return lastmodValue;
    }

    public void setLastmodValue(String lastmodValue) {
        this.lastmodValue = lastmodValue;
    }

    public String getChangefreq() {
        return changefreq;
    }

    public void setChangefreq(String changefreq) {
        this.changefreq = changefreq;
    }

    public Double getPriority() {
        return priority;
    }

    public void setPriority(Double priority) {
        this.priority = priority;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

