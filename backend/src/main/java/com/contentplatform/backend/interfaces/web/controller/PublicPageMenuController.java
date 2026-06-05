package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.service.PageMenuService;
import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.interfaces.web.response.MenuResponse;
import com.contentplatform.backend.interfaces.web.response.PageContentResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/content")
public class PublicPageMenuController {
    private final PageMenuService pageMenuService;

    public PublicPageMenuController(PageMenuService pageMenuService) {
        this.pageMenuService = pageMenuService;
    }

    @GetMapping("/pages")
    public ResponseEntity<List<PageContentResponse>> listPages(@RequestHeader("application-id") String applicationId,
                                                               @RequestHeader("application-token") String token,
                                                               @RequestParam(required = false) String languageCode) {
        String appId = pageMenuService.validateApplicationToken(applicationId, token);
        return ResponseEntity.ok(pageMenuService.listPublishedPages(appId, languageCode));
    }

    @GetMapping("/pages/slugs")
    public ResponseEntity<List<Map<String, String>>> listPageSlugs(@RequestHeader("application-id") String applicationId,
                                                                   @RequestHeader("application-token") String token,
                                                                   @RequestParam(required = false) String languageCode) {
        String appId = pageMenuService.validateApplicationToken(applicationId, token);
        return ResponseEntity.ok(pageMenuService.listPublishedPages(appId, languageCode).stream()
            .map(page -> Map.of("slug", page.getSlug(), "languageCode", page.getLanguageCode()))
            .toList());
    }

    @GetMapping("/pages/{languageCode}/{slug}")
    public ResponseEntity<PageContentResponse> getPage(@RequestHeader("application-id") String applicationId,
                                                       @RequestHeader("application-token") String token,
                                                       @PathVariable String languageCode,
                                                       @PathVariable String slug) {
        String appId = pageMenuService.validateApplicationToken(applicationId, token);
        return ResponseEntity.ok(pageMenuService.getPublishedPage(appId, languageCode, slug));
    }

    @GetMapping("/menus/location/{languageCode}/{location}")
    public ResponseEntity<List<MenuResponse>> getMenusByLocation(@RequestHeader("application-id") String applicationId,
                                                                 @RequestHeader("application-token") String token,
                                                                 @PathVariable String languageCode,
                                                                 @PathVariable MenuLocation location) {
        String appId = pageMenuService.validateApplicationToken(applicationId, token);
        return ResponseEntity.ok(pageMenuService.getPublicMenusByLocation(appId, languageCode, location));
    }

    @GetMapping("/menus/{languageCode}/{code}")
    public ResponseEntity<MenuResponse> getMenu(@RequestHeader("application-id") String applicationId,
                                                @RequestHeader("application-token") String token,
                                                @PathVariable String languageCode,
                                                @PathVariable String code) {
        String appId = pageMenuService.validateApplicationToken(applicationId, token);
        return ResponseEntity.ok(pageMenuService.getPublicMenuByCode(appId, languageCode, code));
    }
}
