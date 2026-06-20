package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.infrastructure.jpa.entity.TenantRouteEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.TenantRouteJpaRepository;
import com.contentplatform.backend.domain.value.TenantRouteStatus;
import com.contentplatform.backend.interfaces.web.request.TenantRouteDefinitionRequest;
import com.contentplatform.backend.interfaces.web.request.TenantRouteSyncRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class TenantRouteService {
    private final TenantRouteJpaRepository routeRepo;
    private final ApplicationJpaRepository applicationRepo;
    public TenantRouteService(TenantRouteJpaRepository routeRepo, ApplicationJpaRepository applicationRepo) {
        this.routeRepo = routeRepo; this.applicationRepo = applicationRepo;
    }

    @Transactional
    public Map<String, Object> sync(String applicationId, TenantRouteSyncRequest request) {
        if (!applicationRepo.existsById(applicationId)) throw new BadRequestException("Application not found.");
        String source = required(request.getSource(), "source is required");
        Instant now = Instant.now();
        List<TenantRouteEntity> existing = routeRepo.findByApplicationIdAndSource(applicationId, source);
        Map<String, TenantRouteEntity> byKey = new HashMap<>();
        existing.forEach(route -> byKey.put(route.getRouteKey(), route));
        Set<String> keys = new HashSet<>();
        for (TenantRouteDefinitionRequest definition : request.getRoutes()) {
            String key = required(definition.getKey(), "route key is required");
            String path = required(definition.getPath(), "route path is required");
            if (!keys.add(key)) throw new BadRequestException("Route keys must be unique.");
            if (!path.startsWith("/")) throw new BadRequestException("Route path must start with '/'.");
            Map<String, String> titles = new HashMap<>();
            definition.getTitles().forEach((locale, title) -> {
                if (locale != null && title != null && !locale.isBlank() && !title.isBlank()) titles.put(locale.trim(), title.trim());
            });
            if (titles.isEmpty()) throw new BadRequestException("At least one localized title is required.");
            TenantRouteEntity route = byKey.get(key);
            if (route == null) {
                route = new TenantRouteEntity(UUID.randomUUID().toString(), applicationId, source, key, path, titles,
                    TenantRouteStatus.AVAILABLE, trim(definition.getIcon()), trim(definition.getCssClass()),
                    definition.getMetadata(), now, now, now);
            } else {
                route.synchronize(path, titles, trim(definition.getIcon()), trim(definition.getCssClass()), definition.getMetadata(), now);
            }
            routeRepo.save(route);
        }
        int unavailable = 0;
        if (!Boolean.FALSE.equals(request.getReplaceMissing())) {
            for (TenantRouteEntity route : existing) {
                if (!keys.contains(route.getRouteKey())) { route.markUnavailable(now); routeRepo.save(route); unavailable++; }
            }
        }
        return Map.of("applicationId", applicationId, "source", source, "synchronized", keys.size(),
            "unavailable", unavailable, "synchronizedAt", now.toString());
    }

    public List<TenantRouteEntity> list(String applicationId) {
        if (!applicationRepo.existsById(applicationId)) throw new BadRequestException("Application not found.");
        return routeRepo.findByApplicationIdAndStatusOrderBySourceAscRouteKeyAsc(applicationId, TenantRouteStatus.AVAILABLE);
    }
    private String required(String value, String message) { String result = trim(value); if (result == null) throw new BadRequestException(message); return result; }
    private String trim(String value) { if (value == null || value.trim().isEmpty()) return null; return value.trim(); }
}
