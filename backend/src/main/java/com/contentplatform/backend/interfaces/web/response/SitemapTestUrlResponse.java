package com.contentplatform.backend.interfaces.web.response;

public record SitemapTestUrlResponse(
    boolean ok,
    Integer httpStatus,
    String errorMessage
) {
}

