package com.contentplatform.backend.application.dto;

public record MediaResolveResultDto(
    String mediaId,
    String variantId,
    String resolvedPurpose,
    String resolvedSize,
    String resolvedDevice,
    String url,
    Integer width,
    Integer height,
    Double duration,
    boolean fallbackUsed
) {
}
