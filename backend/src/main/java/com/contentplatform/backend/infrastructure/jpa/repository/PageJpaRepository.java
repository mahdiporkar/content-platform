package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.PageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PageJpaRepository extends JpaRepository<PageEntity, String> {
    boolean existsByApplicationIdAndLanguageCodeAndSlug(String applicationId, String languageCode, String slug);
    boolean existsByApplicationIdAndLanguageCodeAndSlugAndIdNot(String applicationId, String languageCode, String slug, String id);
    Optional<PageEntity> findByApplicationIdAndLanguageCodeAndSlugAndStatus(String applicationId, String languageCode, String slug, ContentStatus status);
    List<PageEntity> findByApplicationIdAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(String applicationId, ContentStatus status);
    List<PageEntity> findByApplicationIdAndLanguageCodeAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(String applicationId, String languageCode, ContentStatus status);
    Page<PageEntity> findByApplicationId(String applicationId, Pageable pageable);
    Page<PageEntity> findByApplicationIdAndStatus(String applicationId, ContentStatus status, Pageable pageable);
    Page<PageEntity> findByApplicationIdAndLanguageCode(String applicationId, String languageCode, Pageable pageable);
    Page<PageEntity> findByApplicationIdAndLanguageCodeAndStatus(String applicationId, String languageCode, ContentStatus status, Pageable pageable);
}
