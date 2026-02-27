package com.contentplatform.backend.interfaces.web.response;

import java.util.List;

public record SitemapPreviewItemResponse(
    String contentId,
    String contentType,
    String title,
    String finalUrl,
    String lastmod,
    Double priority,
    String changefreq,
    String source,
    String status,
    List<String> errors,
    boolean duplicate
) {
}

