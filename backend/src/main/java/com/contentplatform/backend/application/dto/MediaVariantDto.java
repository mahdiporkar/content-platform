package com.contentplatform.backend.application.dto;

import java.time.Instant;

public record MediaVariantDto(
    String id,
    String mediaAssetId,
    String applicationId,
    String purpose,
    String sizeKey,
    Integer minWidth,
    Integer maxWidth,
    String device,
    String format,
    Integer width,
    Integer height,
    Double duration,
    Integer bitrate,
    String bucket,
    String objectKey,
    String fileUrl,
    long sizeBytes,
    boolean isDefault,
    int sortOrder,
    Instant createdAt,
    Instant updatedAt
) {
}
