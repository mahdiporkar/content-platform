package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.PostRepository;
import com.contentplatform.backend.domain.model.Post;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.PostEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.PostJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaPostRepositoryAdapter implements PostRepository {
    private final PostJpaRepository repository;

    public JpaPostRepositoryAdapter(PostJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Post save(Post post) {
        return toDomain(repository.save(toEntity(post)));
    }

    @Override
    public Optional<Post> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Post> findByApplicationIdAndSlug(String applicationId, String slug) {
        return repository.findByApplicationIdAndSlug(applicationId, slug).map(this::toDomain);
    }

    @Override
    public PageSlice<Post> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size) {
        Page<PostEntity> result = repository.findByApplicationIdAndStatus(
            applicationId,
            status,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    @Override
    public PageSlice<Post> findByApplicationId(String applicationId, int page, int size) {
        Page<PostEntity> result = repository.findByApplicationId(
            applicationId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    private PageSlice<Post> toPageSlice(Page<PostEntity> page) {
        return new PageSlice<>(
            page.getContent().stream().map(this::toDomain).toList(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.getNumber(),
            page.getSize()
        );
    }

    private PostEntity toEntity(Post post) {
        return new PostEntity(
            post.getId(),
            post.getApplicationId(),
            post.getTitle(),
            post.getSlug(),
            post.getContent(),
            post.getStatus(),
            post.getPublishedAt(),
            post.getCreatedAt(),
            post.getUpdatedAt()
        );
    }

    private Post toDomain(PostEntity entity) {
        return new Post(
            entity.getId(),
            entity.getApplicationId(),
            entity.getTitle(),
            entity.getSlug(),
            entity.getContent(),
            entity.getStatus(),
            entity.getPublishedAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
