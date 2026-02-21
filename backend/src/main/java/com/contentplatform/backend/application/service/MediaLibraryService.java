package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MediaLibraryService implements MediaLibraryUseCase {
    private final MediaAssetRepository mediaAssetRepository;
    private final VideoJpaRepository videoJpaRepository;
    private final TimeProvider timeProvider;
    private final String bucket;
    private final String publicUrl;

    public MediaLibraryService(MediaAssetRepository mediaAssetRepository,
                               VideoJpaRepository videoJpaRepository,
                               TimeProvider timeProvider,
                               @Value("${minio.bucket}") String bucket,
                               @Value("${app.storage.public-url:${minio.url}}") String publicUrl) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.videoJpaRepository = videoJpaRepository;
        this.timeProvider = timeProvider;
        this.bucket = bucket;
        this.publicUrl = publicUrl;
    }

    @Override
    public MediaAssetDto registerAsset(RegisterMediaAssetCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Instant now = timeProvider.now();
        MediaAsset asset = mediaAssetRepository.findByApplicationIdAndObjectKey(command.getApplicationId(), command.getObjectKey())
            .map(existing -> new MediaAsset(
                existing.getId(),
                existing.getApplicationId(),
                command.getKind(),
                existing.getObjectKey(),
                command.getOriginalName(),
                command.getContentType(),
                command.getSizeBytes(),
                existing.getCreatedAt(),
                now
            ))
            .orElseGet(() -> new MediaAsset(
                UUID.randomUUID().toString(),
                command.getApplicationId(),
                command.getKind(),
                command.getObjectKey(),
                command.getOriginalName(),
                command.getContentType(),
                command.getSizeBytes(),
                now,
                now
            ));
        return toDto(mediaAssetRepository.save(asset));
    }

    @Override
    public PageResult<MediaAssetDto> list(String applicationId,
                                          MediaAssetKind kind,
                                          String search,
                                          PageRequest pageRequest,
                                          List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        syncVideoAssets(applicationId, allowedApplicationIds);
        PageSlice<MediaAsset> pageSlice = mediaAssetRepository.findByApplicationId(
            applicationId,
            kind,
            search,
            pageRequest.getPage(),
            pageRequest.getSize()
        );
        return new PageResult<>(
            pageSlice.items().stream().map(this::toDto).toList(),
            pageSlice.totalElements(),
            pageSlice.totalPages(),
            pageSlice.page(),
            pageSlice.size()
        );
    }

    @Override
    public MediaAssetDto getById(String id, String applicationId, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        MediaAsset asset = mediaAssetRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!asset.getApplicationId().equals(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
        return toDto(asset);
    }

    private void enforceTenant(String applicationId, List<String> allowedApplicationIds) {
        if (allowedApplicationIds == null || !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
    }

    private MediaAssetDto toDto(MediaAsset mediaAsset) {
        return new MediaAssetDto(
            mediaAsset.getId(),
            mediaAsset.getApplicationId(),
            mediaAsset.getKind(),
            mediaAsset.getObjectKey(),
            mediaAsset.getOriginalName(),
            mediaAsset.getContentType(),
            mediaAsset.getSizeBytes(),
            buildPublicUrl(mediaAsset.getObjectKey()),
            mediaAsset.getCreatedAt(),
            mediaAsset.getUpdatedAt()
        );
    }

    private String buildPublicUrl(String objectKey) {
        String base = publicUrl == null ? "" : publicUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return String.format("%s/%s/%s", base, bucket, objectKey);
    }

    private void syncVideoAssets(String applicationId, List<String> allowedApplicationIds) {
        var videos = videoJpaRepository.findAllByApplicationId(applicationId);
        for (var video : videos) {
            registerAsset(
                new RegisterMediaAssetCommand(
                    applicationId,
                    MediaAssetKind.VIDEO,
                    video.getObjectKey(),
                    null,
                    video.getContentType(),
                    video.getSizeBytes()
                ),
                allowedApplicationIds
            );
        }
    }
}
