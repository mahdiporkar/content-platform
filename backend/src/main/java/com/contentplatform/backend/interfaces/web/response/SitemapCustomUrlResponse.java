package com.contentplatform.backend.interfaces.web.response;

public record SitemapCustomUrlResponse(
    String id,
    String tenantId,
    String pathOrUrl,
    boolean enabled,
    String lastmodMode,
    String lastmodValue,
    String changefreq,
    Double priority,
    String notes,
    String createdAt,
    String updatedAt
) {
}

