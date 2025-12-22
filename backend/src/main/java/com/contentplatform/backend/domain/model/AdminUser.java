package com.contentplatform.backend.domain.model;

import java.util.List;
import java.util.Objects;

public class AdminUser {
    private final String id;
    private final String email;
    private final String passwordHash;
    private final List<String> allowedApplicationIds;

    public AdminUser(String id, String email, String passwordHash, List<String> allowedApplicationIds) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.email = Objects.requireNonNull(email, "email must not be null");
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash must not be null");
        this.allowedApplicationIds = List.copyOf(Objects.requireNonNull(allowedApplicationIds, "allowedApplicationIds must not be null"));
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
