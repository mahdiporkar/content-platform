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

@RestController
@RequestMapping("/api/v1/admin/applications")
public class AdminApplicationController {
    private final ApplicationUseCase applicationUseCase;
    private final WebMapper mapper;

    public AdminApplicationController(ApplicationUseCase applicationUseCase, WebMapper mapper) {
        this.applicationUseCase = applicationUseCase;
        this.mapper = mapper;
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
