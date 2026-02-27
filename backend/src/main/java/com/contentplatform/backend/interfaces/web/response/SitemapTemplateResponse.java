package com.contentplatform.backend.interfaces.web.response;

public record SitemapTemplateResponse(
    String id,
    String tenantId,
    String contentType,
    boolean enabled,
    String template,
    String lastmodPolicy,
    String defaultChangefreq,
    Double defaultPriority,
    String validateStatus,
    String validateErrors,
    String createdAt,
    String updatedAt
) {
}

