package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UploadVideoCommand;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.List;

public interface VideoUseCase {
    VideoDto upload(UploadVideoCommand command, List<String> allowedApplicationIds);
    VideoDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds);
    PageResult<VideoDto> list(String applicationId, ContentStatus status, PageRequest pageRequest);
    String getPresignedUrl(String objectKey);
}
