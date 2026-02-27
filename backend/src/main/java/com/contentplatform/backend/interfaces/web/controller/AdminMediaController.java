package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaUploadDto;
import com.contentplatform.backend.application.dto.MediaVariantDto;
import com.contentplatform.backend.application.dto.UploadMediaCommand;
import com.contentplatform.backend.application.dto.UpsertMediaVariantCommand;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.port.in.MediaUseCase;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.MediaUploadResponse;
import com.contentplatform.backend.interfaces.web.response.MediaVariantResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/media")
public class AdminMediaController {
    private final MediaUseCase mediaUseCase;
    private final MediaLibraryUseCase mediaLibraryUseCase;

    public AdminMediaController(MediaUseCase mediaUseCase, MediaLibraryUseCase mediaLibraryUseCase) {
        this.mediaUseCase = mediaUseCase;
        this.mediaLibraryUseCase = mediaLibraryUseCase;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                      @RequestParam("applicationId") String applicationId,
                                                      @RequestParam(value = "kind", required = false) String kind) throws IOException {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        UploadMediaCommand command = new UploadMediaCommand(
            applicationId,
            kind,
            file.getOriginalFilename(),
            file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
            file.getSize(),
            file.getInputStream()
        );
        MediaUploadDto dto = mediaUseCase.upload(command, allowed);
        return ResponseEntity.ok(new MediaUploadResponse(dto.objectKey(), dto.contentType(), dto.sizeBytes(), dto.url()));
    }

    @GetMapping("/{mediaId}/variants")
    public ResponseEntity<List<MediaVariantResponse>> listVariants(@PathVariable String mediaId,
                                                                   @RequestParam("applicationId") String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        List<MediaVariantResponse> items = mediaLibraryUseCase.listVariants(mediaId, applicationId, allowed)
            .stream()
            .map(this::toVariantResponse)
            .toList();
        return ResponseEntity.ok(items);
    }

    @PostMapping(value = "/{mediaId}/variants", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaVariantResponse> addVariant(@PathVariable String mediaId,
                                                           @RequestParam("applicationId") String applicationId,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(value = "purpose", required = false) String purpose,
                                                           @RequestParam(value = "sizeKey", required = false) String sizeKey,
                                                           @RequestParam(value = "minWidth", required = false) Integer minWidth,
                                                           @RequestParam(value = "maxWidth", required = false) Integer maxWidth,
                                                           @RequestParam(value = "device", required = false) String device,
                                                           @RequestParam(value = "format", required = false) String format,
                                                           @RequestParam(value = "isDefault", required = false) Boolean isDefault,
                                                           @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
                                                           @RequestParam(value = "width", required = false) Integer width,
                                                           @RequestParam(value = "height", required = false) Integer height,
                                                           @RequestParam(value = "duration", required = false) Double duration,
                                                           @RequestParam(value = "bitrate", required = false) Integer bitrate) throws IOException {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        MediaVariantDto dto = mediaLibraryUseCase.addVariant(
            mediaId,
            applicationId,
            new UpsertMediaVariantCommand(
                purpose,
                sizeKey,
                minWidth,
                maxWidth,
                device,
                format,
                width,
                height,
                duration,
                bitrate,
                isDefault,
                sortOrder,
                file.getOriginalFilename(),
                file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                file.getSize(),
                file.getInputStream()
            ),
            allowed
        );
        return ResponseEntity.ok(toVariantResponse(dto));
    }

    @PutMapping(value = "/{mediaId}/variants/{variantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaVariantResponse> replaceVariant(@PathVariable String mediaId,
                                                               @PathVariable String variantId,
                                                               @RequestParam("applicationId") String applicationId,
                                                               @RequestParam(value = "file", required = false) MultipartFile file,
                                                               @RequestParam(value = "purpose", required = false) String purpose,
                                                               @RequestParam(value = "sizeKey", required = false) String sizeKey,
                                                               @RequestParam(value = "minWidth", required = false) Integer minWidth,
                                                               @RequestParam(value = "maxWidth", required = false) Integer maxWidth,
                                                               @RequestParam(value = "device", required = false) String device,
                                                               @RequestParam(value = "format", required = false) String format,
                                                               @RequestParam(value = "isDefault", required = false) Boolean isDefault,
                                                               @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
                                                               @RequestParam(value = "width", required = false) Integer width,
                                                               @RequestParam(value = "height", required = false) Integer height,
                                                               @RequestParam(value = "duration", required = false) Double duration,
                                                               @RequestParam(value = "bitrate", required = false) Integer bitrate) throws IOException {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        UpsertMediaVariantCommand command = new UpsertMediaVariantCommand(
            purpose,
            sizeKey,
            minWidth,
            maxWidth,
            device,
            format,
            width,
            height,
            duration,
            bitrate,
            isDefault,
            sortOrder,
            file == null ? null : file.getOriginalFilename(),
            file == null ? null : (file.getContentType() == null ? "application/octet-stream" : file.getContentType()),
            file == null ? null : file.getSize(),
            file == null ? null : file.getInputStream()
        );
        MediaVariantDto dto = mediaLibraryUseCase.replaceVariant(mediaId, variantId, applicationId, command, allowed);
        return ResponseEntity.ok(toVariantResponse(dto));
    }

    @DeleteMapping("/{mediaId}/variants/{variantId}")
    public ResponseEntity<Void> deleteVariant(@PathVariable String mediaId,
                                              @PathVariable String variantId,
                                              @RequestParam("applicationId") String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.MEDIA_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        mediaLibraryUseCase.deleteVariant(mediaId, variantId, applicationId, allowed);
        return ResponseEntity.noContent().build();
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
