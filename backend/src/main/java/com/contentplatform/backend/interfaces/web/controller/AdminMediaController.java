package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.MediaUploadDto;
import com.contentplatform.backend.application.dto.UploadMediaCommand;
import com.contentplatform.backend.application.port.in.MediaUseCase;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.MediaUploadResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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

    public AdminMediaController(MediaUseCase mediaUseCase) {
        this.mediaUseCase = mediaUseCase;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                      @RequestParam("applicationId") String applicationId,
                                                      @RequestParam(value = "kind", required = false) String kind) throws IOException {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
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
}
