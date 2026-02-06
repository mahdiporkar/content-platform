package com.contentplatform.backend.application.dto;

public class CreateApplicationCommand {
    private final String id;
    private final String name;
    private final String websiteUrl;
    private final String apiToken;
    private final java.util.List<GalleryImageDto> gallery;

    public CreateApplicationCommand(String id, String name, String websiteUrl, String apiToken, java.util.List<GalleryImageDto> gallery) {
        this.id = id;
        this.name = name;
        this.websiteUrl = websiteUrl;
        this.apiToken = apiToken;
        this.gallery = gallery;
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

    public String getApiToken() {
        return apiToken;
    }

    public java.util.List<GalleryImageDto> getGallery() {
        return gallery;
    }
}
