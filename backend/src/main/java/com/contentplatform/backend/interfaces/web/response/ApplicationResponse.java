package com.contentplatform.backend.interfaces.web.response;

public class ApplicationResponse {
    private final String id;
    private final String name;
    private final String websiteUrl;

    public ApplicationResponse(String id, String name, String websiteUrl) {
        this.id = id;
        this.name = name;
        this.websiteUrl = websiteUrl;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }
}
