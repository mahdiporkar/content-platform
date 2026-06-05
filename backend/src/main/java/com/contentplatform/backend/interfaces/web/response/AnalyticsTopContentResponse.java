package com.contentplatform.backend.interfaces.web.response;

public record AnalyticsTopContentResponse(
    String id,
    String title,
    String type,
    long viewCount
) {
}
