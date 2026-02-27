package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.service.SitemapService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/{tenant}")
public class PublicSitemapController {
    private final SitemapService sitemapService;

    public PublicSitemapController(SitemapService sitemapService) {
        this.sitemapService = sitemapService;
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap(@PathVariable String tenant) {
        return ResponseEntity.ok(sitemapService.getPublicSitemapXml(tenant, null, null));
    }

    @GetMapping(value = "/sitemap-{type}-{index}.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemapChunk(@PathVariable String tenant,
                                               @PathVariable String type,
                                               @PathVariable Integer index) {
        return ResponseEntity.ok(sitemapService.getPublicSitemapXml(tenant, type, index));
    }
}

