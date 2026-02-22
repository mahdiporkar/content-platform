package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.MediaAssetResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final MediaLibraryUseCase mediaLibraryUseCase;

    public MediaController(MediaLibraryUseCase mediaLibraryUseCase) {
        this.mediaLibraryUseCase = mediaLibraryUseCase;
    }

    @GetMapping
    public ResponseEntity<PageResponse<MediaAssetResponse>> list(@RequestParam String applicationId,
                                                                 @RequestParam(defaultValue = "ACTIVE") MediaAssetState state,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "30") int size) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        PageResult<MediaAssetDto> result = mediaLibraryUseCase.list(applicationId, null, state, null, new PageRequest(page, size), allowed);
        return ResponseEntity.ok(new PageResponse<>(
            result.getItems().stream().map(this::toResponse).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.getPage(),
            result.getSize()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MediaAssetResponse> trash(@PathVariable String id,
                                                    @RequestParam String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        MediaAssetDto dto = mediaLibraryUseCase.trash(id, applicationId, SecurityUtils.userIdOrNull(), allowed);
        return ResponseEntity.ok(toResponse(dto));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<MediaAssetResponse> restore(@PathVariable String id,
                                                      @RequestParam String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        MediaAssetDto dto = mediaLibraryUseCase.restore(id, applicationId, SecurityUtils.userIdOrNull(), allowed);
        return ResponseEntity.ok(toResponse(dto));
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
