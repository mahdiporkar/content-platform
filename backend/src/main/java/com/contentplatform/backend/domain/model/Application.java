package com.contentplatform.backend.domain.model;

import java.util.Objects;
import java.util.List;

import com.contentplatform.backend.domain.value.GalleryImage;

public class Application {
    private final String id;
    private final String name;
    private final String websiteUrl;
    private final String apiToken;
    private final List<GalleryImage> gallery;

    public Application(String id, String name, String websiteUrl, String apiToken, List<GalleryImage> gallery) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = Objects.requireNonNull(name, "name must not be null");
        this.websiteUrl = websiteUrl;
        this.apiToken = apiToken;
        this.gallery = gallery == null ? List.of() : List.copyOf(gallery);
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

    public List<GalleryImage> getGallery() {
        return gallery;
    }
}
