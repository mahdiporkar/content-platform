package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.MediaReferenceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "media_references")
public class MediaReferenceEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(name = "media_asset_id", nullable = false, length = 36)
    private String mediaAssetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false, length = 32)
    private MediaReferenceType refType;

    @Column(name = "ref_id", nullable = false, length = 36)
    private String refId;

    @Column(name = "ref_field", nullable = false, length = 128)
    private String refField;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MediaReferenceEntity() {
    }

    public MediaReferenceEntity(String id,
                                String applicationId,
                                String mediaAssetId,
                                MediaReferenceType refType,
                                String refId,
                                String refField,
                                Instant createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.mediaAssetId = mediaAssetId;
        this.refType = refType;
        this.refId = refId;
        this.refField = refField;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getMediaAssetId() {
        return mediaAssetId;
    }

    public MediaReferenceType getRefType() {
        return refType;
    }

    public String getRefId() {
        return refId;
    }

    public String getRefField() {
        return refField;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
