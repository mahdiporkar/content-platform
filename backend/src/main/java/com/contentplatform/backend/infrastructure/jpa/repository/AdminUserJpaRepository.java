package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.AdminUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminUserJpaRepository extends JpaRepository<AdminUserEntity, String> {
    Optional<AdminUserEntity> findByEmail(String email);
}
