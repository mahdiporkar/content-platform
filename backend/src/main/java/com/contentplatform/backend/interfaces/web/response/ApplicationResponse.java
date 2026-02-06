package com.contentplatform.backend.interfaces.web.response;

public class ApplicationResponse {
    private final String id;
    private final String name;
    private final String apiToken;
    private final String websiteUrl;
    private final java.util.List<GalleryImageResponse> gallery;

    public ApplicationResponse(String id, String name, String apiToken, String websiteUrl, java.util.List<GalleryImageResponse> gallery) {
        this.id = id;
        this.name = name;
        this.apiToken = apiToken;
        this.websiteUrl = websiteUrl;
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

    public java.util.List<GalleryImageResponse> getGallery() {
        return gallery;
    }
}
