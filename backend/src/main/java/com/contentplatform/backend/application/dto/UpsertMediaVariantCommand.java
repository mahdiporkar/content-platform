package com.contentplatform.backend.application.dto;

import java.io.InputStream;

public record UpsertMediaVariantCommand(
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
    Boolean isDefault,
    Integer sortOrder,
    String originalFileName,
    String contentType,
    Long sizeBytes,
    InputStream inputStream
) {
}
