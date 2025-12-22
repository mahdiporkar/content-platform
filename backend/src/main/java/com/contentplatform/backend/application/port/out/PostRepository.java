package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.Post;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.Optional;

public interface PostRepository {
    Post save(Post post);
    Optional<Post> findById(String id);
    Optional<Post> findByApplicationIdAndSlug(String applicationId, String slug);
    PageSlice<Post> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size);
    PageSlice<Post> findByApplicationId(String applicationId, int page, int size);
}
