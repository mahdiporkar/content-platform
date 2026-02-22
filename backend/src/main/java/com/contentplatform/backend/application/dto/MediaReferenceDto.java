package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.MediaReferenceType;

import java.time.Instant;

public record MediaReferenceDto(
    String id,
    String applicationId,
    String mediaAssetId,
    MediaReferenceType refType,
    String refId,
    String refField,
    Instant createdAt
) {
}
