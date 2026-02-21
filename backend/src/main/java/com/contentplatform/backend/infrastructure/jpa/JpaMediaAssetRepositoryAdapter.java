package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.MediaAssetRepository;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.domain.model.MediaAsset;
import com.contentplatform.backend.domain.value.MediaAssetKind;
import com.contentplatform.backend.infrastructure.jpa.entity.MediaAssetEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.MediaAssetJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaMediaAssetRepositoryAdapter implements MediaAssetRepository {
    private final MediaAssetJpaRepository repository;

    public JpaMediaAssetRepositoryAdapter(MediaAssetJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public MediaAsset save(MediaAsset mediaAsset) {
        return toDomain(repository.save(toEntity(mediaAsset)));
    }

    @Override
    public Optional<MediaAsset> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<MediaAsset> findByApplicationIdAndObjectKey(String applicationId, String objectKey) {
        return repository.findByApplicationIdAndObjectKey(applicationId, objectKey).map(this::toDomain);
    }

    @Override
    public PageSlice<MediaAsset> findByApplicationId(String applicationId, MediaAssetKind kind, String search, int page, int size) {
        Page<MediaAssetEntity> result = repository.searchByApplicationId(
            applicationId,
            kind,
            search == null || search.isBlank() ? null : search.trim(),
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new PageSlice<>(
            result.getContent().stream().map(this::toDomain).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.getNumber(),
            result.getSize()
        );
    }

    private MediaAssetEntity toEntity(MediaAsset mediaAsset) {
        return new MediaAssetEntity(
            mediaAsset.getId(),
            mediaAsset.getApplicationId(),
            mediaAsset.getKind(),
            mediaAsset.getObjectKey(),
            mediaAsset.getOriginalName(),
            mediaAsset.getContentType(),
            mediaAsset.getSizeBytes(),
            mediaAsset.getCreatedAt(),
            mediaAsset.getUpdatedAt()
        );
    }

    private MediaAsset toDomain(MediaAssetEntity entity) {
        return new MediaAsset(
            entity.getId(),
            entity.getApplicationId(),
            entity.getKind(),
            entity.getObjectKey(),
            entity.getOriginalName(),
            entity.getContentType(),
            entity.getSizeBytes(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
