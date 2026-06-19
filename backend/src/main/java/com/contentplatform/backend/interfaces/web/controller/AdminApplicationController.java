package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.ApplicationDto;
import com.contentplatform.backend.application.dto.CreateApplicationCommand;
import com.contentplatform.backend.application.dto.GalleryImageDto;
import com.contentplatform.backend.application.dto.UpdateApplicationCommand;
import com.contentplatform.backend.application.port.in.ApplicationUseCase;
import com.contentplatform.backend.domain.value.SystemPermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.request.ApplicationUpsertRequest;
import com.contentplatform.backend.interfaces.web.response.ApplicationResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/v1/admin/applications")
public class AdminApplicationController {
    private final ApplicationUseCase applicationUseCase;
    private final WebMapper mapper;
    private final ApplicationJpaRepository applicationRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminApplicationController(ApplicationUseCase applicationUseCase, WebMapper mapper,
                                      ApplicationJpaRepository applicationRepo, PasswordEncoder passwordEncoder) {
        this.applicationUseCase = applicationUseCase;
        this.mapper = mapper;
        this.applicationRepo = applicationRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> list() {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        List<ApplicationResponse> items = applicationUseCase.list().stream()
            .map(mapper::toApplicationResponse)
            .toList();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getById(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        ApplicationDto dto = applicationUseCase.getById(id);
        return ResponseEntity.ok(mapper.toApplicationResponse(dto));
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(@Valid @RequestBody ApplicationUpsertRequest request) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        ApplicationDto dto = applicationUseCase.create(
            new CreateApplicationCommand(
                request.getId(),
                request.getName(),
                request.getWebsiteUrl(),
                request.getApiToken(),
                mapGallery(request)
            )
        );
        return ResponseEntity.ok(mapper.toApplicationResponse(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationResponse> update(@PathVariable String id, @Valid @RequestBody ApplicationUpsertRequest request) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        ApplicationDto dto = applicationUseCase.update(
            new UpdateApplicationCommand(
                id,
                request.getName(),
                request.getWebsiteUrl(),
                request.getApiToken(),
                mapGallery(request)
            )
        );
        return ResponseEntity.ok(mapper.toApplicationResponse(dto));
    }

    @PostMapping("/{id}/token/rotate")
    public ResponseEntity<ApplicationResponse> rotateToken(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        ApplicationDto dto = applicationUseCase.rotateToken(id);
        return ResponseEntity.ok(mapper.toApplicationResponse(dto));
    }

    @PostMapping("/{id}/token/revoke")
    public ResponseEntity<ApplicationResponse> revokeToken(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        ApplicationDto dto = applicationUseCase.revokeToken(id);
        return ResponseEntity.ok(mapper.toApplicationResponse(dto));
    }

    @PostMapping("/{id}/management-token/rotate")
    public ResponseEntity<Map<String, String>> rotateManagementToken(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        var application = applicationRepo.findById(id).orElseThrow(() -> new com.contentplatform.backend.application.exception.NotFoundException("Application not found"));
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        application.setManagementTokenHash(passwordEncoder.encode(token));
        applicationRepo.save(application);
        return ResponseEntity.ok(Map.of("id", id, "managementToken", token));
    }

    @PostMapping("/{id}/management-token/revoke")
    public ResponseEntity<Map<String, String>> revokeManagementToken(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        var application = applicationRepo.findById(id).orElseThrow(() -> new com.contentplatform.backend.application.exception.NotFoundException("Application not found"));
        application.setManagementTokenHash(null);
        applicationRepo.save(application);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        SecurityUtils.requireSystemPermission(SystemPermission.APPLICATIONS_MANAGE);
        applicationUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }

    private List<GalleryImageDto> mapGallery(ApplicationUpsertRequest request) {
        if (request.getGallery() == null) {
            return List.of();
        }
        return request.getGallery().stream()
            .map(image -> new GalleryImageDto(image.getUrl(), image.getAlt(), image.getCaption()))
            .toList();
    }
}
