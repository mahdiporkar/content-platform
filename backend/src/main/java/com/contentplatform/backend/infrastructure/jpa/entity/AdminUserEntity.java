package com.contentplatform.backend.infrastructure.jpa.entity;

import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admin_users")
public class AdminUserEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_user_applications", joinColumns = @JoinColumn(name = "admin_user_id"))
    @Column(name = "application_id", nullable = false, length = 36)
    private List<String> allowedApplicationIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_user_system_permissions", joinColumns = @JoinColumn(name = "admin_user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false, length = 64)
    private List<SystemPermission> systemPermissions = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_user_service_permissions", joinColumns = @JoinColumn(name = "admin_user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false, length = 64)
    private List<ServicePermission> servicePermissions = new ArrayList<>();

    protected AdminUserEntity() {
    }

    public AdminUserEntity(String id,
                           String email,
                           String passwordHash,
                           List<String> allowedApplicationIds,
                           List<SystemPermission> systemPermissions,
                           List<ServicePermission> servicePermissions) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.allowedApplicationIds = new ArrayList<>(allowedApplicationIds);
        this.systemPermissions = new ArrayList<>(systemPermissions);
        this.servicePermissions = new ArrayList<>(servicePermissions);
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
