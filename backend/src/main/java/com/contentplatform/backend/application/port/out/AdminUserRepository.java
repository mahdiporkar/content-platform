package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.AdminUser;

import java.util.Optional;

public interface AdminUserRepository {
    Optional<AdminUser> findByEmail(String email);
    AdminUser save(AdminUser adminUser);
}
