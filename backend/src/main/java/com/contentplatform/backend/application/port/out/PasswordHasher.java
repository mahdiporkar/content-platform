package com.contentplatform.backend.application.port.out;

public interface PasswordHasher {
    boolean matches(String rawPassword, String hashedPassword);
}
