package com.contentplatform.backend.domain.value;

import java.util.Set;

public final class ContentLocale {
    public static final String DEFAULT = "fa";
    private static final Set<String> SUPPORTED = Set.of("fa", "en", "ar", "zh", "ru");

    private ContentLocale() {
    }

    public static String normalize(String locale) {
        if (locale == null || locale.isBlank()) {
            return DEFAULT;
        }
        return locale.trim().toLowerCase();
    }

    public static boolean isSupported(String locale) {
        return SUPPORTED.contains(normalize(locale));
    }

    public static String normalizeOrDefault(String locale) {
        String normalized = normalize(locale);
        return isSupported(normalized) ? normalized : DEFAULT;
    }
}
