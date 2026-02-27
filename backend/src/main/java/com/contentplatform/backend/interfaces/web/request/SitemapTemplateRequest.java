package com.contentplatform.backend.interfaces.web.request;

public class SitemapTemplateRequest {
    private boolean enabled;
    private String template;
    private String lastmodPolicy;
    private String defaultChangefreq;
    private Double defaultPriority;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getTemplate() {
        return template;
    }

    public void setTemplate(String template) {
        this.template = template;
    }

    public String getLastmodPolicy() {
        return lastmodPolicy;
    }

    public void setLastmodPolicy(String lastmodPolicy) {
        this.lastmodPolicy = lastmodPolicy;
    }

    public String getDefaultChangefreq() {
        return defaultChangefreq;
    }

    public void setDefaultChangefreq(String defaultChangefreq) {
        this.defaultChangefreq = defaultChangefreq;
    }

    public Double getDefaultPriority() {
        return defaultPriority;
    }

    public void setDefaultPriority(Double defaultPriority) {
        this.defaultPriority = defaultPriority;
    }
}

