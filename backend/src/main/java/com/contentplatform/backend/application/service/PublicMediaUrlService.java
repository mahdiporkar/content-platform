package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.port.out.ApplicationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PublicMediaUrlService {
    private static final Pattern HTML_LINK_PATTERN = Pattern.compile("(?i)(src|href)=(['\"])([^'\"]+)\\2");

    private final ApplicationRepository applicationRepository;
    private final String contentPlatformBaseUrl;
    private final String minioPublicBaseUrl;

    public PublicMediaUrlService(ApplicationRepository applicationRepository,
                                 @Value("${app.delivery.content-platform-base-url:http://localhost:3000}") String contentPlatformBaseUrl,
                                 @Value("${app.delivery.minio-public-base-url:http://localhost:9000}") String minioPublicBaseUrl) {
        this.applicationRepository = applicationRepository;
        this.contentPlatformBaseUrl = normalizeBase(contentPlatformBaseUrl, "http://localhost:3000");
        this.minioPublicBaseUrl = normalizeBase(minioPublicBaseUrl, "http://localhost:9000");
    }

    public String getPublicBaseUrl(String applicationId) {
        return applicationRepository.findById(applicationId)
            .map(application -> application.getWebsiteUrl())
            .filter(url -> url != null && !url.isBlank())
            .map(this::normalizeBase)
            .orElse(contentPlatformBaseUrl);
    }

    public String toPublicMediaUrl(String applicationId, String inputUrlOrPath) {
        String mediaPath = extractMediaPath(inputUrlOrPath);
        if (mediaPath == null) {
            return null;
        }
        return getPublicBaseUrl(applicationId) + mediaPath;
    }

    public String rewriteHtmlMediaUrls(String applicationId, String html) {
        if (html == null || html.isBlank()) {
            return html;
        }
        Matcher matcher = HTML_LINK_PATTERN.matcher(html);
        StringBuffer rewritten = new StringBuffer();
        while (matcher.find()) {
            String replacementUrl = toPublicMediaUrl(applicationId, matcher.group(3));
            if (replacementUrl == null) {
                matcher.appendReplacement(rewritten, Matcher.quoteReplacement(matcher.group(0)));
                continue;
            }
            String replacement = matcher.group(1) + "=" + matcher.group(2) + replacementUrl + matcher.group(2);
            matcher.appendReplacement(rewritten, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(rewritten);
        return rewritten.toString();
    }

    private String extractMediaPath(String inputUrlOrPath) {
        if (inputUrlOrPath == null) {
            return null;
        }
        String trimmed = inputUrlOrPath.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.startsWith("/media/")) {
            return trimmed;
        }
        if (trimmed.startsWith("media/")) {
            return "/" + trimmed;
        }
        if (trimmed.startsWith(minioPublicBaseUrl + "/media/")) {
            return trimmed.substring(minioPublicBaseUrl.length());
        }
        if (trimmed.startsWith(contentPlatformBaseUrl + "/media/")) {
            return trimmed.substring(contentPlatformBaseUrl.length());
        }
        try {
            URI uri = URI.create(trimmed);
            String path = uri.getPath();
            if (path != null) {
                int mediaIndex = path.indexOf("/media/");
                if (mediaIndex >= 0) {
                    return appendQueryAndFragment(path.substring(mediaIndex), uri.getQuery(), uri.getFragment());
                }
            }
        } catch (IllegalArgumentException ignored) {
            // Fall back to raw string matching for legacy malformed values.
        }
        int mediaIndex = trimmed.indexOf("/media/");
        if (mediaIndex >= 0) {
            return trimmed.substring(mediaIndex);
        }
        return null;
    }

    private String appendQueryAndFragment(String path, String query, String fragment) {
        StringBuilder builder = new StringBuilder(path);
        if (query != null && !query.isBlank()) {
            builder.append('?').append(query);
        }
        if (fragment != null && !fragment.isBlank()) {
            builder.append('#').append(fragment);
        }
        return builder.toString();
    }

    private String normalizeBase(String baseUrl) {
        return normalizeBase(baseUrl, "http://localhost:3000");
    }

    private String normalizeBase(String baseUrl, String fallback) {
        String trimmed = (baseUrl == null || baseUrl.isBlank()) ? fallback : baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
