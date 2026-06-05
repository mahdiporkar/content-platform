package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.service.PageMenuService;
import com.contentplatform.backend.application.service.SitemapService;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.request.PageUpsertRequest;
import com.contentplatform.backend.interfaces.web.request.StatusOnlyRequest;
import com.contentplatform.backend.interfaces.web.response.PageContentResponse;
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

@RestController
@RequestMapping("/api/v1/admin/pages")
public class AdminPageController {
    private final PageMenuService pageMenuService;
    private final SitemapService sitemapService;

    public AdminPageController(PageMenuService pageMenuService, SitemapService sitemapService) {
        this.pageMenuService = pageMenuService;
        this.sitemapService = sitemapService;
    }

    @PostMapping
    public ResponseEntity<PageContentResponse> create(@Valid @RequestBody PageUpsertRequest request) {
        SecurityUtils.requireServicePermission(ServicePermission.PAGES_MANAGE);
        SecurityUtils.requireApplicationAccess(request.getApplicationId());
        PageContentResponse created = pageMenuService.createPage(request, SecurityUtils.userIdOrNull());
        sitemapService.invalidateTenantCacheIfOnPublish(created.getApplicationId());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PageContentResponse> update(@PathVariable String id, @Valid @RequestBody PageUpsertRequest request) {
        String applicationId = pageMenuService.getPageApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.PAGES_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        PageContentResponse updated = pageMenuService.updatePage(id, request, SecurityUtils.userIdOrNull());
        sitemapService.invalidateTenantCacheIfOnPublish(updated.getApplicationId());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PageContentResponse> changeStatus(@PathVariable String id, @Valid @RequestBody StatusOnlyRequest request) {
        String applicationId = pageMenuService.getPageApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.PAGES_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        PageContentResponse updated = pageMenuService.changePageStatus(id, request.getStatus(), SecurityUtils.userIdOrNull());
        sitemapService.invalidateTenantCacheIfOnPublish(updated.getApplicationId());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PageContentResponse> get(@PathVariable String id) {
        String applicationId = pageMenuService.getPageApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.PAGES_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.getPage(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<PageContentResponse>> list(@RequestParam String applicationId,
                                                                  @RequestParam(required = false) ContentStatus status,
                                                                  @RequestParam(required = false) String languageCode,
                                                                  @RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "10") int size) {
        SecurityUtils.requireServicePermission(ServicePermission.PAGES_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.listPages(applicationId, status, languageCode, page, size));
    }
}
