package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.AuthTokenDto;
import com.contentplatform.backend.application.dto.LoginCommand;
import com.contentplatform.backend.application.exception.UnauthorizedException;
import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.PasswordHasher;
import com.contentplatform.backend.application.port.out.TokenProvider;
import com.contentplatform.backend.domain.model.AdminUser;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthServiceTest {

    @Test
    void loginReturnsTokenForValidCredentials() {
        AdminUser user = new AdminUser("user-1", "admin@example.com", "hashed", java.util.List.of("app-1"));
        AdminUserRepository repository = email -> Optional.of(user);
        PasswordHasher passwordHasher = (raw, hashed) -> true;
        TokenProvider tokenProvider = adminUser -> "token-123";

        AuthService service = new AuthService(repository, passwordHasher, tokenProvider);

        AuthTokenDto token = service.login(new LoginCommand("admin@example.com", "Admin123!"));

        assertThat(token.getToken()).isEqualTo("token-123");
    }

    @Test
    void loginThrowsWhenPasswordMismatch() {
        AdminUser user = new AdminUser("user-1", "admin@example.com", "hashed", java.util.List.of("app-1"));
        AdminUserRepository repository = email -> Optional.of(user);
        PasswordHasher passwordHasher = (raw, hashed) -> false;
        TokenProvider tokenProvider = adminUser -> "token-123";

        AuthService service = new AuthService(repository, passwordHasher, tokenProvider);

        assertThrows(UnauthorizedException.class,
            () -> service.login(new LoginCommand("admin@example.com", "wrong")));
    }
}
