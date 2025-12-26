package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.MediaUploadDto;
import com.contentplatform.backend.application.dto.UploadMediaCommand;

import java.util.List;

public interface MediaUseCase {
    MediaUploadDto upload(UploadMediaCommand command, List<String> allowedApplicationIds);
}
