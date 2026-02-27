package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.SitemapCustomUrlEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SitemapCustomUrlJpaRepository extends JpaRepository<SitemapCustomUrlEntity, String> {
    List<SitemapCustomUrlEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<SitemapCustomUrlEntity> findByTenantIdAndEnabledTrue(String tenantId);
    Optional<SitemapCustomUrlEntity> findByIdAndTenantId(String id, String tenantId);
}

