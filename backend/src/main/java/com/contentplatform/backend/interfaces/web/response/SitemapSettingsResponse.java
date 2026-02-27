package com.contentplatform.backend.interfaces.web.response;

public record SitemapSettingsResponse(
    String tenantId,
    boolean enabled,
    String baseUrl,
    String sitemapPath,
    int cacheTtlSeconds,
    String regenStrategy,
    String createdAt,
    String updatedAt
) {
}

