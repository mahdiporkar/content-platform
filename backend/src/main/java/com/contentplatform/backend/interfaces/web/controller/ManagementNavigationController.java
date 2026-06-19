package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.service.TenantRouteService;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.interfaces.web.request.TenantRouteSyncRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/v1/management/navigation")
public class ManagementNavigationController {
    private final TenantRouteService routeService;
    private final ApplicationJpaRepository applicationRepo;
    private final PasswordEncoder passwordEncoder;
    public ManagementNavigationController(TenantRouteService routeService, ApplicationJpaRepository applicationRepo,
                                          PasswordEncoder passwordEncoder) {
        this.routeService = routeService; this.applicationRepo = applicationRepo; this.passwordEncoder = passwordEncoder;
    }

    @PutMapping("/routes")
    public ResponseEntity<Map<String, Object>> sync(
        @RequestHeader("X-Application-Id") String applicationId,
        @RequestHeader("Authorization") String authorization,
        @Valid @RequestBody TenantRouteSyncRequest request
    ) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7).trim() : null;
        ApplicationEntity application = applicationRepo.findById(applicationId)
            .orElseThrow(() -> new ForbiddenException("Invalid management credentials."));
        if (token == null || application.getManagementTokenHash() == null
            || !passwordEncoder.matches(token, application.getManagementTokenHash())) {
            throw new ForbiddenException("Invalid management credentials.");
        }
        return ResponseEntity.ok(routeService.sync(applicationId, request));
    }
}
