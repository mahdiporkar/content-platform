package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.domain.value.MediaAssetKind;

import java.util.List;

public interface MediaLibraryUseCase {
    MediaAssetDto registerAsset(RegisterMediaAssetCommand command, List<String> allowedApplicationIds);
    PageResult<MediaAssetDto> list(String applicationId, MediaAssetKind kind, String search, PageRequest pageRequest, List<String> allowedApplicationIds);
    MediaAssetDto getById(String id, String applicationId, List<String> allowedApplicationIds);
}
