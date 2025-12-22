package com.contentplatform.backend.application.dto;

public class PresignedUrlDto {
    private final String url;

    public PresignedUrlDto(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }
}
