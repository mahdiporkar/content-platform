package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.domain.value.TenantRouteStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.TenantRouteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRouteJpaRepository extends JpaRepository<TenantRouteEntity, String> {
    List<TenantRouteEntity> findByApplicationIdAndSource(String applicationId, String source);
    List<TenantRouteEntity> findByApplicationIdAndStatusOrderBySourceAscRouteKeyAsc(String applicationId, TenantRouteStatus status);
    Optional<TenantRouteEntity> findByApplicationIdAndSourceAndRouteKey(String applicationId, String source, String routeKey);
}
