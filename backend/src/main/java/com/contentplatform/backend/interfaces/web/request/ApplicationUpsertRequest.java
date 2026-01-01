package com.contentplatform.backend.interfaces.web.request;

import jakarta.validation.constraints.NotBlank;

public class ApplicationUpsertRequest {
    private String id;

    @NotBlank
    private String name;

    private String websiteUrl;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }
}
