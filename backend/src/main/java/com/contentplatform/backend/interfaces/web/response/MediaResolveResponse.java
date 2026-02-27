package com.contentplatform.backend.interfaces.web.response;

public class MediaResolveResponse {
    private final String mediaId;
    private final String variantId;
    private final String resolvedPurpose;
    private final String resolvedSize;
    private final String resolvedDevice;
    private final String url;
    private final Integer width;
    private final Integer height;
    private final Double duration;
    private final boolean fallbackUsed;

    public MediaResolveResponse(String mediaId,
                                String variantId,
                                String resolvedPurpose,
                                String resolvedSize,
                                String resolvedDevice,
                                String url,
                                Integer width,
                                Integer height,
                                Double duration,
                                boolean fallbackUsed) {
        this.mediaId = mediaId;
        this.variantId = variantId;
        this.resolvedPurpose = resolvedPurpose;
        this.resolvedSize = resolvedSize;
        this.resolvedDevice = resolvedDevice;
        this.url = url;
        this.width = width;
        this.height = height;
        this.duration = duration;
        this.fallbackUsed = fallbackUsed;
    }

    public String getMediaId() { return mediaId; }
    public String getVariantId() { return variantId; }
    public String getResolvedPurpose() { return resolvedPurpose; }
    public String getResolvedSize() { return resolvedSize; }
    public String getResolvedDevice() { return resolvedDevice; }
    public String getUrl() { return url; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public Double getDuration() { return duration; }
    public boolean isFallbackUsed() { return fallbackUsed; }
}
