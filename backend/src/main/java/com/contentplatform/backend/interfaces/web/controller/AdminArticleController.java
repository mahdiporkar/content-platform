package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreateArticleCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UpdateArticleCommand;
import com.contentplatform.backend.application.port.in.ArticleUseCase;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.request.ArticleUpsertRequest;
import com.contentplatform.backend.interfaces.web.request.ChangeStatusRequest;
import com.contentplatform.backend.interfaces.web.response.ArticleResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/articles")
public class AdminArticleController {
    private final ArticleUseCase articleUseCase;
    private final WebMapper mapper;

    public AdminArticleController(ArticleUseCase articleUseCase, WebMapper mapper) {
        this.articleUseCase = articleUseCase;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ArticleResponse> create(@Valid @RequestBody ArticleUpsertRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        ArticleDto dto = articleUseCase.create(
            new CreateArticleCommand(
                request.getApplicationId(),
                request.getTitle(),
                request.getSlug(),
                request.getContent(),
                request.getStatus()
            ),
            allowed
        );
        return ResponseEntity.ok(mapper.toArticleResponse(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleResponse> update(@PathVariable String id, @Valid @RequestBody ArticleUpsertRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        ArticleDto dto = articleUseCase.update(
            new UpdateArticleCommand(
                id,
                request.getApplicationId(),
                request.getTitle(),
                request.getSlug(),
                request.getContent(),
                request.getStatus()
            ),
            allowed
        );
        return ResponseEntity.ok(mapper.toArticleResponse(dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ArticleResponse> changeStatus(@PathVariable String id, @Valid @RequestBody ChangeStatusRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        ArticleDto dto = articleUseCase.changeStatus(new ChangeStatusCommand(id, request.getApplicationId(), request.getStatus()), allowed);
        return ResponseEntity.ok(mapper.toArticleResponse(dto));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ArticleResponse>> list(@RequestParam String applicationId,
                                                              @RequestParam(required = false) ContentStatus status,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "10") int size) {
        PageResult<ArticleDto> result = articleUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toArticlePage(result));
    }
}
