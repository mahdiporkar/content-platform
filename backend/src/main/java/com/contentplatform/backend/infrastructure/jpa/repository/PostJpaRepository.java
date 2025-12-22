package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.PostEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostJpaRepository extends JpaRepository<PostEntity, String> {
    Optional<PostEntity> findByApplicationIdAndSlug(String applicationId, String slug);
    Page<PostEntity> findByApplicationId(String applicationId, Pageable pageable);
    Page<PostEntity> findByApplicationIdAndStatus(String applicationId, ContentStatus status, Pageable pageable);
}
