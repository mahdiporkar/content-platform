package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreatePostCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.UpdatePostCommand;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.mapper.ContentMapper;
import com.contentplatform.backend.application.port.in.PostUseCase;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.PostRepository;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.Post;
import com.contentplatform.backend.domain.value.ContentStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PostService implements PostUseCase {
    private final PostRepository postRepository;
    private final TimeProvider timeProvider;
    private final ContentMapper mapper;

    public PostService(PostRepository postRepository, TimeProvider timeProvider, ContentMapper mapper) {
        this.postRepository = postRepository;
        this.timeProvider = timeProvider;
        this.mapper = mapper;
    }

    @Override
    public PostDto create(CreatePostCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Instant now = timeProvider.now();
        Instant publishedAt = command.getStatus() == ContentStatus.PUBLISHED ? now : null;
        Post post = new Post(
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
        return mapper.toPostDto(postRepository.save(post));
    }

    @Override
    public PostDto update(UpdatePostCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Post existing = postRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Post not found"));
        Instant publishedAt = resolvePublishedAt(existing.getStatus(), command.getStatus(), existing.getPublishedAt());
        Post updated = new Post(
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
        return mapper.toPostDto(postRepository.save(updated));
    }

    @Override
    public PostDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds) {
        enforceTenant(command.getApplicationId(), allowedApplicationIds);
        Post existing = postRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Post not found"));
        Instant publishedAt = resolvePublishedAt(existing.getStatus(), command.getStatus(), existing.getPublishedAt());
        Post updated = new Post(
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
        return mapper.toPostDto(postRepository.save(updated));
    }

    @Override
    public PostDto getBySlug(String applicationId, String slug) {
        Post post = postRepository.findByApplicationIdAndSlug(applicationId, slug)
            .orElseThrow(() -> new NotFoundException("Post not found"));
        return mapper.toPostDto(post);
    }

    @Override
    public PageResult<PostDto> list(String applicationId, ContentStatus status, PageRequest pageRequest) {
        PageSlice<Post> pageSlice;
        if (status != null) {
            pageSlice = postRepository.findByApplicationIdAndStatus(applicationId, status, pageRequest.getPage(), pageRequest.getSize());
        } else {
            pageSlice = postRepository.findByApplicationId(applicationId, pageRequest.getPage(), pageRequest.getSize());
        }
        return new PageResult<>(
            pageSlice.items().stream().map(mapper::toPostDto).toList(),
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
