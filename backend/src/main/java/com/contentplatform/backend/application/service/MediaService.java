package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.MediaUploadDto;
import com.contentplatform.backend.application.dto.UploadMediaCommand;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.port.in.MediaUseCase;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.MediaUploadResult;
import com.contentplatform.backend.application.port.out.TimeProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaService implements MediaUseCase {
    private static final Set<String> ALLOWED_KINDS = Set.of("image", "video", "file");

    private final MediaStoragePort mediaStoragePort;
    private final TimeProvider timeProvider;
    private final String bucket;
    private final String publicUrl;

    public MediaService(MediaStoragePort mediaStoragePort,
                        TimeProvider timeProvider,
                        @Value("${minio.bucket}") String bucket,
                        @Value("${app.storage.public-url:${minio.url}}") String publicUrl) {
        this.mediaStoragePort = mediaStoragePort;
        this.timeProvider = timeProvider;
        this.bucket = bucket;
        this.publicUrl = publicUrl;
    }

    @Override
    public MediaUploadDto upload(UploadMediaCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        String objectKey = buildObjectKey(command.getApplicationId(), command.getKind(), command.getOriginalFileName());
        MediaUploadResult result = mediaStoragePort.upload(
            objectKey,
            command.getInputStream(),
            command.getSizeBytes(),
            command.getContentType()
        );
        return new MediaUploadDto(result.objectKey(), result.sizeBytes(), result.contentType(), buildPublicUrl(objectKey));
    }

    private void enforceTenant(String applicationId, List<String> allowedApplicationIds) {
        if (allowedApplicationIds == null || !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
    }

    private String buildObjectKey(String applicationId, String kind, String originalFileName) {
        String normalizedKind = normalizeKind(kind);
        Instant now = timeProvider.now();
        LocalDate date = LocalDate.ofInstant(now, ZoneOffset.UTC);
        String safeName = originalFileName == null ? "file" : originalFileName.replaceAll("\\s+", "-");
        return String.format(
            "%s/%s/%04d/%02d/%s-%s",
            applicationId,
            normalizedKind,
            date.getYear(),
            date.getMonthValue(),
            UUID.randomUUID(),
            safeName
        );
    }

    private String normalizeKind(String kind) {
        if (kind == null) {
            return "file";
        }
        String normalized = kind.trim().toLowerCase();
        return ALLOWED_KINDS.contains(normalized) ? normalized : "file";
    }

    private String buildPublicUrl(String objectKey) {
        String base = publicUrl == null ? "" : publicUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return String.format("%s/%s/%s", base, bucket, objectKey);
    }
}
