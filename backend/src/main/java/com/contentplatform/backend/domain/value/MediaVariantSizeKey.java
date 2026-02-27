package com.contentplatform.backend.domain.value;

import com.contentplatform.backend.application.exception.BadRequestException;

import java.util.Locale;
import java.util.Set;

public final class MediaVariantSizeKey {
    private static final Set<String> ALLOWED = Set.of("xs", "sm", "md", "lg", "xl");

    private MediaVariantSizeKey() {
    }

    public static String normalizeNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(normalized)) {
            throw new BadRequestException("Invalid variant sizeKey");
        }
        return normalized;
    }

    public static String fromViewportWidth(Integer viewportWidth) {
        if (viewportWidth == null) {
            return null;
        }
        if (viewportWidth <= 480) {
            return "xs";
        }
        if (viewportWidth <= 768) {
            return "sm";
        }
        if (viewportWidth <= 1024) {
            return "md";
        }
        if (viewportWidth <= 1440) {
            return "lg";
        }
        return "xl";
    }
}
