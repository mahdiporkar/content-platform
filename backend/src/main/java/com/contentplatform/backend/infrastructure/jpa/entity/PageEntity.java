package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "pages")
public class PageEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "sanitized_html", columnDefinition = "text")
    private String sanitizedHtml;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "language_code", nullable = false, length = 5)
    private String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContentStatus status;

    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "seo_description", columnDefinition = "text")
    private String seoDescription;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "seo_keywords", columnDefinition = "text[]")
    private List<String> seoKeywords;

    @Column(name = "parent_id", length = 36)
    private String parentId;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "show_in_menu", nullable = false)
    private boolean showInMenu;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PageEntity() {
    }

    public PageEntity(String id, String applicationId, String title, String slug, String content, String sanitizedHtml,
                      String coverImage, String languageCode, ContentStatus status, String seoTitle,
                      String seoDescription, List<String> seoKeywords, String parentId, Integer sortOrder,
                      boolean showInMenu, Instant publishedAt, String createdBy, String updatedBy,
                      Instant createdAt, Instant updatedAt) {
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

    public void update(String applicationId, String title, String slug, String content, String sanitizedHtml,
                       String coverImage, String languageCode, ContentStatus status, String seoTitle,
                       String seoDescription, List<String> seoKeywords, String parentId, Integer sortOrder,
                       boolean showInMenu, Instant publishedAt, String updatedBy, Instant updatedAt) {
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
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }
}
