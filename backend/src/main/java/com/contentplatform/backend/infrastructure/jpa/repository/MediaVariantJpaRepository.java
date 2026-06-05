package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.MediaVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MediaVariantJpaRepository extends JpaRepository<MediaVariantEntity, String> {
    List<MediaVariantEntity> findByMediaAssetId(String mediaAssetId);
    List<MediaVariantEntity> findByMediaAssetIdOrderBySortOrderDescUpdatedAtDesc(String mediaAssetId);
    Optional<MediaVariantEntity> findByIdAndMediaAssetId(String id, String mediaAssetId);
    Optional<MediaVariantEntity> findByMediaAssetIdAndIsDefaultTrue(String mediaAssetId);
    long countByMediaAssetIdAndIsDefaultTrue(String mediaAssetId);

    @Query("""
        select count(mv) > 0 from MediaVariantEntity mv
        where mv.mediaAssetId = :mediaAssetId
          and mv.purpose = :purpose
          and ((:sizeKey is null and mv.sizeKey is null) or mv.sizeKey = :sizeKey)
          and ((:device is null and mv.device is null) or mv.device = :device)
        """)
    boolean existsByMediaAssetIdAndPurposeAndSizeKeyAndDevice(@Param("mediaAssetId") String mediaAssetId,
                                                              @Param("purpose") String purpose,
                                                              @Param("sizeKey") String sizeKey,
                                                              @Param("device") String device);

    @Query("""
        select count(mv) > 0 from MediaVariantEntity mv
        where mv.mediaAssetId = :mediaAssetId
          and mv.purpose = :purpose
          and ((:sizeKey is null and mv.sizeKey is null) or mv.sizeKey = :sizeKey)
          and ((:device is null and mv.device is null) or mv.device = :device)
          and mv.id <> :variantId
        """)
    boolean existsDuplicateExcept(@Param("mediaAssetId") String mediaAssetId,
                                  @Param("purpose") String purpose,
                                  @Param("sizeKey") String sizeKey,
                                  @Param("device") String device,
                                  @Param("variantId") String variantId);

    @Modifying
    @Query("update MediaVariantEntity mv set mv.isDefault = false where mv.mediaAssetId = :mediaAssetId and mv.id <> :variantId")
    void clearDefaultExcept(@Param("mediaAssetId") String mediaAssetId, @Param("variantId") String variantId);

    void deleteByMediaAssetId(String mediaAssetId);
}
