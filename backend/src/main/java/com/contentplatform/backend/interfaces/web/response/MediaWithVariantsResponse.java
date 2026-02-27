package com.contentplatform.backend.interfaces.web.response;

import java.util.List;

public class MediaWithVariantsResponse {
    private final MediaAssetResponse media;
    private final List<MediaVariantResponse> variants;

    public MediaWithVariantsResponse(MediaAssetResponse media, List<MediaVariantResponse> variants) {
        this.media = media;
        this.variants = variants;
    }

    public MediaAssetResponse getMedia() {
        return media;
    }

    public List<MediaVariantResponse> getVariants() {
        return variants;
    }
}
