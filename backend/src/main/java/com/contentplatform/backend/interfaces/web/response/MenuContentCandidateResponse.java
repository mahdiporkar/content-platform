package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.MenuItemType;

import java.time.Instant;

public class MenuContentCandidateResponse {
    private final String id;
    private final MenuItemType type;
    private final String title;
    private final String slug;
    private final String url;
    private final boolean alreadyInMenu;
    private final Instant publishedAt;
    private final Instant updatedAt;

    public MenuContentCandidateResponse(String id, MenuItemType type, String title, String slug, String url,
                                        boolean alreadyInMenu, Instant publishedAt, Instant updatedAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.slug = slug;
        this.url = url;
        this.alreadyInMenu = alreadyInMenu;
        this.publishedAt = publishedAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public MenuItemType getType() { return type; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getUrl() { return url; }
    public boolean isAlreadyInMenu() { return alreadyInMenu; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
