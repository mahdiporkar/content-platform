package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.service.SitemapService;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.request.SitemapCustomUrlRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapOverrideRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapSettingsRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapTemplateRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapTestUrlRequest;
import com.contentplatform.backend.interfaces.web.response.SitemapCustomUrlResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapPreviewResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapSettingsResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapTemplateResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapTestUrlResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin/sitemap")
public class AdminSitemapController {
    private static final Set<ServicePermission> ALLOWED = Set.of(
        ServicePermission.POSTS_MANAGE,
        ServicePermission.ARTICLES_MANAGE,
        ServicePermission.VIDEOS_MANAGE,
        ServicePermission.COLLECTIONS_MANAGE
    );

    private final SitemapService sitemapService;

    public AdminSitemapController(SitemapService sitemapService) {
        this.sitemapService = sitemapService;
    }

    @GetMapping("/settings")
    public ResponseEntity<SitemapSettingsResponse> getSettings(@RequestParam String applicationId) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.getSettings(applicationId));
    }

    @PutMapping("/settings")
    public ResponseEntity<SitemapSettingsResponse> putSettings(@RequestParam String applicationId,
                                                               @RequestBody SitemapSettingsRequest request) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.updateSettings(applicationId, request));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<SitemapTemplateResponse>> listTemplates(@RequestParam String applicationId) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.listTemplates(applicationId));
    }

    @PutMapping("/templates/{contentType}")
    public ResponseEntity<SitemapTemplateResponse> putTemplate(@RequestParam String applicationId,
                                                               @PathVariable String contentType,
                                                               @RequestBody SitemapTemplateRequest request) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.upsertTemplate(applicationId, contentType, request));
    }

    @GetMapping("/preview")
    public ResponseEntity<SitemapPreviewResponse> preview(@RequestParam String applicationId,
                                                          @RequestParam(required = false) String contentType,
                                                          @RequestParam(defaultValue = "50") int limit,
                                                          @RequestParam(defaultValue = "0") int offset) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.preview(applicationId, contentType, limit, offset));
    }

    @PostMapping("/test-url")
    public ResponseEntity<SitemapTestUrlResponse> testUrl(@RequestParam String applicationId,
                                                          @RequestBody SitemapTestUrlRequest request) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.testUrl(applicationId, request.getUrl()));
    }

    @PutMapping("/override/{contentType}/{contentId}")
    public ResponseEntity<Void> putOverride(@RequestParam String applicationId,
                                            @PathVariable String contentType,
                                            @PathVariable String contentId,
                                            @RequestBody SitemapOverrideRequest request) {
        assertAccess(applicationId);
        sitemapService.upsertOverride(applicationId, contentType, contentId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/custom-urls")
    public ResponseEntity<List<SitemapCustomUrlResponse>> listCustomUrls(@RequestParam String applicationId) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.listCustomUrls(applicationId));
    }

    @PostMapping("/custom-urls")
    public ResponseEntity<SitemapCustomUrlResponse> createCustomUrl(@RequestParam String applicationId,
                                                                    @RequestBody SitemapCustomUrlRequest request) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.createCustomUrl(applicationId, request));
    }

    @PutMapping("/custom-urls/{id}")
    public ResponseEntity<SitemapCustomUrlResponse> updateCustomUrl(@RequestParam String applicationId,
                                                                    @PathVariable String id,
                                                                    @RequestBody SitemapCustomUrlRequest request) {
        assertAccess(applicationId);
        return ResponseEntity.ok(sitemapService.updateCustomUrl(applicationId, id, request));
    }

    @DeleteMapping("/custom-urls/{id}")
    public ResponseEntity<Void> deleteCustomUrl(@RequestParam String applicationId, @PathVariable String id) {
        assertAccess(applicationId);
        sitemapService.deleteCustomUrl(applicationId, id);
        return ResponseEntity.noContent().build();
    }

    private void assertAccess(String applicationId) {
        SecurityUtils.requireApplicationAccess(applicationId);
        List<ServicePermission> permissions = SecurityUtils.getServicePermissions();
        if (permissions.isEmpty()) {
            return;
        }
        boolean allowed = permissions.stream().anyMatch(ALLOWED::contains);
        if (!allowed) {
            throw new ForbiddenException("Service permission denied");
        }
    }
}

