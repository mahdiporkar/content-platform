package com.contentplatform.backend.domain.value;

public enum MediaAssetKind {
    IMAGE,
    VIDEO,
    FILE,
    OTHER;

    public static MediaAssetKind fromNullable(String kind) {
        if (kind == null || kind.isBlank()) {
            return OTHER;
        }
        String normalized = kind.trim().toUpperCase();
        if ("FILE".equals(normalized)) {
            return OTHER;
        }
        try {
            return MediaAssetKind.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return OTHER;
        }
    }
}
