package com.contentplatform.backend.application.service;

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
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.ConflictException;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.MediaLibraryUseCase;
import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.MediaUploadResult;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.StorageObjectRef;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.domain.value.MediaVariantDevice;
import com.contentplatform.backend.domain.value.MediaVariantPurpose;
import com.contentplatform.backend.domain.value.MediaVariantSizeKey;
import com.contentplatform.backend.domain.value.MediaReferenceType;
import com.contentplatform.backend.infrastructure.jpa.entity.AuditLogEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaReferenceEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaVariantEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.AuditLogJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaReferenceJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaVariantJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaLibraryService implements MediaLibraryUseCase {
    private static final Set<String> IMAGE_FORMATS = Set.of("jpg", "jpeg", "png", "webp", "gif", "avif");
    private static final Set<String> VIDEO_FORMATS = Set.of("mp4", "webm", "mov", "m4v", "mkv");

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
        MediaAsset saved = mediaAssetRepository.save(asset);
        ensureDefaultVariant(saved);
        return toDto(saved);
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
    public List<MediaVariantDto> listVariants(String mediaAssetId, String applicationId, List<String> allowedApplicationIds) {
        MediaAsset asset = loadAssetForAdmin(mediaAssetId, applicationId, allowedApplicationIds);
        ensureDefaultVariant(asset);
        return mediaVariantJpaRepository.findByMediaAssetIdOrderBySortOrderDescUpdatedAtDesc(mediaAssetId)
            .stream()
            .map(this::toVariantDto)
            .toList();
    }

    @Override
    @Transactional
    public MediaVariantDto addVariant(String mediaAssetId,
                                      String applicationId,
                                      UpsertMediaVariantCommand command,
                                      List<String> allowedApplicationIds) {
        MediaAsset asset = loadAssetForAdmin(mediaAssetId, applicationId, allowedApplicationIds);
        if (command.inputStream() == null || command.contentType() == null || command.sizeBytes() == null || command.originalFileName() == null) {
            throw new BadRequestException("Variant file is required");
        }

        Instant now = timeProvider.now();
        List<MediaVariantEntity> existing = mediaVariantJpaRepository.findByMediaAssetId(mediaAssetId);
        String purpose = normalizePurpose(command.purpose(), existing.isEmpty());
        String sizeKey = MediaVariantSizeKey.normalizeNullable(command.sizeKey());
        String device = MediaVariantDevice.normalizeNullable(command.device());
        ensureUniqueCombo(mediaAssetId, purpose, sizeKey, device, null);

        String format = normalizeFormat(command.format(), command.contentType(), command.originalFileName());
        validateFormatForKind(asset.getKind(), format);

        String objectKey = buildVariantObjectKey(asset.getApplicationId(), asset.getKind(), command.originalFileName());
        MediaUploadResult uploaded = mediaStoragePort.upload(objectKey, command.inputStream(), command.sizeBytes(), command.contentType());
        objectKey = uploaded.objectKey();
        boolean makeDefault = shouldBeDefault(command.isDefault(), purpose, existing.isEmpty());

        MediaVariantEntity entity = new MediaVariantEntity(
            UUID.randomUUID().toString(),
            mediaAssetId,
            asset.getApplicationId(),
            makeDefault ? "ORIGINAL" : "DERIVED",
            makeDefault ? MediaVariantPurpose.DEFAULT : purpose,
            sizeKey,
            command.minWidth(),
            command.maxWidth(),
            device,
            format,
            command.width(),
            command.height(),
            command.duration(),
            command.bitrate(),
            asset.getBucket(),
            objectKey,
            buildPublicUrl(asset.getBucket(), objectKey),
            uploaded.sizeBytes(),
            makeDefault,
            command.sortOrder() == null ? 0 : command.sortOrder(),
            now,
            now
        );
        MediaVariantEntity saved = mediaVariantJpaRepository.save(entity);
        if (saved.isDefault()) {
            mediaVariantJpaRepository.clearDefaultExcept(mediaAssetId, saved.getId());
        }
        return toVariantDto(saved);
    }

    @Override
    @Transactional
    public MediaVariantDto replaceVariant(String mediaAssetId,
                                          String variantId,
                                          String applicationId,
                                          UpsertMediaVariantCommand command,
                                          List<String> allowedApplicationIds) {
        MediaAsset asset = loadAssetForAdmin(mediaAssetId, applicationId, allowedApplicationIds);
        MediaVariantEntity current = mediaVariantJpaRepository.findByIdAndMediaAssetId(variantId, mediaAssetId)
            .orElseThrow(() -> new NotFoundException("Media variant not found"));

        String purpose = command.purpose() == null
            ? current.getPurpose()
            : normalizePurpose(command.purpose(), false);
        String sizeKey = command.sizeKey() == null
            ? current.getSizeKey()
            : MediaVariantSizeKey.normalizeNullable(command.sizeKey());
        String device = command.device() == null
            ? current.getDevice()
            : MediaVariantDevice.normalizeNullable(command.device());
        ensureUniqueCombo(mediaAssetId, purpose, sizeKey, device, variantId);

        String contentType = command.contentType() == null ? inferContentTypeByFormat(current.getFormat(), asset.getKind()) : command.contentType();
        String format = command.format() == null && command.contentType() == null && command.originalFileName() == null
            ? current.getFormat()
            : normalizeFormat(command.format(), contentType, command.originalFileName() == null ? current.getObjectKey() : command.originalFileName());
        validateFormatForKind(asset.getKind(), format);

        String objectKey = current.getObjectKey();
        String fileUrl = current.getFileUrl();
        long sizeBytes = current.getSizeBytes();
        if (command.inputStream() != null) {
            if (command.contentType() == null || command.sizeBytes() == null || command.originalFileName() == null) {
                throw new BadRequestException("When file is provided, contentType, sizeBytes and originalFileName are required");
            }
            objectKey = buildVariantObjectKey(asset.getApplicationId(), asset.getKind(), command.originalFileName());
            MediaUploadResult uploaded = mediaStoragePort.upload(objectKey, command.inputStream(), command.sizeBytes(), command.contentType());
            objectKey = uploaded.objectKey();
            sizeBytes = uploaded.sizeBytes();
            fileUrl = buildPublicUrl(asset.getBucket(), objectKey);
        }

        boolean makeDefault = command.isDefault() == null
            ? (current.isDefault() || MediaVariantPurpose.DEFAULT.equals(purpose))
            : shouldBeDefault(command.isDefault(), purpose, false);
        String finalPurpose = makeDefault ? MediaVariantPurpose.DEFAULT : purpose;
        Instant now = timeProvider.now();

        MediaVariantEntity updated = new MediaVariantEntity(
            current.getId(),
            current.getMediaAssetId(),
            current.getApplicationId(),
            makeDefault ? "ORIGINAL" : "DERIVED",
            finalPurpose,
            sizeKey,
            command.minWidth() == null ? current.getMinWidth() : command.minWidth(),
            command.maxWidth() == null ? current.getMaxWidth() : command.maxWidth(),
            device,
            format,
            command.width() == null ? current.getWidth() : command.width(),
            command.height() == null ? current.getHeight() : command.height(),
            command.duration() == null ? current.getDuration() : command.duration(),
            command.bitrate() == null ? current.getBitrate() : command.bitrate(),
            current.getBucket(),
            objectKey,
            fileUrl,
            sizeBytes,
            makeDefault,
            command.sortOrder() == null ? current.getSortOrder() : command.sortOrder(),
            current.getCreatedAt(),
            now
        );
        MediaVariantEntity saved = mediaVariantJpaRepository.save(updated);
        if (saved.isDefault()) {
            mediaVariantJpaRepository.clearDefaultExcept(mediaAssetId, saved.getId());
        }
        ensureHasDefault(mediaAssetId);
        return toVariantDto(saved);
    }

    @Override
    @Transactional
    public void deleteVariant(String mediaAssetId, String variantId, String applicationId, List<String> allowedApplicationIds) {
        loadAssetForAdmin(mediaAssetId, applicationId, allowedApplicationIds);
        MediaVariantEntity current = mediaVariantJpaRepository.findByIdAndMediaAssetId(variantId, mediaAssetId)
            .orElseThrow(() -> new NotFoundException("Media variant not found"));
        if (current.isDefault()) {
            throw new BadRequestException("Default variant cannot be deleted");
        }
        mediaVariantJpaRepository.delete(current);
        ensureHasDefault(mediaAssetId);
    }

    @Override
    public MediaAssetDto getByObjectKey(String applicationId, String objectKey, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        MediaAsset asset = mediaAssetRepository.findByApplicationIdAndObjectKey(applicationId, objectKey)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        return toDto(asset);
    }

    @Override
    public MediaWithVariantsDto getMediaWithVariants(String mediaAssetId, String applicationId) {
        MediaAsset asset = mediaAssetRepository.findById(mediaAssetId)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!asset.getApplicationId().equals(applicationId)) {
            throw new NotFoundException("Media asset not found");
        }
        ensureDefaultVariant(asset);
        List<MediaVariantDto> variants = mediaVariantJpaRepository.findByMediaAssetIdOrderBySortOrderDescUpdatedAtDesc(mediaAssetId)
            .stream()
            .map(this::toVariantDto)
            .toList();
        return new MediaWithVariantsDto(toDto(asset), variants);
    }

    @Override
    public MediaResolveResultDto resolveVariant(String mediaAssetId, String applicationId, ResolveMediaVariantQuery query) {
        MediaWithVariantsDto mediaWithVariants = getMediaWithVariants(mediaAssetId, applicationId);
        List<MediaVariantDto> variants = mediaWithVariants.variants();
        if (variants.isEmpty()) {
            throw new NotFoundException("Media variant not found");
        }

        String requestedPurpose = query.purpose() == null ? null : MediaVariantPurpose.normalize(query.purpose());
        String requestedSize = query.size() == null ? MediaVariantSizeKey.fromViewportWidth(query.viewportWidth()) : MediaVariantSizeKey.normalizeNullable(query.size());
        String requestedDevice = MediaVariantDevice.normalizeNullable(query.device());
        String requestedFormat = normalizeFormatNullable(query.format());

        MediaVariantDto defaultVariant = variants.stream()
            .filter(MediaVariantDto::isDefault)
            .findFirst()
            .orElse(variants.get(0));

        List<ScoredVariant> scored = variants.stream()
            .map(variant -> scoreVariant(variant, requestedPurpose, requestedSize, requestedDevice, requestedFormat))
            .toList();
        ScoredVariant best = scored.stream()
            .filter(ScoredVariant::candidate)
            .max(Comparator.naturalOrder())
            .orElse(null);

        MediaVariantDto selected = best == null ? defaultVariant : best.variant();
        boolean hadCriteria = requestedPurpose != null || requestedSize != null || requestedDevice != null || requestedFormat != null;
        boolean fallbackUsed = hadCriteria && Objects.equals(selected.id(), defaultVariant.id()) && (
            (requestedPurpose != null && !requestedPurpose.equals(defaultVariant.purpose()))
                || (requestedSize != null && !requestedSize.equals(defaultVariant.sizeKey()))
                || (requestedDevice != null && !requestedDevice.equals(defaultVariant.device()))
                || (requestedFormat != null && !requestedFormat.equals(defaultVariant.format()))
        );

        return new MediaResolveResultDto(
            mediaAssetId,
            selected.id(),
            selected.purpose(),
            selected.sizeKey(),
            selected.device(),
            selected.fileUrl(),
            selected.width(),
            selected.height(),
            selected.duration(),
            fallbackUsed
        );
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

    private MediaAsset loadAssetForAdmin(String mediaAssetId, String applicationId, List<String> allowedApplicationIds) {
        enforceTenant(applicationId, allowedApplicationIds);
        MediaAsset asset = mediaAssetRepository.findById(mediaAssetId)
            .orElseThrow(() -> new NotFoundException("Media asset not found"));
        if (!asset.getApplicationId().equals(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
        return asset;
    }

    private void ensureDefaultVariant(MediaAsset mediaAsset) {
        if (mediaVariantJpaRepository.countByMediaAssetIdAndIsDefaultTrue(mediaAsset.getId()) > 0) {
            return;
        }
        Instant now = timeProvider.now();
        String format = extensionFrom(mediaAsset.getObjectKey());
        MediaVariantEntity variant = new MediaVariantEntity(
            UUID.randomUUID().toString(),
            mediaAsset.getId(),
            mediaAsset.getApplicationId(),
            "ORIGINAL",
            MediaVariantPurpose.DEFAULT,
            null,
            null,
            null,
            null,
            format,
            null,
            null,
            null,
            null,
            mediaAsset.getBucket(),
            mediaAsset.getObjectKey(),
            buildPublicUrl(mediaAsset.getBucket(), mediaAsset.getObjectKey()),
            mediaAsset.getSizeBytes(),
            true,
            0,
            now,
            now
        );
        mediaVariantJpaRepository.save(variant);
    }

    private void ensureHasDefault(String mediaAssetId) {
        if (mediaVariantJpaRepository.countByMediaAssetIdAndIsDefaultTrue(mediaAssetId) == 0) {
            throw new BadRequestException("Media must have one default variant");
        }
    }

    private void ensureUniqueCombo(String mediaAssetId, String purpose, String sizeKey, String device, String currentVariantId) {
        boolean duplicate = mediaVariantJpaRepository.existsDuplicateExcept(
            mediaAssetId,
            purpose,
            sizeKey,
            device,
            currentVariantId == null ? "__new__" : currentVariantId
        );
        if (duplicate) {
            throw new ConflictException("Duplicate variant for same purpose/size/device");
        }
    }

    private String normalizePurpose(String rawPurpose, boolean forceDefault) {
        if (forceDefault) {
            return MediaVariantPurpose.DEFAULT;
        }
        return MediaVariantPurpose.normalize(rawPurpose);
    }

    private boolean shouldBeDefault(Boolean isDefault, String purpose, boolean firstVariant) {
        if (firstVariant) {
            return true;
        }
        if (Boolean.TRUE.equals(isDefault)) {
            return true;
        }
        return MediaVariantPurpose.DEFAULT.equals(purpose);
    }

    private String normalizeFormat(String requestedFormat, String contentType, String fileName) {
        String normalized = normalizeFormatNullable(requestedFormat);
        if (normalized != null) {
            return normalized;
        }
        if (contentType != null && contentType.contains("/")) {
            return contentType.substring(contentType.indexOf('/') + 1).toLowerCase(Locale.ROOT);
        }
        String byName = extensionFrom(fileName);
        return byName == null ? "bin" : byName;
    }

    private String normalizeFormatNullable(String format) {
        if (format == null || format.isBlank()) {
            return null;
        }
        return format.trim().toLowerCase(Locale.ROOT);
    }

    private void validateFormatForKind(MediaAssetKind kind, String format) {
        if (format == null) {
            return;
        }
        if (kind == MediaAssetKind.IMAGE && !IMAGE_FORMATS.contains(format)) {
            throw new BadRequestException("Variant format is not valid for image media");
        }
        if (kind == MediaAssetKind.VIDEO && !VIDEO_FORMATS.contains(format)) {
            throw new BadRequestException("Variant format is not valid for video media");
        }
    }

    private String inferContentTypeByFormat(String format, MediaAssetKind kind) {
        if (format == null || format.isBlank()) {
            return kind == MediaAssetKind.VIDEO ? "video/mp4" : "image/jpeg";
        }
        return (kind == MediaAssetKind.VIDEO ? "video/" : "image/") + format.toLowerCase(Locale.ROOT);
    }

    private String buildVariantObjectKey(String applicationId, MediaAssetKind kind, String originalFileName) {
        Instant now = timeProvider.now();
        LocalDate date = LocalDate.ofInstant(now, ZoneOffset.UTC);
        String safeName = originalFileName == null ? "variant" : originalFileName.replaceAll("\\s+", "-");
        return String.format(
            "%s/%s/%04d/%02d/variants/%s-%s",
            applicationId,
            kind == MediaAssetKind.VIDEO ? "video" : "image",
            date.getYear(),
            date.getMonthValue(),
            UUID.randomUUID(),
            safeName
        );
    }

    private String extensionFrom(String fileName) {
        if (fileName == null) {
            return null;
        }
        int idx = fileName.lastIndexOf('.');
        if (idx < 0 || idx == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(idx + 1).toLowerCase(Locale.ROOT);
    }

    private MediaVariantDto toVariantDto(MediaVariantEntity variant) {
        return new MediaVariantDto(
            variant.getId(),
            variant.getMediaAssetId(),
            variant.getApplicationId(),
            variant.getPurpose(),
            variant.getSizeKey(),
            variant.getMinWidth(),
            variant.getMaxWidth(),
            variant.getDevice(),
            variant.getFormat(),
            variant.getWidth(),
            variant.getHeight(),
            variant.getDuration(),
            variant.getBitrate(),
            variant.getBucket(),
            variant.getObjectKey(),
            variant.getFileUrl() == null ? buildPublicUrl(variant.getBucket(), variant.getObjectKey()) : variant.getFileUrl(),
            variant.getSizeBytes(),
            variant.isDefault(),
            variant.getSortOrder(),
            variant.getCreatedAt(),
            variant.getUpdatedAt()
        );
    }

    private ScoredVariant scoreVariant(MediaVariantDto variant,
                                       String requestedPurpose,
                                       String requestedSize,
                                       String requestedDevice,
                                       String requestedFormat) {
        int score = 0;
        boolean candidate = true;

        if (requestedPurpose != null) {
            if (requestedPurpose.equals(variant.purpose())) {
                score += 1000;
            } else if (!variant.isDefault()) {
                candidate = false;
            }
        } else if (variant.isDefault()) {
            score += 100;
        }

        if (requestedSize != null) {
            if (requestedSize.equals(variant.sizeKey())) {
                score += 300;
            } else if (variant.sizeKey() != null && requestedPurpose != null && requestedPurpose.equals(variant.purpose())) {
                score -= 10;
            }
        }

        if (requestedDevice != null) {
            if (requestedDevice.equals(variant.device())) {
                score += 200;
            } else if (variant.device() != null && requestedPurpose != null && requestedPurpose.equals(variant.purpose())) {
                score -= 10;
            }
        }

        if (requestedFormat != null) {
            if (requestedFormat.equals(variant.format())) {
                score += 150;
            } else if (variant.format() != null) {
                score -= 5;
            }
        }

        score += variant.sortOrder() * 2;
        score += (int) (variant.updatedAt().toEpochMilli() / 1000L % 1000);
        return new ScoredVariant(variant, score, candidate);
    }

    private record ScoredVariant(MediaVariantDto variant, int score, boolean candidate) implements Comparable<ScoredVariant> {
        @Override
        public int compareTo(ScoredVariant other) {
            return Integer.compare(this.score, other.score);
        }
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
