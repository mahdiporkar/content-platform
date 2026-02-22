package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MediaReferenceType;

import java.time.Instant;

public record MediaReferenceResponse(
    String id,
    String applicationId,
    String mediaAssetId,
    MediaReferenceType refType,
    String refId,
    String refField,
    Instant createdAt
) {
}
