package com.contentplatform.backend.interfaces.web.mapper;

import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.interfaces.web.response.ArticleResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import com.contentplatform.backend.interfaces.web.response.PostResponse;
import com.contentplatform.backend.interfaces.web.response.VideoResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebMapper {
    public PostResponse toPostResponse(PostDto dto) {
        return new PostResponse(
            dto.getId(),
            dto.getApplicationId(),
            dto.getTitle(),
            dto.getSlug(),
            dto.getContent(),
            dto.getStatus(),
            dto.getPublishedAt(),
            dto.getCreatedAt(),
            dto.getUpdatedAt()
        );
    }

    public ArticleResponse toArticleResponse(ArticleDto dto) {
        return new ArticleResponse(
            dto.getId(),
            dto.getApplicationId(),
            dto.getTitle(),
            dto.getSlug(),
            dto.getContent(),
            dto.getStatus(),
            dto.getPublishedAt(),
            dto.getCreatedAt(),
            dto.getUpdatedAt()
        );
    }

    public VideoResponse toVideoResponse(VideoDto dto, String presignedUrl) {
        return new VideoResponse(
            dto.getId(),
            dto.getApplicationId(),
            dto.getTitle(),
            dto.getDescription(),
            dto.getStatus(),
            dto.getPublishedAt(),
            dto.getObjectKey(),
            dto.getContentType(),
            dto.getSizeBytes(),
            dto.getCreatedAt(),
            dto.getUpdatedAt(),
            presignedUrl
        );
    }

    public PageResponse<PostResponse> toPostPage(PageResult<PostDto> page) {
        List<PostResponse> items = page.getItems().stream().map(this::toPostResponse).toList();
        return new PageResponse<>(items, page.getTotalElements(), page.getTotalPages(), page.getPage(), page.getSize());
    }

    public PageResponse<ArticleResponse> toArticlePage(PageResult<ArticleDto> page) {
        List<ArticleResponse> items = page.getItems().stream().map(this::toArticleResponse).toList();
        return new PageResponse<>(items, page.getTotalElements(), page.getTotalPages(), page.getPage(), page.getSize());
    }

    public PageResponse<VideoResponse> toVideoPage(PageResult<VideoDto> page, java.util.function.Function<VideoDto, String> presigner) {
        List<VideoResponse> items = page.getItems().stream()
            .map(video -> toVideoResponse(video, presigner.apply(video)))
            .toList();
        return new PageResponse<>(items, page.getTotalElements(), page.getTotalPages(), page.getPage(), page.getSize());
    }
}
