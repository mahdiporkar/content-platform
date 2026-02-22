package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.MediaReferenceDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.domain.value.MediaReferenceType;

import java.util.List;

public interface MediaLibraryUseCase {
    MediaAssetDto registerAsset(RegisterMediaAssetCommand command, List<String> allowedApplicationIds);
    PageResult<MediaAssetDto> list(String applicationId, MediaAssetKind kind, MediaAssetState state, String search, PageRequest pageRequest, List<String> allowedApplicationIds);
    MediaAssetDto getById(String id, String applicationId, List<String> allowedApplicationIds);
    MediaAssetDto trash(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds);
    MediaAssetDto restore(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds);
    MediaAssetDto purge(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds, boolean superAdmin);
    List<MediaReferenceDto> listReferences(String id, String applicationId, List<String> allowedApplicationIds);
    void addReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField);
    void removeReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField);
}
