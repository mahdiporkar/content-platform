package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.exception.ConflictException;
import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.infrastructure.jpa.repository.AuditLogJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaReferenceJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaVariantJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MediaLibraryServiceTest {
    @Test
    void softDeleteMovesAssetToTrashWithoutStorageDelete() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset active = new MediaAsset("m1", "t1", null, MediaAssetKind.IMAGE, MediaAssetState.ACTIVE, "media", "t1/k.jpg", null, "image/jpeg", 100, null, null, null, false, null, time.now(), time.now());
        when(assets.findById("m1")).thenReturn(Optional.of(active));
        when(assets.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = service.trash("m1", "t1", "u1", List.of("t1"));
        assertEquals(MediaAssetState.TRASH, dto.state());
    }

    @Test
    void purgeFailsWhenReferenced() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset trash = new MediaAsset("m1", "t1", null, MediaAssetKind.VIDEO, MediaAssetState.TRASH, "media", "t1/v.mp4", null, "video/mp4", 100, time.now(), null, null, false, null, time.now(), time.now());
        when(assets.findByIdForUpdate("m1")).thenReturn(Optional.of(trash));
        when(refs.countByApplicationIdAndMediaAssetId("t1", "m1")).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.purge("m1", "t1", "sa", List.of("t1"), true));
    }
}
