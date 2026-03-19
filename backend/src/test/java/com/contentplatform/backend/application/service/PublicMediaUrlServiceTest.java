package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.Application;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PublicMediaUrlServiceTest {
    @Test
    void rewritesMinioUrlUsingApplicationBaseUrl() {
        PublicMediaUrlService service = new PublicMediaUrlService(
            repositoryWith(new Application("app-1", "App", "http://app.local/", null, List.of())),
            "http://localhost:3000",
            "http://localhost:9000"
        );

        String rewritten = service.toPublicMediaUrl("app-1", "http://localhost:9000/media/app-1/image/a/b.png");
        assertEquals("http://app.local/media/app-1/image/a/b.png", rewritten);
        assertFalse(rewritten.contains("localhost:9000"));
    }

    @Test
    void fallsBackToContentPlatformBaseUrlWhenApplicationBaseUrlMissing() {
        PublicMediaUrlService service = new PublicMediaUrlService(
            repositoryWith(new Application("app-1", "App", null, null, List.of())),
            "http://localhost:3000/",
            "http://localhost:9000"
        );

        String rewritten = service.toPublicMediaUrl("app-1", "/media/app-1/image/a/b.png");
        assertEquals("http://localhost:3000/media/app-1/image/a/b.png", rewritten);
    }

    @Test
    void rewritesHtmlMediaLinksAndLeavesOtherLinksUntouched() {
        PublicMediaUrlService service = new PublicMediaUrlService(
            repositoryWith(new Application("app-1", "App", "http://app.local", null, List.of())),
            "http://localhost:3000",
            "http://localhost:9000"
        );

        String html = "<p><img src=\"http://localhost:9000/media/app-1/image/a.png\"><a href=\"https://example.com\">link</a></p>";
        String rewritten = service.rewriteHtmlMediaUrls("app-1", html);

        assertEquals("<p><img src=\"http://app.local/media/app-1/image/a.png\"><a href=\"https://example.com\">link</a></p>", rewritten);
        assertFalse(rewritten.contains("localhost:9000"));
    }

    private ApplicationRepository repositoryWith(Application application) {
        return new ApplicationRepository() {
            @Override
            public Optional<Application> findById(String id) {
                return application.getId().equals(id) ? Optional.of(application) : Optional.empty();
            }

            @Override
            public Optional<Application> findFirst() {
                return Optional.of(application);
            }

            @Override
            public List<Application> findAll() {
                return List.of(application);
            }

            @Override
            public Application save(Application application) {
                return application;
            }

            @Override
            public void deleteById(String id) {
            }

            @Override
            public boolean existsById(String id) {
                return application.getId().equals(id);
            }

            @Override
            public long count() {
                return 1;
            }
        };
    }
}
