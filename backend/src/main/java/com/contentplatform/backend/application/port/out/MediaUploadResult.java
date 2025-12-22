package com.contentplatform.backend.application.port.out;

public record MediaUploadResult(String objectKey, long sizeBytes, String contentType) {
}
