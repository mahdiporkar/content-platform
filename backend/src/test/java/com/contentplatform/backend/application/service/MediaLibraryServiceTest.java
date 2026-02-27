package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.RegisterMediaAssetCommand;
import com.contentplatform.backend.application.dto.ResolveMediaVariantQuery;
import com.contentplatform.backend.application.dto.UpsertMediaVariantCommand;
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.ConflictException;
import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.MediaStoragePort;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.domain.value.MediaAssetState;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaVariantEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.AuditLogJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaReferenceJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaVariantJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    @Test
    void addVariantRejectsDuplicatePurposeSizeDevice() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset media = new MediaAsset("m1", "t1", null, MediaAssetKind.IMAGE, MediaAssetState.ACTIVE, "media", "t1/img.jpg", null, "image/jpeg", 100, null, null, null, false, null, time.now(), time.now());
        when(assets.findById("m1")).thenReturn(Optional.of(media));
        when(variants.findByMediaAssetId("m1")).thenReturn(List.of());
        when(variants.existsByMediaAssetIdAndPurposeAndSizeKeyAndDevice("m1", "default", "xs", "mobile")).thenReturn(true);

        UpsertMediaVariantCommand command = new UpsertMediaVariantCommand(
            "default",
            "xs",
            null,
            null,
            "mobile",
            "jpg",
            null,
            null,
            null,
            null,
            true,
            0,
            "hero.jpg",
            "image/jpeg",
            123L,
            new ByteArrayInputStream(new byte[] {1, 2, 3})
        );

        assertThrows(ConflictException.class, () -> service.addVariant("m1", "t1", command, List.of("t1")));
    }

    @Test
    void deleteVariantRejectsDefault() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset media = new MediaAsset("m1", "t1", null, MediaAssetKind.IMAGE, MediaAssetState.ACTIVE, "media", "t1/img.jpg", null, "image/jpeg", 100, null, null, null, false, null, time.now(), time.now());
        when(assets.findById("m1")).thenReturn(Optional.of(media));
        MediaVariantEntity defaultVariant = new MediaVariantEntity(
            "v1", "m1", "t1", "ORIGINAL", "default", null, null, null, null, "jpg",
            null, null, null, null, "media", "t1/img.jpg", null, 100, true, 0, time.now(), time.now()
        );
        when(variants.findByIdAndMediaAssetId("v1", "m1")).thenReturn(Optional.of(defaultVariant));

        assertThrows(BadRequestException.class, () -> service.deleteVariant("m1", "v1", "t1", List.of("t1")));
    }

    @Test
    void resolveVariantReturnsExactMatch() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset media = new MediaAsset("m1", "t1", null, MediaAssetKind.IMAGE, MediaAssetState.ACTIVE, "media", "t1/img.jpg", null, "image/jpeg", 100, null, null, null, false, null, time.now(), time.now());
        when(assets.findById("m1")).thenReturn(Optional.of(media));
        when(refs.countByApplicationIdAndMediaAssetId("t1", "m1")).thenReturn(0L);
        when(variants.countByMediaAssetIdAndIsDefaultTrue("m1")).thenReturn(1L);

        MediaVariantEntity base = new MediaVariantEntity(
            "v-default", "m1", "t1", "ORIGINAL", "default", null, null, null, null, "jpg",
            null, null, null, null, "media", "t1/img.jpg", "http://localhost:9000/media/t1/img.jpg", 100, true, 0, time.now(), time.now()
        );
        MediaVariantEntity heroMobile = new MediaVariantEntity(
            "v-hero", "m1", "t1", "DERIVED", "hero", "xs", null, null, "mobile", "webp",
            390, 220, null, null, "media", "t1/hero.webp", "http://localhost:9000/media/t1/hero.webp", 80, false, 10, time.now(), time.now()
        );
        when(variants.findByMediaAssetIdOrderBySortOrderDescUpdatedAtDesc("m1")).thenReturn(List.of(heroMobile, base));

        var resolved = service.resolveVariant("m1", "t1", new ResolveMediaVariantQuery("hero", "xs", null, "mobile", "webp"));
        assertEquals("v-hero", resolved.variantId());
        assertEquals(false, resolved.fallbackUsed());
    }

    @Test
    void resolveVariantFallsBackToDefaultFromViewport() {
        MediaAssetRepository assets = mock(MediaAssetRepository.class);
        VideoJpaRepository videos = mock(VideoJpaRepository.class);
        MediaReferenceJpaRepository refs = mock(MediaReferenceJpaRepository.class);
        MediaVariantJpaRepository variants = mock(MediaVariantJpaRepository.class);
        AuditLogJpaRepository audit = mock(AuditLogJpaRepository.class);
        MediaStoragePort storage = mock(MediaStoragePort.class);
        TimeProvider time = () -> Instant.parse("2026-02-21T10:00:00Z");
        MediaLibraryService service = new MediaLibraryService(assets, videos, refs, variants, audit, storage, time, "media", "http://localhost:9000");

        MediaAsset media = new MediaAsset("m1", "t1", null, MediaAssetKind.IMAGE, MediaAssetState.ACTIVE, "media", "t1/img.jpg", null, "image/jpeg", 100, null, null, null, false, null, time.now(), time.now());
        when(assets.findById("m1")).thenReturn(Optional.of(media));
        when(refs.countByApplicationIdAndMediaAssetId("t1", "m1")).thenReturn(0L);
        when(variants.countByMediaAssetIdAndIsDefaultTrue("m1")).thenReturn(1L);

        MediaVariantEntity base = new MediaVariantEntity(
            "v-default", "m1", "t1", "ORIGINAL", "default", null, null, null, null, "jpg",
            null, null, null, null, "media", "t1/img.jpg", "http://localhost:9000/media/t1/img.jpg", 100, true, 0, time.now(), time.now()
        );
        MediaVariantEntity thumbnailSm = new MediaVariantEntity(
            "v-thumb-sm", "m1", "t1", "DERIVED", "thumbnail", "sm", null, null, "mobile", "jpg",
            640, 360, null, null, "media", "t1/thumb-sm.jpg", "http://localhost:9000/media/t1/thumb-sm.jpg", 70, false, 3, time.now(), time.now()
        );
        when(variants.findByMediaAssetIdOrderBySortOrderDescUpdatedAtDesc("m1")).thenReturn(List.of(thumbnailSm, base));

        var resolved = service.resolveVariant("m1", "t1", new ResolveMediaVariantQuery("thumbnail", null, 390, "mobile", "webp"));
        assertEquals("v-default", resolved.variantId());
        assertTrue(resolved.fallbackUsed());
    }
}
