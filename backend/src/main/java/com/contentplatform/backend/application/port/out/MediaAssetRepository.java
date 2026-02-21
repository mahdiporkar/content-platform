package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;

import java.util.Optional;

public interface MediaAssetRepository {
    MediaAsset save(MediaAsset mediaAsset);
    Optional<MediaAsset> findById(String id);
    Optional<MediaAsset> findByApplicationIdAndObjectKey(String applicationId, String objectKey);
    PageSlice<MediaAsset> findByApplicationId(String applicationId, MediaAssetKind kind, String search, int page, int size);
}
