package com.contentplatform.backend.interfaces.web.request;

import com.contentplatform.backend.domain.value.ContentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public class PageUpsertRequest {
    @NotBlank
    private String applicationId;
    @NotBlank
    private String title;
    @NotBlank
    private String slug;
    @NotBlank
    private String content;
    private String coverImage;
    @NotBlank
    @Pattern(regexp = "^(fa|en|ar|zh|ru)$", message = "languageCode must be one of: fa, en, ar, zh, ru")
    private String languageCode;
    @NotNull
    private ContentStatus status;
    private String seoTitle;
    private String seoDescription;
    private List<String> seoKeywords;
    private String parentId;
    private Integer sortOrder;
    private Boolean showInMenu;

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    public ContentStatus getStatus() { return status; }
    public void setStatus(ContentStatus status) { this.status = status; }
    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String seoTitle) { this.seoTitle = seoTitle; }
    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String seoDescription) { this.seoDescription = seoDescription; }
    public List<String> getSeoKeywords() { return seoKeywords; }
    public void setSeoKeywords(List<String> seoKeywords) { this.seoKeywords = seoKeywords; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getShowInMenu() { return showInMenu; }
    public void setShowInMenu(Boolean showInMenu) { this.showInMenu = showInMenu; }
}
