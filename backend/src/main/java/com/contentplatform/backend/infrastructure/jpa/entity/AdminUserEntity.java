package com.contentplatform.backend.infrastructure.jpa.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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

    protected AdminUserEntity() {
    }

    public AdminUserEntity(String id, String email, String passwordHash, List<String> allowedApplicationIds) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.allowedApplicationIds = new ArrayList<>(allowedApplicationIds);
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
}
