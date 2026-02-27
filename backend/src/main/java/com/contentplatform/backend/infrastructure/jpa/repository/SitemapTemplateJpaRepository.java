package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.SitemapTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SitemapTemplateJpaRepository extends JpaRepository<SitemapTemplateEntity, String> {
    List<SitemapTemplateEntity> findByTenantIdOrderByContentTypeAsc(String tenantId);
    Optional<SitemapTemplateEntity> findByTenantIdAndContentType(String tenantId, String contentType);
}

