package com.contentplatform.backend.interfaces.web.request;

import jakarta.validation.constraints.NotBlank;

public class GalleryImageRequest {
    @NotBlank
    private String url;

    private String alt;

    private String caption;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getAlt() {
        return alt;
    }

    public void setAlt(String alt) {
        this.alt = alt;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}
