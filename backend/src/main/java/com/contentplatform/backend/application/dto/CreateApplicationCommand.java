package com.contentplatform.backend.application.dto;

public class CreateApplicationCommand {
    private final String id;
    private final String name;
    private final String websiteUrl;

    public CreateApplicationCommand(String id, String name, String websiteUrl) {
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
