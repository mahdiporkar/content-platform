package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.MediaReferenceType;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaReferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MediaReferenceJpaRepository extends JpaRepository<MediaReferenceEntity, String> {
    long countByApplicationIdAndMediaAssetId(String applicationId, String mediaAssetId);
    List<MediaReferenceEntity> findByApplicationIdAndMediaAssetId(String applicationId, String mediaAssetId);
    void deleteByApplicationIdAndRefTypeAndRefId(String applicationId, MediaReferenceType refType, String refId);
    Optional<MediaReferenceEntity> findByApplicationIdAndMediaAssetIdAndRefTypeAndRefIdAndRefField(
        String applicationId,
        String mediaAssetId,
        MediaReferenceType refType,
        String refId,
        String refField
    );
}
