package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.MediaResolveResultDto;
import com.contentplatform.backend.application.dto.MediaReferenceDto;
import com.contentplatform.backend.application.dto.MediaVariantDto;
import com.contentplatform.backend.application.dto.MediaWithVariantsDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.dto.ResolveMediaVariantQuery;
import com.contentplatform.backend.application.dto.UpsertMediaVariantCommand;
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
    List<MediaVariantDto> listVariants(String mediaAssetId, String applicationId, List<String> allowedApplicationIds);
    MediaVariantDto addVariant(String mediaAssetId, String applicationId, UpsertMediaVariantCommand command, List<String> allowedApplicationIds);
    MediaVariantDto replaceVariant(String mediaAssetId, String variantId, String applicationId, UpsertMediaVariantCommand command, List<String> allowedApplicationIds);
    void deleteVariant(String mediaAssetId, String variantId, String applicationId, List<String> allowedApplicationIds);
    MediaAssetDto getByObjectKey(String applicationId, String objectKey, List<String> allowedApplicationIds);
    MediaWithVariantsDto getMediaWithVariants(String mediaAssetId, String applicationId);
    MediaResolveResultDto resolveVariant(String mediaAssetId, String applicationId, ResolveMediaVariantQuery query);
    void addReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField);
    void removeReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField);
}
