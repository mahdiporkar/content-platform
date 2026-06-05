package com.contentplatform.backend.interfaces.web.response;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.time.Instant;
import java.util.List;

public class PageContentResponse {
    private final String id;
    private final String applicationId;
    private final String title;
    private final String slug;
    private final String content;
    private final String sanitizedHtml;
    private final String coverImage;
    private final String languageCode;
    private final ContentStatus status;
    private final String seoTitle;
    private final String seoDescription;
    private final List<String> seoKeywords;
    private final String parentId;
    private final Integer sortOrder;
    private final boolean showInMenu;
    private final Instant publishedAt;
    private final String createdBy;
    private final String updatedBy;
    private final Instant createdAt;
    private final Instant updatedAt;

    public PageContentResponse(String id, String applicationId, String title, String slug, String content,
                               String sanitizedHtml, String coverImage, String languageCode, ContentStatus status,
                               String seoTitle, String seoDescription, List<String> seoKeywords, String parentId,
                               Integer sortOrder, boolean showInMenu, Instant publishedAt, String createdBy,
                               String updatedBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.sanitizedHtml = sanitizedHtml;
        this.coverImage = coverImage;
        this.languageCode = languageCode;
        this.status = status;
        this.seoTitle = seoTitle;
        this.seoDescription = seoDescription;
        this.seoKeywords = seoKeywords;
        this.parentId = parentId;
        this.sortOrder = sortOrder;
        this.showInMenu = showInMenu;
        this.publishedAt = publishedAt;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getApplicationId() { return applicationId; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getContent() { return content; }
    public String getSanitizedHtml() { return sanitizedHtml; }
    public String getCoverImage() { return coverImage; }
    public String getLanguageCode() { return languageCode; }
    public ContentStatus getStatus() { return status; }
    public String getSeoTitle() { return seoTitle; }
    public String getSeoDescription() { return seoDescription; }
    public List<String> getSeoKeywords() { return seoKeywords; }
    public String getParentId() { return parentId; }
    public Integer getSortOrder() { return sortOrder; }
    public boolean isShowInMenu() { return showInMenu; }
    public Instant getPublishedAt() { return publishedAt; }
    public String getCreatedBy() { return createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
