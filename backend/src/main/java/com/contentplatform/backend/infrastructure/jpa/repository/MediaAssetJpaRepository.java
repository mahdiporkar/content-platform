package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaAssetEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MediaAssetJpaRepository extends JpaRepository<MediaAssetEntity, String> {
    Optional<MediaAssetEntity> findByApplicationIdAndObjectKey(String applicationId, String objectKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MediaAssetEntity m where m.id = :id")
    Optional<MediaAssetEntity> findByIdForUpdate(@Param("id") String id);

    @Query("""
        select m from MediaAssetEntity m
        where m.applicationId = :applicationId
          and (:kind is null or m.kind = :kind)
          and (:state is null or m.state = :state)
          and (
            :search is null
            or lower(m.objectKey) like lower(concat('%', :search, '%'))
            or lower(coalesce(m.originalName, '')) like lower(concat('%', :search, '%'))
          )
        """)
    Page<MediaAssetEntity> searchByApplicationId(
        @Param("applicationId") String applicationId,
        @Param("kind") MediaAssetKind kind,
        @Param("state") MediaAssetState state,
        @Param("search") String search,
        Pageable pageable
    );
}
