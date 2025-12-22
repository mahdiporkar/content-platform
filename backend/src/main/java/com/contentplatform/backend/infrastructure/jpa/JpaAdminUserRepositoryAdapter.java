package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.infrastructure.jpa.entity.AdminUserEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.AdminUserJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaAdminUserRepositoryAdapter implements AdminUserRepository {
    private final AdminUserJpaRepository repository;

    public JpaAdminUserRepositoryAdapter(AdminUserJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<AdminUser> findByEmail(String email) {
        return repository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public AdminUser save(AdminUser adminUser) {
        AdminUserEntity entity = new AdminUserEntity(
            adminUser.getId(),
            adminUser.getEmail(),
            adminUser.getPasswordHash(),
            adminUser.getAllowedApplicationIds()
        );
        return toDomain(repository.save(entity));
    }

    private AdminUser toDomain(AdminUserEntity entity) {
        return new AdminUser(
            entity.getId(),
            entity.getEmail(),
            entity.getPasswordHash(),
            entity.getAllowedApplicationIds()
        );
    }
}
