package com.contentplatform.backend.infrastructure.security;

import com.contentplatform.backend.application.port.out.PasswordHasher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordHasher implements PasswordHasher {
    private final PasswordEncoder passwordEncoder;

    public BCryptPasswordHasher(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public boolean matches(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}
