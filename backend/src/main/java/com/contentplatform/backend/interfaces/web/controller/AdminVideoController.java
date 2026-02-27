package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreateVideoFromAssetCommand;
import com.contentplatform.backend.application.dto.MediaReferenceDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UploadVideoCommand;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.application.port.in.VideoUseCase;
import com.contentplatform.backend.application.service.SitemapService;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.request.ChangeStatusRequest;
import com.contentplatform.backend.interfaces.web.request.CreateVideoFromAssetRequest;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import com.contentplatform.backend.interfaces.web.response.MediaReferenceResponse;
import com.contentplatform.backend.interfaces.web.response.VideoResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/videos")
public class AdminVideoController {
    private final VideoUseCase videoUseCase;
    private final SitemapService sitemapService;
    private final WebMapper mapper;

    public AdminVideoController(VideoUseCase videoUseCase, SitemapService sitemapService, WebMapper mapper) {
        this.videoUseCase = videoUseCase;
        this.sitemapService = sitemapService;
        this.mapper = mapper;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoResponse> upload(@RequestParam("file") MultipartFile file,
                                                @RequestParam("title") String title,
                                                @RequestParam(value = "description", required = false) String description,
                                                @RequestParam("applicationId") String applicationId,
                                                @RequestParam("status") ContentStatus status,
                                                @RequestParam(value = "locale", required = false) String locale) throws IOException {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        UploadVideoCommand command = new UploadVideoCommand(
            applicationId,
            title,
            description,
            status,
            locale,
            file.getOriginalFilename(),
            file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
            file.getSize(),
            file.getInputStream()
        );
        VideoDto dto = videoUseCase.upload(command, allowed);
        sitemapService.invalidateTenantCacheIfOnPublish(applicationId);
        return ResponseEntity.ok(mapper.toVideoResponse(dto, videoUseCase.getPresignedUrl(dto.getObjectKey())));
    }

    @PostMapping("/create-from-asset")
    public ResponseEntity<VideoResponse> createFromAsset(@Valid @RequestBody CreateVideoFromAssetRequest request) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(request.getApplicationId());
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(request.getApplicationId());
        VideoDto dto = videoUseCase.createFromAsset(
            new CreateVideoFromAssetCommand(
                request.getApplicationId(),
                request.getAssetId(),
                request.getTitle(),
                request.getDescription(),
                request.getStatus(),
                request.getLocale()
            ),
            allowed
        );
        sitemapService.invalidateTenantCacheIfOnPublish(request.getApplicationId());
        return ResponseEntity.ok(mapper.toVideoResponse(dto, videoUseCase.getPresignedUrl(dto.getObjectKey())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<VideoResponse> changeStatus(@PathVariable String id, @Valid @RequestBody ChangeStatusRequest request) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(request.getApplicationId());
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(request.getApplicationId());
        VideoDto dto = videoUseCase.changeStatus(new ChangeStatusCommand(id, request.getApplicationId(), request.getStatus()), allowed);
        sitemapService.invalidateTenantCacheIfOnPublish(request.getApplicationId());
        return ResponseEntity.ok(mapper.toVideoResponse(dto, videoUseCase.getPresignedUrl(dto.getObjectKey())));
    }

    @GetMapping
    public ResponseEntity<PageResponse<VideoResponse>> list(@RequestParam String applicationId,
                                                            @RequestParam(required = false) ContentStatus status,
                                                            @RequestParam(defaultValue = "false") boolean deleted,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        PageResult<VideoDto> result = videoUseCase.list(applicationId, status, new PageRequest(page, size), deleted);
        return ResponseEntity.ok(mapper.toVideoPage(result, video -> videoUseCase.getPresignedUrl(video.getObjectKey())));
    }

    @GetMapping("/{id}/usages")
    public ResponseEntity<List<MediaReferenceResponse>> usages(@PathVariable String id,
                                                               @RequestParam String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        List<MediaReferenceDto> refs = videoUseCase.listUsages(id, applicationId, allowed);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<VideoResponse> delete(@PathVariable String id,
                                                @RequestParam String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        VideoDto dto = videoUseCase.delete(id, applicationId, allowed);
        sitemapService.invalidateTenantCacheIfOnPublish(applicationId);
        return ResponseEntity.ok(mapper.toVideoResponse(dto, videoUseCase.getPresignedUrl(dto.getObjectKey())));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<VideoResponse> restore(@PathVariable String id,
                                                 @RequestParam String applicationId) {
        SecurityUtils.requireServicePermission(ServicePermission.VIDEOS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        List<String> allowed = SecurityUtils.resolveAllowedApplicationIdsFor(applicationId);
        VideoDto dto = videoUseCase.restore(id, applicationId, allowed);
        sitemapService.invalidateTenantCacheIfOnPublish(applicationId);
        return ResponseEntity.ok(mapper.toVideoResponse(dto, videoUseCase.getPresignedUrl(dto.getObjectKey())));
    }
}
