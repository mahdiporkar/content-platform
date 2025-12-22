package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.ArticleRepository;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.domain.model.Article;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.ArticleEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ArticleJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaArticleRepositoryAdapter implements ArticleRepository {
    private final ArticleJpaRepository repository;

    public JpaArticleRepositoryAdapter(ArticleJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Article save(Article article) {
        return toDomain(repository.save(toEntity(article)));
    }

    @Override
    public Optional<Article> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Article> findByApplicationIdAndSlug(String applicationId, String slug) {
        return repository.findByApplicationIdAndSlug(applicationId, slug).map(this::toDomain);
    }

    @Override
    public PageSlice<Article> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size) {
        Page<ArticleEntity> result = repository.findByApplicationIdAndStatus(
            applicationId,
            status,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    @Override
    public PageSlice<Article> findByApplicationId(String applicationId, int page, int size) {
        Page<ArticleEntity> result = repository.findByApplicationId(
            applicationId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPageSlice(result);
    }

    private PageSlice<Article> toPageSlice(Page<ArticleEntity> page) {
        return new PageSlice<>(
            page.getContent().stream().map(this::toDomain).toList(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.getNumber(),
            page.getSize()
        );
    }

    private ArticleEntity toEntity(Article article) {
        return new ArticleEntity(
            article.getId(),
            article.getApplicationId(),
            article.getTitle(),
            article.getSlug(),
            article.getContent(),
            article.getStatus(),
            article.getPublishedAt(),
            article.getCreatedAt(),
            article.getUpdatedAt()
        );
    }

    private Article toDomain(ArticleEntity entity) {
        return new Article(
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
