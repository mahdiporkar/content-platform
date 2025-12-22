package com.contentplatform.backend.application.dto;

import com.contentplatform.backend.domain.value.ContentStatus;

import java.io.InputStream;

public class UploadVideoCommand {
    private final String applicationId;
    private final String title;
    private final String description;
    private final ContentStatus status;
    private final String originalFileName;
    private final String contentType;
    private final long sizeBytes;
    private final InputStream inputStream;

    public UploadVideoCommand(String applicationId,
                              String title,
                              String description,
                              ContentStatus status,
                              String originalFileName,
                              String contentType,
                              long sizeBytes,
                              InputStream inputStream) {
        this.applicationId = applicationId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.inputStream = inputStream;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public InputStream getInputStream() {
        return inputStream;
    }
}
