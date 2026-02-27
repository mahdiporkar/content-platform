package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.SitemapUrlCheckEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SitemapUrlCheckJpaRepository extends JpaRepository<SitemapUrlCheckEntity, String> {
}

