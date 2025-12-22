package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.Article;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.Optional;

public interface ArticleRepository {
    Article save(Article article);
    Optional<Article> findById(String id);
    Optional<Article> findByApplicationIdAndSlug(String applicationId, String slug);
    PageSlice<Article> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size);
    PageSlice<Article> findByApplicationId(String applicationId, int page, int size);
}
