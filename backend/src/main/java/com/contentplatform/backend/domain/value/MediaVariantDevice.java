package com.contentplatform.backend.domain.value;

import com.contentplatform.backend.application.exception.BadRequestException;

import java.util.Locale;
import java.util.Set;

public final class MediaVariantDevice {
    private static final Set<String> ALLOWED = Set.of("mobile", "tablet", "desktop");

    private MediaVariantDevice() {
    }

    public static String normalizeNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(normalized)) {
            throw new BadRequestException("Invalid variant device");
        }
        return normalized;
    }
}
