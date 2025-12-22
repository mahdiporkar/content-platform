package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreatePostCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.UpdatePostCommand;
import com.contentplatform.backend.application.port.in.PostUseCase;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.mapper.WebMapper;
import com.contentplatform.backend.interfaces.web.request.ChangeStatusRequest;
import com.contentplatform.backend.interfaces.web.request.PostUpsertRequest;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import com.contentplatform.backend.interfaces.web.response.PostResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/posts")
public class AdminPostController {
    private final PostUseCase postUseCase;
    private final WebMapper mapper;

    public AdminPostController(PostUseCase postUseCase, WebMapper mapper) {
        this.postUseCase = postUseCase;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostUpsertRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        PostDto dto = postUseCase.create(
            new CreatePostCommand(
                request.getApplicationId(),
                request.getTitle(),
                request.getSlug(),
                request.getContent(),
                request.getStatus()
            ),
            allowed
        );
        return ResponseEntity.ok(mapper.toPostResponse(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(@PathVariable String id, @Valid @RequestBody PostUpsertRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        PostDto dto = postUseCase.update(
            new UpdatePostCommand(
                id,
                request.getApplicationId(),
                request.getTitle(),
                request.getSlug(),
                request.getContent(),
                request.getStatus()
            ),
            allowed
        );
        return ResponseEntity.ok(mapper.toPostResponse(dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PostResponse> changeStatus(@PathVariable String id, @Valid @RequestBody ChangeStatusRequest request) {
        List<String> allowed = SecurityUtils.getAllowedApplicationIds();
        PostDto dto = postUseCase.changeStatus(new ChangeStatusCommand(id, request.getApplicationId(), request.getStatus()), allowed);
        return ResponseEntity.ok(mapper.toPostResponse(dto));
    }

    @GetMapping
    public ResponseEntity<PageResponse<PostResponse>> list(@RequestParam String applicationId,
                                                           @RequestParam(required = false) ContentStatus status,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        PageResult<PostDto> result = postUseCase.list(applicationId, status, new PageRequest(page, size));
        return ResponseEntity.ok(mapper.toPostPage(result));
    }
}
