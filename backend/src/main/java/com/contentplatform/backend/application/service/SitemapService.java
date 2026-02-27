package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.domain.value.GalleryImage;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.ArticleEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.PostEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.SitemapCustomUrlEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.SitemapOverrideEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.SitemapSettingsEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.SitemapTemplateEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.SitemapUrlCheckEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.VideoEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.ArticleJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.PostJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.SitemapCustomUrlJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.SitemapOverrideJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.SitemapSettingsJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.SitemapTemplateJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.SitemapUrlCheckJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.VideoJpaRepository;
import com.contentplatform.backend.interfaces.web.request.SitemapCustomUrlRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapOverrideRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapSettingsRequest;
import com.contentplatform.backend.interfaces.web.request.SitemapTemplateRequest;
import com.contentplatform.backend.interfaces.web.response.SitemapCustomUrlResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapPreviewItemResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapPreviewResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapSettingsResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapTemplateResponse;
import com.contentplatform.backend.interfaces.web.response.SitemapTestUrlResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SitemapService {
    private static final Set<String> CONTENT_TYPES = Set.of("article", "post", "video", "photo", "gallery", "page");
    private static final Set<String> CHANGEFREQ = Set.of("always", "hourly", "daily", "weekly", "monthly", "yearly", "never");
    private static final Set<String> PLACEHOLDERS = Set.of(
        "slug", "id", "lang", "categorySlug", "publishedYear", "publishedMonth", "publishedDay"
    );
    private static final Pattern TOKEN = Pattern.compile("\\{([a-zA-Z0-9_]+)}");

    private final SitemapSettingsJpaRepository settingsRepo;
    private final SitemapTemplateJpaRepository templateRepo;
    private final SitemapOverrideJpaRepository overrideRepo;
    private final SitemapCustomUrlJpaRepository customUrlRepo;
    private final SitemapUrlCheckJpaRepository urlCheckRepo;
    private final PostJpaRepository postRepo;
    private final ArticleJpaRepository articleRepo;
    private final VideoJpaRepository videoRepo;
    private final ApplicationJpaRepository applicationRepo;
    private final ObjectMapper objectMapper;

    private final Map<String, CachedSitemap> cache = new HashMap<>();

    public SitemapService(SitemapSettingsJpaRepository settingsRepo,
                          SitemapTemplateJpaRepository templateRepo,
                          SitemapOverrideJpaRepository overrideRepo,
                          SitemapCustomUrlJpaRepository customUrlRepo,
                          SitemapUrlCheckJpaRepository urlCheckRepo,
                          PostJpaRepository postRepo,
                          ArticleJpaRepository articleRepo,
                          VideoJpaRepository videoRepo,
                          ApplicationJpaRepository applicationRepo,
                          ObjectMapper objectMapper) {
        this.settingsRepo = settingsRepo;
        this.templateRepo = templateRepo;
        this.overrideRepo = overrideRepo;
        this.customUrlRepo = customUrlRepo;
        this.urlCheckRepo = urlCheckRepo;
        this.postRepo = postRepo;
        this.articleRepo = articleRepo;
        this.videoRepo = videoRepo;
        this.applicationRepo = applicationRepo;
        this.objectMapper = objectMapper;
    }

    public SitemapSettingsResponse getSettings(String tenantId) {
        return toResponse(getOrCreateSettings(tenantId));
    }

    @Transactional
    public SitemapSettingsResponse updateSettings(String tenantId, SitemapSettingsRequest request) {
        SitemapSettingsEntity current = getOrCreateSettings(tenantId);
        String baseUrl = trimToNull(request.getBaseUrl());
        if (request.isEnabled()) {
            validateBaseUrl(baseUrl);
        }
        SitemapSettingsEntity updated = new SitemapSettingsEntity(
            current.getTenantId(),
            request.isEnabled(),
            baseUrl,
            trimToNull(request.getSitemapPath()) == null ? current.getSitemapPath() : request.getSitemapPath().trim(),
            request.getCacheTtlSeconds() == null ? current.getCacheTtlSeconds() : request.getCacheTtlSeconds(),
            normalizeRegenStrategy(request.getRegenStrategy(), current.getRegenStrategy()),
            current.getCreatedAt(),
            Instant.now()
        );
        settingsRepo.save(updated);
        invalidateTenantCache(tenantId);
        return toResponse(updated);
    }

    public List<SitemapTemplateResponse> listTemplates(String tenantId) {
        ensureDefaultTemplates(tenantId);
        return templateRepo.findByTenantIdOrderByContentTypeAsc(tenantId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SitemapTemplateResponse upsertTemplate(String tenantId, String contentTypeRaw, SitemapTemplateRequest request) {
        String contentType = normalizeContentType(contentTypeRaw);
        SitemapTemplateEntity current = templateRepo.findByTenantIdAndContentType(tenantId, contentType)
            .orElseGet(() -> new SitemapTemplateEntity(
                UUID.randomUUID().toString(), tenantId, contentType, false, null, "updatedAt", null, null, "OK", null, Instant.now(), Instant.now()
            ));
        String template = trimToNull(request.getTemplate());
        String lastmodPolicy = normalizeLastmodPolicy(request.getLastmodPolicy(), current.getLastmodPolicy());
        String changefreq = normalizeChangefreq(request.getDefaultChangefreq());
        Double priority = normalizePriority(request.getDefaultPriority());
        ValidationResult validation = validateTemplate(template, request.isEnabled());

        SitemapTemplateEntity updated = new SitemapTemplateEntity(
            current.getId(),
            current.getTenantId(),
            current.getContentType(),
            request.isEnabled(),
            template,
            lastmodPolicy,
            changefreq,
            priority,
            validation.status(),
            toJson(validation.errors()),
            current.getCreatedAt(),
            Instant.now()
        );
        templateRepo.save(updated);
        invalidateTenantCache(tenantId);
        return toResponse(updated);
    }

    public SitemapPreviewResponse preview(String tenantId, String contentType, int limit, int offset) {
        String normalized = trimToNull(contentType) == null ? null : normalizeContentType(contentType);
        Generation generated = generate(tenantId, normalized == null ? null : Set.of(normalized), false);
        List<SitemapPreviewItemResponse> items = generated.preview().stream()
            .skip(Math.max(0, offset))
            .limit(Math.max(1, limit))
            .toList();
        return new SitemapPreviewResponse(generated.preview().size(), items);
    }

    @Transactional
    public void upsertOverride(String tenantId, String contentTypeRaw, String contentId, SitemapOverrideRequest request) {
        String contentType = normalizeContentType(contentTypeRaw);
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        SitemapOverrideEntity current = overrideRepo.findByTenantIdAndContentTypeAndContentId(tenantId, contentType, contentId)
            .orElseGet(() -> new SitemapOverrideEntity(
                UUID.randomUUID().toString(), tenantId, contentType, contentId, null, false, null, null, Instant.now(), Instant.now()
            ));
        String customUrl = trimToNull(request.getCustomUrl());
        if (customUrl != null) {
            validateRelativeOrAbsolute(customUrl, settings.getBaseUrl());
        }
        String changefreq = normalizeChangefreq(request.getChangefreqOverride());
        Double priority = normalizePriority(request.getPriorityOverride());
        SitemapOverrideEntity updated = new SitemapOverrideEntity(
            current.getId(),
            current.getTenantId(),
            current.getContentType(),
            current.getContentId(),
            customUrl,
            request.getExcluded() != null ? request.getExcluded() : current.isExcluded(),
            priority,
            changefreq,
            current.getCreatedAt(),
            Instant.now()
        );
        overrideRepo.save(updated);
        invalidateTenantCache(tenantId);
    }

    public List<SitemapCustomUrlResponse> listCustomUrls(String tenantId) {
        return customUrlRepo.findByTenantIdOrderByCreatedAtDesc(tenantId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SitemapCustomUrlResponse createCustomUrl(String tenantId, SitemapCustomUrlRequest request) {
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        String pathOrUrl = requirePathOrUrl(request.getPathOrUrl());
        validateRelativeOrAbsolute(pathOrUrl, settings.getBaseUrl());
        SitemapCustomUrlEntity row = new SitemapCustomUrlEntity(
            UUID.randomUUID().toString(),
            tenantId,
            pathOrUrl,
            request.getEnabled() == null || request.getEnabled(),
            normalizeLastmodMode(request.getLastmodMode()),
            parseInstant(request.getLastmodValue()),
            normalizeChangefreq(request.getChangefreq()),
            normalizePriority(request.getPriority()),
            trimToNull(request.getNotes()),
            Instant.now(),
            Instant.now()
        );
        customUrlRepo.save(row);
        invalidateTenantCache(tenantId);
        return toResponse(row);
    }

    @Transactional
    public SitemapCustomUrlResponse updateCustomUrl(String tenantId, String id, SitemapCustomUrlRequest request) {
        SitemapCustomUrlEntity current = customUrlRepo.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Custom URL not found"));
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        String pathOrUrl = requirePathOrUrl(request.getPathOrUrl());
        validateRelativeOrAbsolute(pathOrUrl, settings.getBaseUrl());
        SitemapCustomUrlEntity updated = new SitemapCustomUrlEntity(
            current.getId(),
            current.getTenantId(),
            pathOrUrl,
            request.getEnabled() == null ? current.isEnabled() : request.getEnabled(),
            normalizeLastmodMode(request.getLastmodMode() == null ? current.getLastmodMode() : request.getLastmodMode()),
            parseInstant(request.getLastmodValue()),
            normalizeChangefreq(request.getChangefreq()),
            normalizePriority(request.getPriority()),
            trimToNull(request.getNotes()),
            current.getCreatedAt(),
            Instant.now()
        );
        customUrlRepo.save(updated);
        invalidateTenantCache(tenantId);
        return toResponse(updated);
    }

    @Transactional
    public void deleteCustomUrl(String tenantId, String id) {
        SitemapCustomUrlEntity row = customUrlRepo.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("Custom URL not found"));
        customUrlRepo.delete(row);
        invalidateTenantCache(tenantId);
    }

    @Transactional
    public SitemapTestUrlResponse testUrl(String tenantId, String url) {
        Integer status = null;
        String error = null;
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest head = HttpRequest.newBuilder(URI.create(url)).method("HEAD", HttpRequest.BodyPublishers.noBody()).build();
            HttpResponse<Void> response = client.send(head, HttpResponse.BodyHandlers.discarding());
            status = response.statusCode();
        } catch (Exception e) {
            error = e.getMessage();
        }
        urlCheckRepo.save(new SitemapUrlCheckEntity(
            UUID.randomUUID().toString(),
            tenantId,
            url,
            Instant.now(),
            status,
            error
        ));
        return new SitemapTestUrlResponse(status != null && status < 400, status, error);
    }

    public String getPublicSitemapXml(String tenantId, String type, Integer index) {
        CachedSitemap cached = cache.get(tenantId);
        if (cached == null || cached.expiresAt().isBefore(Instant.now())) {
            cached = buildCachedSitemap(tenantId);
            cache.put(tenantId, cached);
        }
        if (type != null && index != null) {
            String key = type + "-" + index;
            String chunk = cached.chunks().get(key);
            if (chunk == null) {
                throw new NotFoundException("Sitemap chunk not found");
            }
            return chunk;
        }
        return cached.indexXml() == null ? cached.chunks().get("all-1") : cached.indexXml();
    }

    public void invalidateTenantCache(String tenantId) {
        cache.remove(tenantId);
    }

    public void invalidateTenantCacheIfOnPublish(String tenantId) {
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        if ("on_publish".equalsIgnoreCase(settings.getRegenStrategy())) {
            invalidateTenantCache(tenantId);
        }
    }

    private CachedSitemap buildCachedSitemap(String tenantId) {
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        if (!settings.isEnabled()) {
            throw new NotFoundException("Sitemap is disabled");
        }
        String baseUrl = validateBaseUrl(settings.getBaseUrl());
        Generation generation = generate(tenantId, null, true);
        List<List<UrlEntry>> chunks = chunk(generation.urls(), 50000);
        Map<String, String> xmlByChunk = new HashMap<>();
        for (int i = 0; i < chunks.size(); i++) {
            xmlByChunk.put("all-" + (i + 1), renderUrlSet(chunks.get(i)));
        }
        String indexXml = null;
        if (chunks.size() > 1) {
            List<String> locs = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                locs.add(baseUrl + "/public/" + tenantId + "/sitemap-all-" + (i + 1) + ".xml");
            }
            indexXml = renderIndex(locs);
        }
        return new CachedSitemap(
            Instant.now().plusSeconds(Math.max(60, settings.getCacheTtlSeconds())),
            indexXml,
            xmlByChunk
        );
    }

    private Generation generate(String tenantId, Set<String> onlyTypes, boolean strict) {
        SitemapSettingsEntity settings = getOrCreateSettings(tenantId);
        if (!settings.isEnabled() && strict) {
            throw new BadRequestException("Sitemap is disabled for this tenant");
        }
        String baseUrl = trimToNull(settings.getBaseUrl());
        if (strict) {
            baseUrl = validateBaseUrl(baseUrl);
        } else if (baseUrl != null) {
            try {
                baseUrl = validateBaseUrl(baseUrl);
            } catch (Exception ignored) {
                baseUrl = null;
            }
        }
        if (!strict && (baseUrl == null || !settings.isEnabled())) {
            List<SitemapPreviewItemResponse> errors = List.of(new SitemapPreviewItemResponse(
                null, onlyTypes == null || onlyTypes.isEmpty() ? "all" : onlyTypes.iterator().next(), null, null, null, null,
                null, "template", "ERROR", List.of("Sitemap disabled or invalid baseUrl"), false
            ));
            return new Generation(errors, List.of());
        }

        ensureDefaultTemplates(tenantId);
        Map<String, SitemapTemplateEntity> templates = new HashMap<>();
        for (SitemapTemplateEntity t : templateRepo.findByTenantIdOrderByContentTypeAsc(tenantId)) {
            templates.put(t.getContentType(), t);
        }
        Map<String, SitemapOverrideEntity> overrides = new HashMap<>();
        for (SitemapOverrideEntity o : overrideRepo.findByTenantId(tenantId)) {
            overrides.put(o.getContentType() + ":" + o.getContentId(), o);
        }

        List<SitemapPreviewItemResponse> preview = new ArrayList<>();
        List<UrlEntry> entries = new ArrayList<>();

        Set<String> activeTypes = onlyTypes == null ? CONTENT_TYPES : onlyTypes;
        for (String type : activeTypes) {
            SitemapTemplateEntity template = templates.get(type);
            if (template == null || !template.isEnabled()) {
                continue;
            }
            ValidationResult templateValidation = validateTemplate(template.getTemplate(), template.isEnabled());
            if ("ERROR".equals(templateValidation.status())) {
                preview.add(new SitemapPreviewItemResponse(
                    null, type, null, null, null, null, null, "template", "ERROR", templateValidation.errors(), false
                ));
                continue;
            }
            for (ContentItem item : loadContent(tenantId, type)) {
                SitemapOverrideEntity override = overrides.get(type + ":" + item.id());
                if (override != null && override.isExcluded()) {
                    continue;
                }
                String source = override != null && trimToNull(override.getCustomUrl()) != null ? "override" : "template";
                String finalUrl;
                List<String> errors = new ArrayList<>();
                if (override != null && trimToNull(override.getCustomUrl()) != null) {
                    UrlResolution resolved = resolveUrl(baseUrl, override.getCustomUrl());
                    if (!resolved.ok()) {
                        errors.add(resolved.error());
                        finalUrl = null;
                    } else {
                        finalUrl = resolved.url();
                    }
                } else {
                    RenderResult rendered = renderPath(template.getTemplate(), item);
                    errors.addAll(rendered.errors());
                    finalUrl = rendered.path() == null ? null : baseUrl + rendered.path();
                }
                Double priority = override != null && override.getPriorityOverride() != null
                    ? override.getPriorityOverride()
                    : template.getDefaultPriority();
                String changefreq = override != null && trimToNull(override.getChangefreqOverride()) != null
                    ? override.getChangefreqOverride()
                    : template.getDefaultChangefreq();
                String lastmod = "publishedAt".equals(template.getLastmodPolicy())
                    ? toIso(item.publishedAt())
                    : toIso(item.updatedAt() == null ? item.publishedAt() : item.updatedAt());

                if (finalUrl == null || !errors.isEmpty()) {
                    preview.add(new SitemapPreviewItemResponse(
                        item.id(), type, item.title(), finalUrl, lastmod, priority, changefreq, source, "ERROR", errors, false
                    ));
                    continue;
                }
                preview.add(new SitemapPreviewItemResponse(
                    item.id(), type, item.title(), finalUrl, lastmod, priority, changefreq, source, "OK", List.of(), false
                ));
                entries.add(new UrlEntry(item.id(), type, item.title(), finalUrl, lastmod, priority, changefreq, source));
            }
        }

        if (onlyTypes == null) {
            for (SitemapCustomUrlEntity custom : customUrlRepo.findByTenantIdAndEnabledTrue(tenantId)) {
                UrlResolution resolved = resolveUrl(baseUrl, custom.getPathOrUrl());
                String status = resolved.ok() ? "OK" : "ERROR";
                List<String> errors = resolved.ok() ? List.of() : List.of(resolved.error());
                String lastmod = switch (normalizeLastmodMode(custom.getLastmodMode())) {
                    case "now" -> Instant.now().toString();
                    case "fixed_date" -> toIso(custom.getLastmodValue());
                    default -> null;
                };
                preview.add(new SitemapPreviewItemResponse(
                    custom.getId(), "manual", custom.getNotes(), resolved.url(), lastmod, custom.getPriority(), custom.getChangefreq(), "manual", status, errors, false
                ));
                if (resolved.ok()) {
                    entries.add(new UrlEntry(custom.getId(), "manual", custom.getNotes(), resolved.url(), lastmod, custom.getPriority(), custom.getChangefreq(), "manual"));
                }
            }
        }

        Deduped deduped = dedupe(preview, entries);
        return new Generation(deduped.preview(), deduped.urls());
    }

    private Deduped dedupe(List<SitemapPreviewItemResponse> preview, List<UrlEntry> urls) {
        Map<String, UrlEntry> best = new HashMap<>();
        Set<String> duplicates = new HashSet<>();
        for (UrlEntry url : urls) {
            UrlEntry current = best.get(url.finalUrl());
            if (current == null || sourceRank(url.source()) > sourceRank(current.source())) {
                if (current != null) {
                    duplicates.add(current.finalUrl());
                }
                best.put(url.finalUrl(), url);
            } else {
                duplicates.add(url.finalUrl());
            }
        }
        List<SitemapPreviewItemResponse> updatedPreview = preview.stream()
            .map(item -> new SitemapPreviewItemResponse(
                item.contentId(), item.contentType(), item.title(), item.finalUrl(), item.lastmod(), item.priority(),
                item.changefreq(), item.source(), item.status(), item.errors(), item.finalUrl() != null && duplicates.contains(item.finalUrl())
            ))
            .toList();
        return new Deduped(updatedPreview, best.values().stream().sorted(Comparator.comparing(UrlEntry::finalUrl)).toList());
    }

    private int sourceRank(String source) {
        return switch (source) {
            case "override" -> 3;
            case "template" -> 2;
            default -> 1;
        };
    }

    private List<ContentItem> loadContent(String tenantId, String type) {
        return switch (type) {
            case "article" -> articleRepo.findByApplicationIdAndStatus(tenantId, ContentStatus.PUBLISHED).stream()
                .map(a -> new ContentItem(a.getId(), a.getTitle(), a.getSlug(), a.getLocale(), null, a.getPublishedAt(), a.getUpdatedAt()))
                .toList();
            case "post" -> postRepo.findByApplicationIdAndStatus(tenantId, ContentStatus.PUBLISHED).stream()
                .map(p -> new ContentItem(p.getId(), p.getTitle(), p.getSlug(), p.getLocale(), null, p.getPublishedAt(), p.getUpdatedAt()))
                .toList();
            case "video" -> videoRepo.findByApplicationIdAndStatusAndDeletedAtIsNull(tenantId, ContentStatus.PUBLISHED).stream()
                .map(v -> new ContentItem(v.getId(), v.getTitle(), null, v.getLocale(), null, v.getPublishedAt(), v.getUpdatedAt()))
                .toList();
            case "gallery" -> applicationRepo.findById(tenantId)
                .map(ApplicationEntity::getGallery)
                .orElse(List.of())
                .stream()
                .map(this::toContentItem)
                .toList();
            default -> List.of();
        };
    }

    private ContentItem toContentItem(GalleryImage image) {
        return new ContentItem(
            UUID.randomUUID().toString(),
            image.caption(),
            null,
            null,
            null,
            null,
            Instant.now()
        );
    }

    private RenderResult renderPath(String template, ContentItem item) {
        if (trimToNull(template) == null) {
            return new RenderResult(null, List.of("Template is required when enabled"));
        }
        if (!template.startsWith("/")) {
            return new RenderResult(null, List.of("Template must start with /"));
        }
        List<String> errors = new ArrayList<>();
        Matcher matcher = TOKEN.matcher(template);
        String path = template;
        while (matcher.find()) {
            String token = matcher.group(1);
            if (!PLACEHOLDERS.contains(token)) {
                errors.add("Unsupported placeholder {" + token + "}");
                continue;
            }
            String value = resolveToken(token, item);
            if (trimToNull(value) == null) {
                errors.add("Missing value for placeholder {" + token + "} on content " + item.id());
                continue;
            }
            path = path.replace("{" + token + "}", encodePath(value));
        }
        return errors.isEmpty() ? new RenderResult(path, List.of()) : new RenderResult(null, errors);
    }

    private String resolveToken(String token, ContentItem item) {
        return switch (token) {
            case "slug" -> item.slug();
            case "id" -> item.id();
            case "lang" -> item.lang();
            case "categorySlug" -> item.categorySlug();
            case "publishedYear" -> item.publishedAt() == null ? null : String.valueOf(item.publishedAt().atZone(java.time.ZoneOffset.UTC).getYear());
            case "publishedMonth" -> item.publishedAt() == null ? null : String.format("%02d", item.publishedAt().atZone(java.time.ZoneOffset.UTC).getMonthValue());
            case "publishedDay" -> item.publishedAt() == null ? null : String.format("%02d", item.publishedAt().atZone(java.time.ZoneOffset.UTC).getDayOfMonth());
            default -> null;
        };
    }

    private ValidationResult validateTemplate(String template, boolean enabled) {
        if (!enabled) {
            return new ValidationResult("OK", List.of());
        }
        if (trimToNull(template) == null) {
            return new ValidationResult("ERROR", List.of("Template is required when enabled"));
        }
        List<String> errors = new ArrayList<>();
        if (!template.startsWith("/")) {
            errors.add("Template must start with /");
        }
        Matcher matcher = TOKEN.matcher(template);
        while (matcher.find()) {
            String token = matcher.group(1);
            if (!PLACEHOLDERS.contains(token)) {
                errors.add("Invalid placeholder {" + token + "}");
            }
        }
        return new ValidationResult(errors.isEmpty() ? "OK" : "ERROR", errors);
    }

    private UrlResolution resolveUrl(String baseUrl, String raw) {
        String value = trimToNull(raw);
        if (value == null) {
            return new UrlResolution(false, null, "URL is required");
        }
        if (value.startsWith("/")) {
            return new UrlResolution(true, baseUrl + value, null);
        }
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                return new UrlResolution(false, null, "URL must use https");
            }
            URI base = URI.create(baseUrl);
            if (!Objects.equals(uri.getHost(), base.getHost())) {
                return new UrlResolution(false, null, "Absolute URL host must match baseUrl host");
            }
            return new UrlResolution(true, uri.toString(), null);
        } catch (Exception e) {
            return new UrlResolution(false, null, "Invalid URL");
        }
    }

    private String validateBaseUrl(String raw) {
        String value = trimToNull(raw);
        if (value == null) {
            throw new BadRequestException("baseUrl is required when sitemap is enabled");
        }
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                throw new BadRequestException("baseUrl must use https");
            }
            if (trimToNull(uri.getPath()) != null && !"/".equals(uri.getPath())) {
                throw new BadRequestException("baseUrl must not include path");
            }
            if (trimToNull(uri.getQuery()) != null || trimToNull(uri.getFragment()) != null) {
                throw new BadRequestException("baseUrl must not include query/hash");
            }
            return uri.getScheme().toLowerCase(Locale.ROOT) + "://" + uri.getAuthority();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid baseUrl format");
        }
    }

    private void validateRelativeOrAbsolute(String value, String baseUrl) {
        if (value.startsWith("/")) {
            return;
        }
        String normalizedBase = validateBaseUrl(baseUrl);
        UrlResolution resolved = resolveUrl(normalizedBase, value);
        if (!resolved.ok()) {
            throw new BadRequestException(resolved.error());
        }
    }

    private String normalizeRegenStrategy(String value, String fallback) {
        String normalized = trimToNull(value) == null ? fallback : value.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("on_publish", "scheduled", "manual").contains(normalized)) {
            throw new BadRequestException("Invalid regenStrategy");
        }
        return normalized;
    }

    private String normalizeLastmodPolicy(String value, String fallback) {
        String normalized = trimToNull(value) == null ? fallback : value.trim();
        if (!Set.of("updatedAt", "publishedAt").contains(normalized)) {
            throw new BadRequestException("Invalid lastmodPolicy");
        }
        return normalized;
    }

    private String normalizeChangefreq(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!CHANGEFREQ.contains(normalized)) {
            throw new BadRequestException("Invalid changefreq");
        }
        return normalized;
    }

    private String normalizeLastmodMode(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return "none";
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!Set.of("now", "fixed_date", "none").contains(normalized)) {
            throw new BadRequestException("Invalid lastmodMode");
        }
        return normalized;
    }

    private String normalizeContentType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new BadRequestException("contentType is required");
        }
        normalized = normalized.toLowerCase(Locale.ROOT);
        if (!CONTENT_TYPES.contains(normalized)) {
            throw new BadRequestException("Unsupported contentType: " + value);
        }
        return normalized;
    }

    private Double normalizePriority(Double value) {
        if (value == null) {
            return null;
        }
        if (value < 0 || value > 1) {
            throw new BadRequestException("priority must be between 0 and 1");
        }
        return value;
    }

    private String requirePathOrUrl(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new BadRequestException("pathOrUrl is required");
        }
        return trimmed;
    }

    private Instant parseInstant(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        return Instant.parse(trimmed);
    }

    private void ensureDefaultTemplates(String tenantId) {
        List<SitemapTemplateEntity> existing = templateRepo.findByTenantIdOrderByContentTypeAsc(tenantId);
        Set<String> seen = new HashSet<>(existing.stream().map(SitemapTemplateEntity::getContentType).toList());
        List<SitemapTemplateEntity> toCreate = new ArrayList<>();
        for (String type : CONTENT_TYPES) {
            if (seen.contains(type)) {
                continue;
            }
            String template = defaultTemplate(type);
            ValidationResult validation = validateTemplate(template, template != null);
            toCreate.add(new SitemapTemplateEntity(
                UUID.randomUUID().toString(),
                tenantId,
                type,
                template != null,
                template,
                "updatedAt",
                null,
                null,
                validation.status(),
                toJson(validation.errors()),
                Instant.now(),
                Instant.now()
            ));
        }
        if (!toCreate.isEmpty()) {
            templateRepo.saveAll(toCreate);
        }
    }

    private String defaultTemplate(String type) {
        return switch (type) {
            case "article" -> "/articles/{slug}";
            case "post" -> "/posts/{slug}";
            case "video" -> "/videos/{id}";
            case "photo" -> "/photos/{id}";
            case "gallery" -> "/collections/{id}";
            default -> null;
        };
    }

    private SitemapSettingsEntity getOrCreateSettings(String tenantId) {
        return settingsRepo.findById(tenantId).orElseGet(() -> settingsRepo.save(new SitemapSettingsEntity(
            tenantId,
            false,
            null,
            "/sitemap.xml",
            3600,
            "on_publish",
            Instant.now(),
            Instant.now()
        )));
    }

    private String renderUrlSet(List<UrlEntry> entries) {
        StringBuilder builder = new StringBuilder();
        builder.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        builder.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (UrlEntry entry : entries) {
            builder.append("  <url>\n");
            builder.append("    <loc>").append(escapeXml(entry.finalUrl())).append("</loc>\n");
            if (entry.lastmod() != null) builder.append("    <lastmod>").append(escapeXml(entry.lastmod())).append("</lastmod>\n");
            if (entry.changefreq() != null) builder.append("    <changefreq>").append(entry.changefreq()).append("</changefreq>\n");
            if (entry.priority() != null) builder.append("    <priority>").append(String.format(Locale.ROOT, "%.1f", entry.priority())).append("</priority>\n");
            builder.append("  </url>\n");
        }
        builder.append("</urlset>");
        return builder.toString();
    }

    private String renderIndex(List<String> locs) {
        StringBuilder builder = new StringBuilder();
        builder.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        builder.append("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (String loc : locs) {
            builder.append("  <sitemap>\n");
            builder.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
            builder.append("    <lastmod>").append(Instant.now()).append("</lastmod>\n");
            builder.append("  </sitemap>\n");
        }
        builder.append("</sitemapindex>");
        return builder.toString();
    }

    private List<List<UrlEntry>> chunk(List<UrlEntry> input, int size) {
        if (input.isEmpty()) {
            return List.of(List.of());
        }
        List<List<UrlEntry>> out = new ArrayList<>();
        for (int i = 0; i < input.size(); i += size) {
            out.add(input.subList(i, Math.min(input.size(), i + size)));
        }
        return out;
    }

    private String escapeXml(String value) {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    private String encodePath(String value) {
        return value.trim().replace(" ", "-");
    }

    private String toJson(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toIso(Instant instant) {
        return instant == null ? null : instant.toString();
    }

    private SitemapSettingsResponse toResponse(SitemapSettingsEntity entity) {
        return new SitemapSettingsResponse(
            entity.getTenantId(),
            entity.isEnabled(),
            entity.getBaseUrl(),
            entity.getSitemapPath(),
            entity.getCacheTtlSeconds(),
            entity.getRegenStrategy(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt().toString()
        );
    }

    private SitemapTemplateResponse toResponse(SitemapTemplateEntity entity) {
        return new SitemapTemplateResponse(
            entity.getId(),
            entity.getTenantId(),
            entity.getContentType(),
            entity.isEnabled(),
            entity.getTemplate(),
            entity.getLastmodPolicy(),
            entity.getDefaultChangefreq(),
            entity.getDefaultPriority(),
            entity.getValidateStatus(),
            entity.getValidateErrors(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt().toString()
        );
    }

    private SitemapCustomUrlResponse toResponse(SitemapCustomUrlEntity entity) {
        return new SitemapCustomUrlResponse(
            entity.getId(),
            entity.getTenantId(),
            entity.getPathOrUrl(),
            entity.isEnabled(),
            entity.getLastmodMode(),
            toIso(entity.getLastmodValue()),
            entity.getChangefreq(),
            entity.getPriority(),
            entity.getNotes(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt().toString()
        );
    }

    private record ContentItem(
        String id,
        String title,
        String slug,
        String lang,
        String categorySlug,
        Instant publishedAt,
        Instant updatedAt
    ) {
    }

    private record UrlEntry(
        String contentId,
        String contentType,
        String title,
        String finalUrl,
        String lastmod,
        Double priority,
        String changefreq,
        String source
    ) {
    }

    private record RenderResult(String path, List<String> errors) {
    }

    private record ValidationResult(String status, List<String> errors) {
    }

    private record UrlResolution(boolean ok, String url, String error) {
    }

    private record Deduped(List<SitemapPreviewItemResponse> preview, List<UrlEntry> urls) {
    }

    private record Generation(List<SitemapPreviewItemResponse> preview, List<UrlEntry> urls) {
    }

    private record CachedSitemap(Instant expiresAt, String indexXml, Map<String, String> chunks) {
    }
}
