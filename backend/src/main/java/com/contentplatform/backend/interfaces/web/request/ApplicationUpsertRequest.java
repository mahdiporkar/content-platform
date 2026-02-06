package com.contentplatform.backend.interfaces.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;

import java.util.List;

public class ApplicationUpsertRequest {
    private String id;

    @NotBlank
    private String name;

    private String apiToken;

    private String websiteUrl;

    @Valid
    private List<GalleryImageRequest> gallery;

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

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public List<GalleryImageRequest> getGallery() {
        return gallery;
    }

    public void setGallery(List<GalleryImageRequest> gallery) {
        this.gallery = gallery;
    }
}
