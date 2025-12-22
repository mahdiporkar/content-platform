package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.AuthTokenDto;
import com.contentplatform.backend.application.dto.LoginCommand;
import com.contentplatform.backend.application.exception.UnauthorizedException;
import com.contentplatform.backend.application.port.in.AuthUseCase;
import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.PasswordHasher;
import com.contentplatform.backend.application.port.out.TokenProvider;
import com.contentplatform.backend.domain.model.AdminUser;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements AuthUseCase {
    private final AdminUserRepository adminUserRepository;
    private final PasswordHasher passwordHasher;
    private final TokenProvider tokenProvider;

    public AuthService(AdminUserRepository adminUserRepository,
                       PasswordHasher passwordHasher,
                       TokenProvider tokenProvider) {
        this.adminUserRepository = adminUserRepository;
        this.passwordHasher = passwordHasher;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public AuthTokenDto login(LoginCommand command) {
        AdminUser user = adminUserRepository.findByEmail(command.getEmail())
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordHasher.matches(command.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return new AuthTokenDto(tokenProvider.generate(user));
    }
}
