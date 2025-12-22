package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.VideoDto;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.ArticleUseCase;
import com.contentplatform.backend.application.port.in.PostUseCase;
import com.contentplatform.backend.application.port.in.VideoUseCase;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.response.ArticleResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import com.contentplatform.backend.interfaces.web.response.PostResponse;
import com.contentplatform.backend.interfaces.web.response.VideoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
public class PublicContentController {
    private final PostUseCase postUseCase;
    private final ArticleUseCase articleUseCase;
    private final VideoUseCase videoUseCase;
    private final WebMapper mapper;

    public PublicContentController(PostUseCase postUseCase, ArticleUseCase articleUseCase, VideoUseCase videoUseCase, WebMapper mapper) {
        this.postUseCase = postUseCase;
        this.articleUseCase = articleUseCase;
        this.videoUseCase = videoUseCase;
        this.mapper = mapper;
    }

    @GetMapping("/{applicationId}/posts")
    public ResponseEntity<PageResponse<PostResponse>> listPosts(@PathVariable String applicationId,
                                                                @RequestParam(defaultValue = "PUBLISHED") ContentStatus status,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        PageResult<PostDto> result = postUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toPostPage(result));
    }

    @GetMapping("/{applicationId}/posts/{slug}")
    public ResponseEntity<PostResponse> getPost(@PathVariable String applicationId, @PathVariable String slug) {
        PostDto dto = postUseCase.getBySlug(applicationId, slug);
        if (dto.getStatus() != ContentStatus.PUBLISHED) {
            throw new NotFoundException("Post not found");
        }
        return ResponseEntity.ok(mapper.toPostResponse(dto));
    }

    @GetMapping("/{applicationId}/articles")
    public ResponseEntity<PageResponse<ArticleResponse>> listArticles(@PathVariable String applicationId,
                                                                       @RequestParam(defaultValue = "PUBLISHED") ContentStatus status,
                                                                       @RequestParam(defaultValue = "0") int page,
                                                                       @RequestParam(defaultValue = "10") int size) {
        PageResult<ArticleDto> result = articleUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toArticlePage(result));
    }

    @GetMapping("/{applicationId}/articles/{slug}")
    public ResponseEntity<ArticleResponse> getArticle(@PathVariable String applicationId, @PathVariable String slug) {
        ArticleDto dto = articleUseCase.getBySlug(applicationId, slug);
        if (dto.getStatus() != ContentStatus.PUBLISHED) {
            throw new NotFoundException("Article not found");
        }
        return ResponseEntity.ok(mapper.toArticleResponse(dto));
    }

    @GetMapping("/{applicationId}/videos")
    public ResponseEntity<PageResponse<VideoResponse>> listVideos(@PathVariable String applicationId,
                                                                   @RequestParam(defaultValue = "PUBLISHED") ContentStatus status,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "10") int size) {
        PageResult<VideoDto> result = videoUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toVideoPage(result, video -> videoUseCase.getPresignedUrl(video.getObjectKey())));
    }
}
