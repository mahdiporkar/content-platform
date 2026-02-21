package com.contentplatform.backend.domain.value;

public enum MediaAssetKind {
    IMAGE,
    VIDEO,
    FILE;

    public static MediaAssetKind fromNullable(String kind) {
        if (kind == null || kind.isBlank()) {
            return FILE;
        }
        try {
            return MediaAssetKind.valueOf(kind.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return FILE;
        }
    }
}
