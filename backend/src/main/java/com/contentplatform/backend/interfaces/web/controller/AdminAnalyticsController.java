package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.infrastructure.jpa.repository.ArticleJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.PostJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.response.AnalyticsTimelinePointResponse;
import com.contentplatform.backend.interfaces.web.response.AnalyticsTopContentResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/admin/analytics")
public class AdminAnalyticsController {
    private final ArticleJpaRepository articleRepository;
    private final PostJpaRepository postRepository;
    private final VideoJpaRepository videoRepository;

    public AdminAnalyticsController(ArticleJpaRepository articleRepository,
                                    PostJpaRepository postRepository,
                                    VideoJpaRepository videoRepository) {
        this.articleRepository = articleRepository;
        this.postRepository = postRepository;
        this.videoRepository = videoRepository;
    }

    @GetMapping("/top")
    public ResponseEntity<List<AnalyticsTopContentResponse>> top(@RequestParam String applicationId,
                                                                 @RequestParam(required = false) String type,
                                                                 @RequestParam(defaultValue = "10") int limit) {
        SecurityUtils.requireServicePermission(ServicePermission.ANALYTICS_VIEW);
        SecurityUtils.requireApplicationAccess(applicationId);
        int size = Math.max(1, Math.min(limit, 100));
        String normalizedType = normalizeType(type);
        List<AnalyticsTopContentResponse> items = switch (normalizedType) {
            case "video" -> videoRepository.findByApplicationIdAndDeletedAtIsNull(applicationId, PageRequest.of(0, size)).stream()
                .map(video -> new AnalyticsTopContentResponse(video.getId(), video.getTitle(), "video", 0))
                .toList();
            case "post" -> postRepository.findByApplicationId(applicationId, PageRequest.of(0, size)).stream()
                .map(post -> new AnalyticsTopContentResponse(post.getId(), post.getTitle(), "post", 0))
                .toList();
            default -> articleRepository.findByApplicationId(applicationId, PageRequest.of(0, size)).stream()
                .map(article -> new AnalyticsTopContentResponse(article.getId(), article.getTitle(), "article", 0))
                .toList();
        };
        return ResponseEntity.ok(items.stream()
            .sorted(Comparator.comparing(AnalyticsTopContentResponse::title))
            .toList());
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<AnalyticsTimelinePointResponse>> timeline(@RequestParam String applicationId,
                                                                         @RequestParam(defaultValue = "30") int days) {
        SecurityUtils.requireServicePermission(ServicePermission.ANALYTICS_VIEW);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(List.of());
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "article";
        }
        return type.trim().toLowerCase(Locale.ROOT);
    }
}
