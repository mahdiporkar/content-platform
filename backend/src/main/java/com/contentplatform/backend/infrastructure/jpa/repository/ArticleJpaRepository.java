package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.ArticleEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleJpaRepository extends JpaRepository<ArticleEntity, String> {
    Optional<ArticleEntity> findByApplicationIdAndSlug(String applicationId, String slug);
    Page<ArticleEntity> findByApplicationId(String applicationId, Pageable pageable);
    Page<ArticleEntity> findByApplicationIdAndStatus(String applicationId, ContentStatus status, Pageable pageable);
}
