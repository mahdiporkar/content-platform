package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.MediaVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaVariantJpaRepository extends JpaRepository<MediaVariantEntity, String> {
    List<MediaVariantEntity> findByMediaAssetId(String mediaAssetId);
    void deleteByMediaAssetId(String mediaAssetId);
}
