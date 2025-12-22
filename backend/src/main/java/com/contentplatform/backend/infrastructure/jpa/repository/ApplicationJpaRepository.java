package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationJpaRepository extends JpaRepository<ApplicationEntity, String> {
    ApplicationEntity findFirstByOrderByIdAsc();
}
