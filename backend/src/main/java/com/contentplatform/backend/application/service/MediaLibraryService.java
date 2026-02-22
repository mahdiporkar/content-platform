package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.MediaAssetDto;
import com.contentplatform.backend.application.dto.MediaReferenceDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.ConflictException;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.StorageObjectRef;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.domain.value.MediaReferenceType;
import com.contentplatform.backend.infrastructure.jpa.entity.AuditLogEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaReferenceEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.AuditLogJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaReferenceJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaVariantJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MediaLibraryService implements MediaLibraryUseCase {
    private final MediaAssetRepository mediaAssetRepository;
    private final VideoJpaRepository videoJpaRepository;
    private final MediaReferenceJpaRepository mediaReferenceJpaRepository;
    private final MediaVariantJpaRepository mediaVariantJpaRepository;
    private final AuditLogJpaRepository auditLogJpaRepository;
    private final MediaStoragePort mediaStoragePort;
    private final TimeProvider timeProvider;
    private final String bucket;
    private final String publicUrl;

    public MediaLibraryService(MediaAssetRepository mediaAssetRepository,
                               VideoJpaRepository videoJpaRepository,
                               MediaReferenceJpaRepository mediaReferenceJpaRepository,
                               MediaVariantJpaRepository mediaVariantJpaRepository,
                               AuditLogJpaRepository auditLogJpaRepository,
                               MediaStoragePort mediaStoragePort,
                               TimeProvider timeProvider,
                               @Value("${minio.bucket}") String bucket,
                               @Value("${app.storage.public-url:${minio.url}}") String publicUrl) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.videoJpaRepository = videoJpaRepository;
        this.mediaReferenceJpaRepository = mediaReferenceJpaRepository;
        this.mediaVariantJpaRepository = mediaVariantJpaRepository;
        this.auditLogJpaRepository = auditLogJpaRepository;
        this.mediaStoragePort = mediaStoragePort;
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
                command.getOwnerUserId() == null ? existing.getOwnerUserId() : command.getOwnerUserId(),
                command.getKind(),
                existing.getState(),
                command.getBucket() == null ? existing.getBucket() : command.getBucket(),
                existing.getObjectKey(),
                command.getOriginalName(),
                command.getContentType(),
                command.getSizeBytes(),
                existing.getTrashedAt(),
                existing.getPurgedAt(),
                existing.getDeletedByUserId(),
                existing.isPinned(),
                existing.getMetadata(),
                existing.getCreatedAt(),
                now
            ))
            .orElseGet(() -> new MediaAsset(
                UUID.randomUUID().toString(),
                command.getApplicationId(),
                command.getOwnerUserId(),
                command.getKind(),
                MediaAssetState.ACTIVE,
                command.getBucket() == null ? bucket : command.getBucket(),
                command.getObjectKey(),
                command.getOriginalName(),
                command.getContentType(),
                command.getSizeBytes(),
                null,
                null,
                null,
                false,
                null,
                now,
                now
            ));
        return toDto(mediaAssetRepository.save(asset));
    }

    @Override
    public PageResult<MediaAssetDto> list(String applicationId,
                                          MediaAssetKind kind,
                                          MediaAssetState state,
                                          String search,
                                          PageRequest pageRequest,
                                          List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        syncVideoAssets(applicationId, allowedApplicationIds);
        PageSlice<MediaAsset> pageSlice = mediaAssetRepository.findByApplicationId(
            applicationId,
            kind,
            state,
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

    @Override
    @Transactional
    public MediaAssetDto trash(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        MediaAsset asset = mediaAssetRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!asset.getApplicationId().equals(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
        if (asset.getState() == MediaAssetState.PURGED) {
            throw new BadRequestException("Purged media cannot be trashed");
        }
        MediaAsset updated = new MediaAsset(
            asset.getId(),
            asset.getApplicationId(),
            asset.getOwnerUserId(),
            asset.getKind(),
            MediaAssetState.TRASH,
            asset.getBucket(),
            asset.getObjectKey(),
            asset.getOriginalName(),
            asset.getContentType(),
            asset.getSizeBytes(),
            timeProvider.now(),
            asset.getPurgedAt(),
            actorUserId,
            asset.isPinned(),
            asset.getMetadata(),
            asset.getCreatedAt(),
            timeProvider.now()
        );
        MediaAsset saved = mediaAssetRepository.save(updated);
        audit(applicationId, actorUserId, "MEDIA_TRASH", "media_asset", id, null);
        return toDto(saved);
    }

    @Override
    @Transactional
    public MediaAssetDto restore(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        MediaAsset asset = mediaAssetRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!asset.getApplicationId().equals(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
        if (asset.getState() != MediaAssetState.TRASH) {
            throw new BadRequestException("Only trashed media can be restored");
        }
        MediaAsset updated = new MediaAsset(
            asset.getId(),
            asset.getApplicationId(),
            asset.getOwnerUserId(),
            asset.getKind(),
            MediaAssetState.ACTIVE,
            asset.getBucket(),
            asset.getObjectKey(),
            asset.getOriginalName(),
            asset.getContentType(),
            asset.getSizeBytes(),
            null,
            asset.getPurgedAt(),
            null,
            asset.isPinned(),
            asset.getMetadata(),
            asset.getCreatedAt(),
            timeProvider.now()
        );
        MediaAsset saved = mediaAssetRepository.save(updated);
        audit(applicationId, actorUserId, "MEDIA_RESTORE", "media_asset", id, null);
        return toDto(saved);
    }

    @Override
    @Transactional
    public MediaAssetDto purge(String id, String applicationId, String actorUserId, List<String> allowedApplicationIds, boolean superAdmin) {
        if (!superAdmin) {
            throw new ForbiddenException("Only super admin can purge media");
        }
        enforceTenant(applicationId, allowedApplicationIds);
        audit(applicationId, actorUserId, "MEDIA_PURGE_ATTEMPT", "media_asset", id, null);

        MediaAsset locked = mediaAssetRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!locked.getApplicationId().equals(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
        if (locked.getState() != MediaAssetState.TRASH) {
            throw new BadRequestException("Only TRASH media can be purged");
        }
        if (locked.isPinned()) {
            throw new BadRequestException("Pinned media cannot be purged");
        }

        long refCount = mediaReferenceJpaRepository.countByApplicationIdAndMediaAssetId(applicationId, id);
        if (refCount > 0) {
            audit(applicationId, actorUserId, "MEDIA_PURGE_BLOCKED_REFERENCED", "media_asset", id, "refCount=" + refCount);
            throw new ConflictException("Media is referenced and cannot be purged");
        }

        // Re-check right before storage delete in the same transaction.
        long rechecked = mediaReferenceJpaRepository.countByApplicationIdAndMediaAssetId(applicationId, id);
        if (rechecked > 0) {
            throw new ConflictException("Media got new references during purge");
        }

        List<StorageObjectRef> objects = new ArrayList<>();
        objects.add(new StorageObjectRef(locked.getBucket(), locked.getObjectKey()));
        mediaVariantJpaRepository.findByMediaAssetId(id).forEach(variant ->
            objects.add(new StorageObjectRef(variant.getBucket(), variant.getObjectKey()))
        );

        mediaStoragePort.deleteMany(objects);

        MediaAsset purged = new MediaAsset(
            locked.getId(),
            locked.getApplicationId(),
            locked.getOwnerUserId(),
            locked.getKind(),
            MediaAssetState.PURGED,
            locked.getBucket(),
            locked.getObjectKey(),
            locked.getOriginalName(),
            locked.getContentType(),
            locked.getSizeBytes(),
            locked.getTrashedAt(),
            timeProvider.now(),
            actorUserId,
            locked.isPinned(),
            locked.getMetadata(),
            locked.getCreatedAt(),
            timeProvider.now()
        );
        MediaAsset saved = mediaAssetRepository.save(purged);
        mediaVariantJpaRepository.deleteByMediaAssetId(id);
        audit(applicationId, actorUserId, "MEDIA_PURGE_SUCCESS", "media_asset", id, "objects=" + objects.size());
        return toDto(saved);
    }

    @Override
    public List<MediaReferenceDto> listReferences(String id, String applicationId, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        return mediaReferenceJpaRepository.findByApplicationIdAndMediaAssetId(applicationId, id).stream()
            .map(entry -> new MediaReferenceDto(
                entry.getId(),
                entry.getApplicationId(),
                entry.getMediaAssetId(),
                entry.getRefType(),
                entry.getRefId(),
                entry.getRefField(),
                entry.getCreatedAt()
            ))
            .toList();
    }

    @Override
    @Transactional
    public void addReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField) {
        boolean exists = mediaReferenceJpaRepository
            .findByApplicationIdAndMediaAssetIdAndRefTypeAndRefIdAndRefField(applicationId, mediaAssetId, refType, refId, refField)
            .isPresent();
        if (exists) {
            return;
        }
        mediaReferenceJpaRepository.save(new MediaReferenceEntity(
            UUID.randomUUID().toString(),
            applicationId,
            mediaAssetId,
            refType,
            refId,
            refField,
            timeProvider.now()
        ));
    }

    @Override
    @Transactional
    public void removeReference(String applicationId, String mediaAssetId, MediaReferenceType refType, String refId, String refField) {
        mediaReferenceJpaRepository.findByApplicationIdAndMediaAssetIdAndRefTypeAndRefIdAndRefField(
                applicationId,
                mediaAssetId,
                refType,
                refId,
                refField
            )
            .ifPresent(mediaReferenceJpaRepository::delete);
    }

    private void enforceTenant(String applicationId, List<String> allowedApplicationIds) {
        if (allowedApplicationIds == null || !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
    }

    private MediaAssetDto toDto(MediaAsset mediaAsset) {
        long refCount = mediaReferenceJpaRepository.countByApplicationIdAndMediaAssetId(mediaAsset.getApplicationId(), mediaAsset.getId());
        boolean canPurge = mediaAsset.getState() == MediaAssetState.TRASH && refCount == 0 && !mediaAsset.isPinned();
        return new MediaAssetDto(
            mediaAsset.getId(),
            mediaAsset.getApplicationId(),
            mediaAsset.getOwnerUserId(),
            mediaAsset.getKind(),
            mediaAsset.getState(),
            mediaAsset.getBucket(),
            mediaAsset.getObjectKey(),
            mediaAsset.getOriginalName(),
            mediaAsset.getContentType(),
            mediaAsset.getSizeBytes(),
            buildPublicUrl(mediaAsset.getBucket(), mediaAsset.getObjectKey()),
            mediaAsset.getTrashedAt(),
            mediaAsset.getPurgedAt(),
            mediaAsset.getDeletedByUserId(),
            mediaAsset.isPinned(),
            refCount,
            canPurge,
            mediaAsset.getCreatedAt(),
            mediaAsset.getUpdatedAt()
        );
    }

    private String buildPublicUrl(String mediaBucket, String objectKey) {
        String base = publicUrl == null ? "" : publicUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String targetBucket = mediaBucket == null || mediaBucket.isBlank() ? bucket : mediaBucket;
        return String.format("%s/%s/%s", base, targetBucket, objectKey);
    }

    private void syncVideoAssets(String applicationId, List<String> allowedApplicationIds) {
        var videos = videoJpaRepository.findAllByApplicationId(applicationId);
        for (var video : videos) {
            registerAsset(
                new RegisterMediaAssetCommand(
                    applicationId,
                    null,
                    MediaAssetKind.VIDEO,
                    bucket,
                    video.getObjectKey(),
                    null,
                    video.getContentType(),
                    video.getSizeBytes()
                ),
                allowedApplicationIds
            );
        }
    }

    private void audit(String tenantId, String actorUserId, String action, String entityType, String entityId, String meta) {
        auditLogJpaRepository.save(new AuditLogEntity(
            UUID.randomUUID().toString(),
            tenantId,
            actorUserId,
            action,
            entityType,
            entityId,
            meta,
            timeProvider.now()
        ));
    }
}
