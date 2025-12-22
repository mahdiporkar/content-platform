package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.VideoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoJpaRepository extends JpaRepository<VideoEntity, String> {
    Page<VideoEntity> findByApplicationId(String applicationId, Pageable pageable);
    Page<VideoEntity> findByApplicationIdAndStatus(String applicationId, ContentStatus status, Pageable pageable);
}
