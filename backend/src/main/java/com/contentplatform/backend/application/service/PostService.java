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
import com.contentplatform.backend.domain.value.ContentLocale;
import com.contentplatform.backend.domain.value.ContentStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PostService implements PostUseCase {
    private static final int AVERAGE_WORDS_PER_MINUTE = 200;
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern MARKDOWN_SYMBOLS_PATTERN = Pattern.compile("[`*_#>\\-\\[\\]()!]");
    private static final Pattern WORD_PATTERN = Pattern.compile("[A-Za-z0-9\\u0600-\\u06FF]+");

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
        int readingTimeMinutes = calculateReadingTimeMinutes(command.getContent());
        Post post = new Post(
            UUID.randomUUID().toString(),
            command.getApplicationId(),
            command.getTitle(),
            command.getSlug(),
            command.getContent(),
            ContentLocale.normalizeOrDefault(command.getLocale()),
            command.getStatus(),
            publishedAt,
            readingTimeMinutes,
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
        int readingTimeMinutes = calculateReadingTimeMinutes(command.getContent());
        Post updated = new Post(
            existing.getId(),
            command.getApplicationId(),
            command.getTitle(),
            command.getSlug(),
            command.getContent(),
            ContentLocale.normalizeOrDefault(command.getLocale()),
            command.getStatus(),
            publishedAt,
            readingTimeMinutes,
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
            existing.getLocale(),
            command.getStatus(),
            publishedAt,
            existing.getReadingTimeMinutes(),
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

    private int calculateReadingTimeMinutes(String content) {
        if (content == null || content.isBlank()) {
            return 0;
        }

        String plainText = HTML_TAG_PATTERN.matcher(content).replaceAll(" ");
        plainText = MARKDOWN_SYMBOLS_PATTERN.matcher(plainText).replaceAll(" ");
        plainText = plainText.replaceAll("\\s+", " ").trim();

        if (plainText.isEmpty()) {
            return 0;
        }

        int words = 0;
        var matcher = WORD_PATTERN.matcher(plainText);
        while (matcher.find()) {
            words++;
        }

        if (words == 0) {
            return 0;
        }

        return Math.max(1, (int) Math.ceil((double) words / AVERAGE_WORDS_PER_MINUTE));
    }
}
