package com.contentplatform.backend.application.dto;

public class GalleryImageDto {
    private final String url;
    private final String alt;
    private final String caption;

    public GalleryImageDto(String url, String alt, String caption) {
        this.url = url;
        this.alt = alt;
        this.caption = caption;
    }

    public String getUrl() {
        return url;
    }

    public String getAlt() {
        return alt;
    }

    public String getCaption() {
        return caption;
    }
}
