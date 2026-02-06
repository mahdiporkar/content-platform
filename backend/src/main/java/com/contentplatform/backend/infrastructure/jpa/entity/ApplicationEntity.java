package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.GalleryImage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applications")
public class ApplicationEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "api_token", unique = true)
    private String apiToken;

    @Column(name = "website_url")
    private String websiteUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gallery", columnDefinition = "jsonb")
    private List<GalleryImage> gallery = new ArrayList<>();

    protected ApplicationEntity() {
    }

    public ApplicationEntity(String id, String name, String websiteUrl, String apiToken, List<GalleryImage> gallery) {
        this.id = id;
        this.name = name;
        this.websiteUrl = websiteUrl;
        this.apiToken = apiToken;
        this.gallery = gallery == null ? new ArrayList<>() : new ArrayList<>(gallery);
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public String getApiToken() {
        return apiToken;
    }

    public List<GalleryImage> getGallery() {
        return gallery;
    }
}
