package com.contentplatform.backend.domain.model;

import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;

import java.util.List;
import java.util.Objects;

public class AdminUser {
    private final String id;
    private final String email;
    private final String passwordHash;
    private final List<String> allowedApplicationIds;
    private final List<SystemPermission> systemPermissions;
    private final List<ServicePermission> servicePermissions;

    public AdminUser(String id,
                     String email,
                     String passwordHash,
                     List<String> allowedApplicationIds,
                     List<SystemPermission> systemPermissions,
                     List<ServicePermission> servicePermissions) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.email = Objects.requireNonNull(email, "email must not be null");
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash must not be null");
        this.allowedApplicationIds = List.copyOf(Objects.requireNonNull(allowedApplicationIds, "allowedApplicationIds must not be null"));
        this.systemPermissions = List.copyOf(Objects.requireNonNull(systemPermissions, "systemPermissions must not be null"));
        this.servicePermissions = List.copyOf(Objects.requireNonNull(servicePermissions, "servicePermissions must not be null"));
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public List<String> getAllowedApplicationIds() {
        return allowedApplicationIds;
    }

    public List<SystemPermission> getSystemPermissions() {
        return systemPermissions;
    }

    public List<ServicePermission> getServicePermissions() {
        return servicePermissions;
    }
}
