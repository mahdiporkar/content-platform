package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.MenuEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuJpaRepository extends JpaRepository<MenuEntity, String> {
    Optional<MenuEntity> findByApplicationIdAndLanguageCodeAndCodeAndStatus(String applicationId, String languageCode, String code, MenuStatus status);
    List<MenuEntity> findByApplicationIdAndLanguageCodeAndLocationAndStatusOrderByUpdatedAtDesc(String applicationId, String languageCode, MenuLocation location, MenuStatus status);
    List<MenuEntity> findByApplicationIdOrderByUpdatedAtDesc(String applicationId);
    List<MenuEntity> findByApplicationIdAndLanguageCodeOrderByUpdatedAtDesc(String applicationId, String languageCode);
    List<MenuEntity> findByApplicationIdAndStatusOrderByUpdatedAtDesc(String applicationId, MenuStatus status);
    List<MenuEntity> findByApplicationIdAndLanguageCodeAndStatusOrderByUpdatedAtDesc(String applicationId, String languageCode, MenuStatus status);
    Optional<MenuEntity> findByApplicationIdAndCodeAndLanguageCode(String applicationId, String code, String languageCode);
}
