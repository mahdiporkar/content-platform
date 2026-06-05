package com.contentplatform.backend.interfaces.web.response;

public record AnalyticsTimelinePointResponse(
    String date,
    long views
) {
}
