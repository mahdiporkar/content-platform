package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.VideoRepository;
import com.contentplatform.backend.domain.model.Video;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.VideoEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaVideoRepositoryAdapter implements VideoRepository {
    private final VideoJpaRepository repository;

    public JpaVideoRepositoryAdapter(VideoJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Video save(Video video) {
        return toDomain(repository.save(toEntity(video)));
    }

    @Override
    public Optional<Video> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public PageSlice<Video> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size) {
        Page<VideoEntity> result = repository.findByApplicationIdAndStatus(
            applicationId,
            status,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    @Override
    public PageSlice<Video> findByApplicationId(String applicationId, int page, int size) {
        Page<VideoEntity> result = repository.findByApplicationId(
            applicationId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    private PageSlice<Video> toPageSlice(Page<VideoEntity> page) {
        return new PageSlice<>(
            page.getContent().stream().map(this::toDomain).toList(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.getNumber(),
            page.getSize()
        );
    }

    private VideoEntity toEntity(Video video) {
        return new VideoEntity(
            video.getId(),
            video.getApplicationId(),
            video.getTitle(),
            video.getDescription(),
            video.getStatus(),
            video.getPublishedAt(),
            video.getObjectKey(),
            video.getContentType(),
            video.getSizeBytes(),
            video.getCreatedAt(),
            video.getUpdatedAt()
        );
    }

    private Video toDomain(VideoEntity entity) {
        return new Video(
            entity.getId(),
            entity.getApplicationId(),
            entity.getTitle(),
            entity.getDescription(),
            entity.getStatus(),
            entity.getPublishedAt(),
            entity.getObjectKey(),
            entity.getContentType(),
            entity.getSizeBytes(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
