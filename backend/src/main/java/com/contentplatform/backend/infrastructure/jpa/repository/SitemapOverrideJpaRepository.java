package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.SitemapOverrideEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SitemapOverrideJpaRepository extends JpaRepository<SitemapOverrideEntity, String> {
    List<SitemapOverrideEntity> findByTenantId(String tenantId);
    Optional<SitemapOverrideEntity> findByTenantIdAndContentTypeAndContentId(String tenantId, String contentType, String contentId);
}

