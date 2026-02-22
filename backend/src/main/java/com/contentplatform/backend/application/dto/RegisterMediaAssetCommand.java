package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.MediaAssetKind;

public class RegisterMediaAssetCommand {
    private final String applicationId;
    private final String ownerUserId;
    private final MediaAssetKind kind;
    private final String bucket;
    private final String objectKey;
    private final String originalName;
    private final String contentType;
    private final long sizeBytes;

    public RegisterMediaAssetCommand(String applicationId,
                                     String ownerUserId,
                                     MediaAssetKind kind,
                                     String bucket,
                                     String objectKey,
                                     String originalName,
                                     String contentType,
                                     long sizeBytes) {
        this.applicationId = applicationId;
        this.ownerUserId = ownerUserId;
        this.kind = kind;
        this.bucket = bucket;
        this.objectKey = objectKey;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public MediaAssetKind getKind() {
        return kind;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public String getBucket() {
        return bucket;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }
}
