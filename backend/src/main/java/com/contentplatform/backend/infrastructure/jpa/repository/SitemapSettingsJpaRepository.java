package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.SitemapSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SitemapSettingsJpaRepository extends JpaRepository<SitemapSettingsEntity, String> {
}

