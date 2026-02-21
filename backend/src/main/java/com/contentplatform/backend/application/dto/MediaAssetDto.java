package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.MediaAssetKind;

import java.time.Instant;

public record MediaAssetDto(
    String id,
    String applicationId,
    MediaAssetKind kind,
    String objectKey,
    String originalName,
    String contentType,
    long sizeBytes,
    String url,
    Instant createdAt,
    Instant updatedAt
) {
}
