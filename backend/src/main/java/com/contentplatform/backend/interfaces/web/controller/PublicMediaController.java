package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.MediaResolveResultDto;
import com.contentplatform.backend.application.dto.MediaVariantDto;
import com.contentplatform.backend.application.dto.MediaWithVariantsDto;
import com.contentplatform.backend.application.dto.ResolveMediaVariantQuery;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.interfaces.web.response.MediaAssetResponse;
import com.contentplatform.backend.interfaces.web.response.MediaResolveResponse;
import com.contentplatform.backend.interfaces.web.response.MediaVariantResponse;
import com.contentplatform.backend.interfaces.web.response.MediaWithVariantsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/{applicationId}/media")
public class PublicMediaController {
    private final MediaLibraryUseCase mediaLibraryUseCase;

    public PublicMediaController(MediaLibraryUseCase mediaLibraryUseCase) {
        this.mediaLibraryUseCase = mediaLibraryUseCase;
    }

    @GetMapping("/{mediaId}")
    public ResponseEntity<MediaWithVariantsResponse> getMedia(@PathVariable String applicationId,
                                                              @PathVariable String mediaId) {
        MediaWithVariantsDto dto = mediaLibraryUseCase.getMediaWithVariants(mediaId, applicationId);
        return ResponseEntity.ok(new MediaWithVariantsResponse(
            toMediaResponse(dto.media()),
            dto.variants().stream().map(this::toVariantResponse).toList()
        ));
    }

    @GetMapping("/{mediaId}/resolve")
    public ResponseEntity<MediaResolveResponse> resolve(@PathVariable String applicationId,
                                                        @PathVariable String mediaId,
                                                        @RequestParam(required = false) String purpose,
                                                        @RequestParam(required = false) String size,
                                                        @RequestParam(required = false) Integer viewportWidth,
                                                        @RequestParam(required = false) String device,
                                                        @RequestParam(required = false) String format) {
        MediaResolveResultDto dto = mediaLibraryUseCase.resolveVariant(
            mediaId,
            applicationId,
            new ResolveMediaVariantQuery(purpose, size, viewportWidth, device, format)
        );
        return ResponseEntity.ok(new MediaResolveResponse(
            dto.mediaId(),
            dto.variantId(),
            dto.resolvedPurpose(),
            dto.resolvedSize(),
            dto.resolvedDevice(),
            dto.url(),
            dto.width(),
            dto.height(),
            dto.duration(),
            dto.fallbackUsed()
        ));
    }

    private MediaAssetResponse toMediaResponse(MediaAssetDto dto) {
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

    private MediaVariantResponse toVariantResponse(MediaVariantDto dto) {
        return new MediaVariantResponse(
            dto.id(),
            dto.mediaAssetId(),
            dto.applicationId(),
            dto.purpose(),
            dto.sizeKey(),
            dto.minWidth(),
            dto.maxWidth(),
            dto.device(),
            dto.format(),
            dto.width(),
            dto.height(),
            dto.duration(),
            dto.bitrate(),
            dto.bucket(),
            dto.objectKey(),
            dto.fileUrl(),
            dto.sizeBytes(),
            dto.isDefault(),
            dto.sortOrder(),
            dto.createdAt(),
            dto.updatedAt()
        );
    }
}
