package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreateArticleCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UpdateArticleCommand;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.mapper.ContentMapper;
import com.contentplatform.backend.application.port.in.ArticleUseCase;
import com.contentplatform.backend.application.port.out.ArticleRepository;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.Article;
import com.contentplatform.backend.domain.value.ContentStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ArticleService implements ArticleUseCase {
    private final ArticleRepository articleRepository;
    private final TimeProvider timeProvider;
    private final ContentMapper mapper;

    public ArticleService(ArticleRepository articleRepository, TimeProvider timeProvider, ContentMapper mapper) {
        this.articleRepository = articleRepository;
        this.timeProvider = timeProvider;
        this.mapper = mapper;
    }

    @Override
    public ArticleDto create(CreateArticleCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Instant now = timeProvider.now();
        Instant publishedAt = command.getStatus() == ContentStatus.PUBLISHED ? now : null;
        Article article = new Article(
            UUID.randomUUID().toString(),
            command.getApplicationId(),
            command.getTitle(),
            command.getSlug(),
            command.getContent(),
            command.getStatus(),
            publishedAt,
            now,
            now
        );
        return mapper.toArticleDto(articleRepository.save(article));
    }

    @Override
    public ArticleDto update(UpdateArticleCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Article existing = articleRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Article not found"));
        Instant publishedAt = resolvePublishedAt(existing.getStatus(), command.getStatus(), existing.getPublishedAt());
        Article updated = new Article(
            existing.getId(),
            command.getApplicationId(),
            command.getTitle(),
            command.getSlug(),
            command.getContent(),
            command.getStatus(),
            publishedAt,
            existing.getCreatedAt(),
            timeProvider.now()
        );
        return mapper.toArticleDto(articleRepository.save(updated));
    }

    @Override
    public ArticleDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Article existing = articleRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Article not found"));
        Instant publishedAt = resolvePublishedAt(existing.getStatus(), command.getStatus(), existing.getPublishedAt());
        Article updated = new Article(
            existing.getId(),
            existing.getApplicationId(),
            existing.getTitle(),
            existing.getSlug(),
            existing.getContent(),
            command.getStatus(),
            publishedAt,
            existing.getCreatedAt(),
            timeProvider.now()
        );
        return mapper.toArticleDto(articleRepository.save(updated));
    }

    @Override
    public ArticleDto getBySlug(String applicationId, String slug) {
        Article article = articleRepository.findByApplicationIdAndSlug(applicationId, slug)
            .orElseThrow(() -> new NotFoundException("Article not found"));
        return mapper.toArticleDto(article);
    }

    @Override
    public PageResult<ArticleDto> list(String applicationId, ContentStatus status, PageRequest pageRequest) {
        PageSlice<Article> pageSlice;
        if (status != null) {
            pageSlice = articleRepository.findByApplicationIdAndStatus(applicationId, status, pageRequest.getPage(), pageRequest.getSize());
        } else {
            pageSlice = articleRepository.findByApplicationId(applicationId, pageRequest.getPage(), pageRequest.getSize());
        }
        return new PageResult<>(
            pageSlice.items().stream().map(mapper::toArticleDto).toList(),
            pageSlice.totalElements(),
            pageSlice.totalPages(),
            pageSlice.page(),
            pageSlice.size()
        );
    }

    private void enforceTenant(String applicationId, List<String> allowedApplicationIds) {
        if (allowedApplicationIds == null || !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
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
