package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.PostEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.PostJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicContentControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationJpaRepository applicationRepository;

    @Autowired
    private PostJpaRepository postRepository;

    @BeforeEach
    void setUp() {
        postRepository.deleteAll();
        applicationRepository.deleteAll();
    }

    @Test
    void listPostsReturnsOnlyPublishedContent() throws Exception {
        String applicationId = "app-1";
        applicationRepository.save(new ApplicationEntity(applicationId, "Demo App"));

        postRepository.save(new PostEntity(
            "post-1",
            applicationId,
            "Published title",
            "published-title",
            "content",
            ContentStatus.PUBLISHED,
            Instant.parse("2024-01-01T00:00:00Z"),
            Instant.parse("2024-01-01T00:00:00Z"),
            Instant.parse("2024-01-01T00:00:00Z")
        ));

        postRepository.save(new PostEntity(
            "post-2",
            applicationId,
            "Draft title",
            "draft-title",
            "content",
            ContentStatus.DRAFT,
            null,
            Instant.parse("2024-01-02T00:00:00Z"),
            Instant.parse("2024-01-02T00:00:00Z")
        ));

        mockMvc.perform(get("/api/v1/public/{applicationId}/posts", applicationId)
                .param("status", "PUBLISHED")
                .param("page", "0")
                .param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(1))
            .andExpect(jsonPath("$.items[0].slug").value("published-title"));
    }
}
