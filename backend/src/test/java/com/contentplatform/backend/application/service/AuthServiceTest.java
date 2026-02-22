package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.AuthTokenDto;
import com.contentplatform.backend.application.dto.LoginCommand;
import com.contentplatform.backend.application.exception.UnauthorizedException;
import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.PasswordHasher;
import com.contentplatform.backend.application.port.out.TokenProvider;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void loginReturnsTokenForValidCredentials() {
        AdminUser user = new AdminUser(
            "user-1",
            "admin@example.com",
            "hashed",
            java.util.List.of("app-1"),
            java.util.List.of(SystemPermission.APPLICATIONS_MANAGE),
            java.util.List.of(ServicePermission.POSTS_MANAGE)
        );
        AdminUserRepository repository = mock(AdminUserRepository.class);
        when(repository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        PasswordHasher passwordHasher = (raw, hashed) -> true;
        TokenProvider tokenProvider = adminUser -> "token-123";

        AuthService service = new AuthService(repository, passwordHasher, tokenProvider);

        AuthTokenDto token = service.login(new LoginCommand("admin@example.com", "Admin123!"));

        assertThat(token.getToken()).isEqualTo("token-123");
    }

    @Test
    void loginThrowsWhenPasswordMismatch() {
        AdminUser user = new AdminUser(
            "user-1",
            "admin@example.com",
            "hashed",
            java.util.List.of("app-1"),
            java.util.List.of(SystemPermission.APPLICATIONS_MANAGE),
            java.util.List.of(ServicePermission.POSTS_MANAGE)
        );
        AdminUserRepository repository = mock(AdminUserRepository.class);
        when(repository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        PasswordHasher passwordHasher = (raw, hashed) -> false;
        TokenProvider tokenProvider = adminUser -> "token-123";

        AuthService service = new AuthService(repository, passwordHasher, tokenProvider);

        assertThrows(UnauthorizedException.class,
            () -> service.login(new LoginCommand("admin@example.com", "wrong")));
    }
}
