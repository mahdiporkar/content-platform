package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.MediaReferenceDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.service.PublicMediaUrlService;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.MediaAssetResponse;
import com.contentplatform.backend.interfaces.web.response.MediaReferenceResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/media")
public class AdminMediaSafetyController {
    private final MediaLibraryUseCase mediaLibraryUseCase;
    private final PublicMediaUrlService publicMediaUrlService;

    public AdminMediaSafetyController(MediaLibraryUseCase mediaLibraryUseCase, PublicMediaUrlService publicMediaUrlService) {
        this.mediaLibraryUseCase = mediaLibraryUseCase;
        this.publicMediaUrlService = publicMediaUrlService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<MediaAssetResponse>> list(@RequestParam String applicationId,
                                                                 @RequestParam(defaultValue = "TRASH") MediaAssetState state,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "30") int size) {
        SecurityUtils.requireSuperAdmin();
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

    @GetMapping("/{id}/references")
    public ResponseEntity<List<MediaReferenceResponse>> references(@PathVariable String id,
                                                                   @RequestParam String applicationId) {
        SecurityUtils.requireSuperAdmin();
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        List<MediaReferenceDto> refs = mediaLibraryUseCase.listReferences(id, applicationId, allowed);
        return ResponseEntity.ok(refs.stream().map(entry -> new MediaReferenceResponse(
            entry.id(),
            entry.applicationId(),
            entry.mediaAssetId(),
            entry.refType(),
            entry.refId(),
            entry.refField(),
            entry.createdAt()
        )).toList());
    }

    @DeleteMapping("/{id}/purge")
    public ResponseEntity<MediaAssetResponse> purge(@PathVariable String id,
                                                    @RequestParam String applicationId) {
        SecurityUtils.requireSuperAdmin();
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        MediaAssetDto dto = mediaLibraryUseCase.purge(id, applicationId, SecurityUtils.userIdOrNull(), allowed, true);
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
            publicMediaUrlService.toPublicMediaUrl(dto.applicationId(), dto.url()),
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
