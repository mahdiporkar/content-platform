package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.AuthTokenDto;
import com.contentplatform.backend.application.dto.LoginCommand;
import com.contentplatform.backend.application.port.in.AuthUseCase;
import com.contentplatform.backend.interfaces.web.request.LoginRequest;
import com.contentplatform.backend.interfaces.web.response.AuthResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthUseCase authUseCase;

    public AuthController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthTokenDto token = authUseCase.login(new LoginCommand(request.getEmail(), request.getPassword()));
        return ResponseEntity.ok(new AuthResponse(token.getToken()));
    }
}
