package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.MediaAssetResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/media/library")
public class AdminMediaLibraryController {
    private final MediaLibraryUseCase mediaLibraryUseCase;

    public AdminMediaLibraryController(MediaLibraryUseCase mediaLibraryUseCase) {
        this.mediaLibraryUseCase = mediaLibraryUseCase;
    }

    @GetMapping
    public ResponseEntity<PageResponse<MediaAssetResponse>> list(@RequestParam String applicationId,
                                                                 @RequestParam(required = false) MediaAssetKind kind,
                                                                 @RequestParam(required = false) MediaAssetState state,
                                                                 @RequestParam(required = false) String search,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "30") int size) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        PageResult<MediaAssetDto> result = mediaLibraryUseCase.list(
            applicationId,
            kind,
            state,
            search,
            new PageRequest(page, size),
            allowed
        );
        List<MediaAssetResponse> items = result.getItems().stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(new PageResponse<>(items, result.getTotalElements(), result.getTotalPages(), result.getPage(), result.getSize()));
    }

    private MediaAssetResponse toResponse(MediaAssetDto dto) {
        return new MediaAssetResponse(
            dto.id(),
            dto.applicationId(),
            dto.ownerUserId(),
            dto.kind(),
            dto.state(),
            dto.bucket(),
            dto.objectKey(),
            dto.originalName(),
            dto.contentType(),
            dto.sizeBytes(),
            dto.url(),
            dto.trashedAt(),
            dto.purgedAt(),
            dto.deletedByUserId(),
            dto.pinned(),
            dto.refCount(),
            dto.canPurge(),
            dto.createdAt(),
            dto.updatedAt()
        );
    }
}
