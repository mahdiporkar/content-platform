package com.contentplatform.backend.domain.value;

import com.contentplatform.backend.application.exception.BadRequestException;

import java.util.Locale;
import java.util.Set;

public final class MediaVariantPurpose {
    public static final String DEFAULT = "default";
    private static final Set<String> ALLOWED = Set.of(
        DEFAULT,
        "thumbnail",
        "hero",
        "cover",
        "gallery",
        "og_image",
        "preview"
    );

    private MediaVariantPurpose() {
    }

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED.contains(normalized)) {
            throw new BadRequestException("Invalid variant purpose");
        }
        return normalized;
    }
}
