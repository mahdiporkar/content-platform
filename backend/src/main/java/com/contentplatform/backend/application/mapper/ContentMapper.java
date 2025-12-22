package com.contentplatform.backend.application.mapper;

import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.domain.model.Article;
import com.contentplatform.backend.domain.model.Post;
import com.contentplatform.backend.domain.model.Video;
import org.springframework.stereotype.Component;

@Component
public class ContentMapper {
    public PostDto toPostDto(Post post) {
        return new PostDto(
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

    public ArticleDto toArticleDto(Article article) {
        return new ArticleDto(
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

    public VideoDto toVideoDto(Video video) {
        return new VideoDto(
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
}
