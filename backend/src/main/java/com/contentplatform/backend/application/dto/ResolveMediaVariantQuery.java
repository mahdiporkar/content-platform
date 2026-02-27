package com.contentplatform.backend.application.dto;

public record ResolveMediaVariantQuery(
    String purpose,
    String size,
    Integer viewportWidth,
    String device,
    String format
) {
}
