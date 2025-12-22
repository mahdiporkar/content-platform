package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.CreatePostCommand;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.mapper.ContentMapper;
import com.contentplatform.backend.application.port.out.PageSlice;
import com.contentplatform.backend.application.port.out.PostRepository;
import com.contentplatform.backend.application.port.out.TimeProvider;
import com.contentplatform.backend.domain.model.Post;
import com.contentplatform.backend.domain.value.ContentStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PostServiceTest {

    @Test
    void createPublishedPostSetsPublishedAt() {
        Instant now = Instant.parse("2024-01-01T00:00:00Z");
        InMemoryPostRepository repository = new InMemoryPostRepository();
        TimeProvider timeProvider = () -> now;
        PostService service = new PostService(repository, timeProvider, new ContentMapper());

        CreatePostCommand command = new CreatePostCommand(
            "app-1",
            "Hello",
            "hello",
            "content",
            ContentStatus.PUBLISHED
        );

        PostDto dto = service.create(command, List.of("app-1"));

        assertThat(dto.getPublishedAt()).isEqualTo(now);
        assertThat(dto.getStatus()).isEqualTo(ContentStatus.PUBLISHED);
        assertThat(repository.store).hasSize(1);
    }

    @Test
    void createRejectsUnauthorizedTenant() {
        InMemoryPostRepository repository = new InMemoryPostRepository();
        TimeProvider timeProvider = Instant::now;
        PostService service = new PostService(repository, timeProvider, new ContentMapper());

        CreatePostCommand command = new CreatePostCommand(
            "app-1",
            "Hello",
            "hello",
            "content",
            ContentStatus.DRAFT
        );

        assertThrows(ForbiddenException.class, () -> service.create(command, List.of("other-app")));
    }

    private static class InMemoryPostRepository implements PostRepository {
        private final List<Post> store = new ArrayList<>();

        @Override
        public Post save(Post post) {
            store.removeIf(existing -> existing.getId().equals(post.getId()));
            store.add(post);
            return post;
        }

        @Override
        public Optional<Post> findById(String id) {
            return store.stream().filter(post -> post.getId().equals(id)).findFirst();
        }

        @Override
        public Optional<Post> findByApplicationIdAndSlug(String applicationId, String slug) {
            return store.stream()
                .filter(post -> post.getApplicationId().equals(applicationId) && post.getSlug().equals(slug))
                .findFirst();
        }

        @Override
        public PageSlice<Post> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size) {
            return new PageSlice<>(List.of(), 0, 0, page, size);
        }

        @Override
        public PageSlice<Post> findByApplicationId(String applicationId, int page, int size) {
            return new PageSlice<>(List.of(), 0, 0, page, size);
        }
    }
}
