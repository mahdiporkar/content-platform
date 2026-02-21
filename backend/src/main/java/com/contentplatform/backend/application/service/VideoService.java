package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreateVideoFromAssetCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.dto.UploadVideoCommand;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.mapper.ContentMapper;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.port.in.VideoUseCase;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.MediaUploadResult;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.application.port.out.VideoRepository;
import com.contentplatform.backend.domain.model.Video;
import com.contentplatform.backend.domain.value.ContentLocale;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.ContentStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class VideoService implements VideoUseCase {
    private final VideoRepository videoRepository;
    private final MediaStoragePort mediaStoragePort;
    private final TimeProvider timeProvider;
    private final ContentMapper mapper;
    private final MediaLibraryUseCase mediaLibraryUseCase;
    private final int presignExpirySeconds;

    public VideoService(VideoRepository videoRepository,
                        MediaStoragePort mediaStoragePort,
                        TimeProvider timeProvider,
                        ContentMapper mapper,
                        MediaLibraryUseCase mediaLibraryUseCase,
                        @Value("${app.storage.presign-expiry-seconds}") int presignExpirySeconds) {
        this.videoRepository = videoRepository;
        this.mediaStoragePort = mediaStoragePort;
        this.timeProvider = timeProvider;
        this.mapper = mapper;
        this.mediaLibraryUseCase = mediaLibraryUseCase;
        this.presignExpirySeconds = presignExpirySeconds;
    }

    @Override
    public VideoDto upload(UploadVideoCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        if (command.getLocale() != null && !command.getLocale().isBlank() && !ContentLocale.isSupported(command.getLocale())) {
            throw new BadRequestException("Locale is not supported");
        }
        Instant now = timeProvider.now();
        String objectKey = buildObjectKey(command.getApplicationId(), command.getOriginalFileName());
        MediaUploadResult result = mediaStoragePort.upload(
            objectKey,
            command.getInputStream(),
            command.getSizeBytes(),
            command.getContentType()
        );
        mediaLibraryUseCase.registerAsset(
            new RegisterMediaAssetCommand(
                command.getApplicationId(),
                MediaAssetKind.VIDEO,
                result.objectKey(),
                command.getOriginalFileName(),
                result.contentType(),
                result.sizeBytes()
            ),
            allowedApplicationIds
        );
        Instant publishedAt = command.getStatus() == ContentStatus.PUBLISHED ? now : null;
        Video video = new Video(
            UUID.randomUUID().toString(),
            command.getApplicationId(),
            command.getTitle(),
            command.getDescription(),
            ContentLocale.normalizeOrDefault(command.getLocale()),
            command.getStatus(),
            publishedAt,
            result.objectKey(),
            result.contentType(),
            result.sizeBytes(),
            now,
            now
        );
        return mapper.toVideoDto(videoRepository.save(video));
    }

    @Override
    public VideoDto createFromAsset(CreateVideoFromAssetCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        if (command.getLocale() != null && !command.getLocale().isBlank() && !ContentLocale.isSupported(command.getLocale())) {
            throw new BadRequestException("Locale is not supported");
        }
        var asset = mediaLibraryUseCase.getById(command.getAssetId(), command.getApplicationId(), allowedApplicationIds);
        if (asset.kind() != MediaAssetKind.VIDEO) {
            throw new BadRequestException("Selected asset is not a video");
        }

        Instant now = timeProvider.now();
        Instant publishedAt = command.getStatus() == ContentStatus.PUBLISHED ? now : null;
        Video video = new Video(
            UUID.randomUUID().toString(),
            command.getApplicationId(),
            command.getTitle(),
            command.getDescription(),
            ContentLocale.normalizeOrDefault(command.getLocale()),
            command.getStatus(),
            publishedAt,
            asset.objectKey(),
            asset.contentType(),
            asset.sizeBytes(),
            now,
            now
        );
        return mapper.toVideoDto(videoRepository.save(video));
    }

    @Override
    public VideoDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Video existing = videoRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Video not found"));
        Instant publishedAt = resolvePublishedAt(existing.getStatus(), command.getStatus(), existing.getPublishedAt());
        Video updated = new Video(
            existing.getId(),
            existing.getApplicationId(),
            existing.getTitle(),
            existing.getDescription(),
            existing.getLocale(),
            command.getStatus(),
            publishedAt,
            existing.getObjectKey(),
            existing.getContentType(),
            existing.getSizeBytes(),
            existing.getCreatedAt(),
            timeProvider.now()
        );
        return mapper.toVideoDto(videoRepository.save(updated));
    }

    @Override
    public PageResult<VideoDto> list(String applicationId, ContentStatus status, PageRequest pageRequest) {
        PageSlice<Video> pageSlice;
        if (status != null) {
            pageSlice = videoRepository.findByApplicationIdAndStatus(applicationId, status, pageRequest.getPage(), pageRequest.getSize());
        } else {
            pageSlice = videoRepository.findByApplicationId(applicationId, pageRequest.getPage(), pageRequest.getSize());
        }
        return new PageResult<>(
            pageSlice.items().stream().map(mapper::toVideoDto).toList(),
            pageSlice.totalElements(),
            pageSlice.totalPages(),
            pageSlice.page(),
            pageSlice.size()
        );
    }

    @Override
    public String getPresignedUrl(String objectKey) {
        return mediaStoragePort.getPresignedUrl(objectKey, presignExpirySeconds);
    }

    private void enforceTenant(String applicationId, List<String> allowedApplicationIds) {
        if (allowedApplicationIds == null || !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
    }

    private String buildObjectKey(String applicationId, String originalFileName) {
        LocalDate date = LocalDate.now(ZoneOffset.UTC);
        String safeName = originalFileName == null ? "file" : originalFileName.replaceAll("\\s+", "-");
        return String.format("%s/%04d/%02d/%s-%s", applicationId, date.getYear(), date.getMonthValue(), UUID.randomUUID(), safeName);
    }

    private Instant resolvePublishedAt(ContentStatus previousStatus, ContentStatus newStatus, Instant currentPublishedAt) {
        if (previousStatus != ContentStatus.PUBLISHED && newStatus == ContentStatus.PUBLISHED) {
            return timeProvider.now();
        }
        if (newStatus != ContentStatus.PUBLISHED) {
            return null;
        }
        return currentPublishedAt;
    }
}
