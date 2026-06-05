package com.contentplatform.backend.domain.value;

public enum ServicePermission {
    POSTS_MANAGE("posts.manage"),
    ARTICLES_MANAGE("articles.manage"),
    VIDEOS_MANAGE("videos.manage"),
    MEDIA_MANAGE("media.manage"),
    PAGES_MANAGE("pages.manage"),
    MENUS_MANAGE("menus.manage"),
    COLLECTIONS_MANAGE("collections.manage"),
    GALLERIES_MANAGE("galleries.manage"),
    IMAGES_MANAGE("images.manage"),
    ANALYTICS_VIEW("analytics.view");

    private final String wireValue;

    ServicePermission(String wireValue) {
        this.wireValue = wireValue;
    }

    public String wireValue() {
        return wireValue;
    }

    public static ServicePermission fromWireValue(String value) {
        for (ServicePermission permission : values()) {
            if (permission.name().equals(value) || permission.wireValue.equals(value)) {
                return permission;
            }
        }
        throw new IllegalArgumentException("Unknown service permission: " + value);
    }
}
