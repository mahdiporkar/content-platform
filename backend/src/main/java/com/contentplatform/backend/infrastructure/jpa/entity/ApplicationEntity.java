package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "applications")
public class ApplicationEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "website_url")
    private String websiteUrl;

    protected ApplicationEntity() {
    }

    public ApplicationEntity(String id, String name, String websiteUrl) {
        this.id = id;
        this.name = name;
        this.websiteUrl = websiteUrl;
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
}
