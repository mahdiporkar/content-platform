package com.contentplatform.backend.application.dto;

public record MediaUploadDto(String objectKey, long sizeBytes, String contentType, String url) {
}
