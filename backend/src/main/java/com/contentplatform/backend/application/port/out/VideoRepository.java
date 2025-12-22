package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.Video;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.Optional;

public interface VideoRepository {
    Video save(Video video);
    Optional<Video> findById(String id);
    PageSlice<Video> findByApplicationIdAndStatus(String applicationId, ContentStatus status, int page, int size);
    PageSlice<Video> findByApplicationId(String applicationId, int page, int size);
}
