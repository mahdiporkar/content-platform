package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UploadVideoCommand;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.application.port.in.VideoUseCase;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.request.ChangeStatusRequest;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import com.contentplatform.backend.interfaces.web.response.VideoResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    private final WebMapper mapper;

    public AdminVideoController(VideoUseCase videoUseCase, WebMapper mapper) {
        this.videoUseCase = videoUseCase;
        this.mapper = mapper;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoResponse> upload(@RequestParam("file") MultipartFile file,
                                                @RequestParam("title") String title,
                                                @RequestParam(value = "description", required = false) String description,
                                                @RequestParam("applicationId") String applicationId,
                                                @RequestParam("status") ContentStatus status) throws IOException {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        UploadVideoCommand command = new UploadVideoCommand(
            applicationId,
            title,
            description,
            status,
            file.getOriginalFilename(),
            file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
            file.getSize(),
            file.getInputStream()
        );
        VideoDto dto = videoUseCase.upload(command, allowed);
        return ResponseEntity.ok(mapper.toVideoResponse(dto, null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<VideoResponse> changeStatus(@PathVariable String id, @Valid @RequestBody ChangeStatusRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        VideoDto dto = videoUseCase.changeStatus(new ChangeStatusCommand(id, request.getApplicationId(), request.getStatus()), allowed);
        return ResponseEntity.ok(mapper.toVideoResponse(dto, null));
    }

    @GetMapping
    public ResponseEntity<PageResponse<VideoResponse>> list(@RequestParam String applicationId,
                                                            @RequestParam(required = false) ContentStatus status,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        PageResult<VideoDto> result = videoUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toVideoPage(result, video -> null));
    }
}
