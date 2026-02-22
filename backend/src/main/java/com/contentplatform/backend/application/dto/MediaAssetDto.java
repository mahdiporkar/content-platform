package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;

import java.time.Instant;

public record MediaAssetDto(
    String id,
    String applicationId,
    String ownerUserId,
    MediaAssetKind kind,
    MediaAssetState state,
    String bucket,
    String objectKey,
    String originalName,
    String contentType,
    long sizeBytes,
    String url,
    Instant trashedAt,
    Instant purgedAt,
    String deletedByUserId,
    boolean pinned,
    long refCount,
    boolean canPurge,
    Instant createdAt,
    Instant updatedAt
) {
}
