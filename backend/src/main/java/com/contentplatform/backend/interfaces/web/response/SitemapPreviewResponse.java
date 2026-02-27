package com.contentplatform.backend.interfaces.web.response;

import java.util.List;

public record SitemapPreviewResponse(
    long total,
    List<SitemapPreviewItemResponse> items
) {
}

