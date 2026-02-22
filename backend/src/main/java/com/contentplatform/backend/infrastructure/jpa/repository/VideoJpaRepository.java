package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.VideoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VideoJpaRepository extends JpaRepository<VideoEntity, String> {
    Page<VideoEntity> findByApplicationIdAndDeletedAtIsNull(String applicationId, Pageable pageable);
    Page<VideoEntity> findByApplicationIdAndStatusAndDeletedAtIsNull(String applicationId, ContentStatus status, Pageable pageable);
    Page<VideoEntity> findByApplicationIdAndDeletedAtIsNotNull(String applicationId, Pageable pageable);
    Page<VideoEntity> findByApplicationIdAndStatusAndDeletedAtIsNotNull(String applicationId, ContentStatus status, Pageable pageable);
    List<VideoEntity> findAllByApplicationId(String applicationId);
}
