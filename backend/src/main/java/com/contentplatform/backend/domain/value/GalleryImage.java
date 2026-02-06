package com.contentplatform.backend.domain.value;

public class GalleryImage {
    private String url;
    private String alt;
    private String caption;

    public GalleryImage() {
    }

    public GalleryImage(String url, String alt, String caption) {
        this.url = url;
        this.alt = alt;
        this.caption = caption;
    }

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
