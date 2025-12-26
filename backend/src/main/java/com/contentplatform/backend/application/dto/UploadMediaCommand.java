package com.contentplatform.backend.application.dto;

import java.io.InputStream;

public class UploadMediaCommand {
    private final String applicationId;
    private final String kind;
    private final String originalFileName;
    private final String contentType;
    private final long sizeBytes;
    private final InputStream inputStream;

    public UploadMediaCommand(String applicationId,
                              String kind,
                              String originalFileName,
                              String contentType,
                              long sizeBytes,
                              InputStream inputStream) {
        this.applicationId = applicationId;
        this.kind = kind;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.inputStream = inputStream;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getKind() {
        return kind;
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
