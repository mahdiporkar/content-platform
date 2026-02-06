package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.ApplicationDto;
import com.contentplatform.backend.application.dto.CreateApplicationCommand;
import com.contentplatform.backend.application.dto.GalleryImageDto;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UpdateApplicationCommand;
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.ApplicationUseCase;
import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.Application;
import com.contentplatform.backend.domain.value.GalleryImage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService implements ApplicationUseCase {
    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    public List<ApplicationDto> list() {
        return applicationRepository.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    @Override
    public ApplicationDto getById(String id) {
        Application application = applicationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Application not found"));
        return toDto(application);
    }

    @Override
    public ApplicationDto create(CreateApplicationCommand command) {
        String id = command.getId();
        if (id != null && applicationRepository.existsById(id)) {
            throw new BadRequestException("Application id already exists");
        }
        String resolvedId = (id == null || id.isBlank()) ? UUID.randomUUID().toString() : id.trim();
        String apiToken = normalizeToken(command.getApiToken());
        if (apiToken == null) {
            apiToken = generateToken();
        }
        Application application = new Application(
            resolvedId,
            command.getName().trim(),
            normalizeWebsite(command.getWebsiteUrl()),
            apiToken,
            normalizeGallery(command.getGallery())
        );
        return toDto(applicationRepository.save(application));
    }

    @Override
    public ApplicationDto update(UpdateApplicationCommand command) {
        Application existing = applicationRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Application not found"));
        String apiToken = normalizeToken(command.getApiToken());
        if (apiToken == null) {
            apiToken = existing.getApiToken();
        }
        if (apiToken == null) {
            apiToken = generateToken();
        }
        Application updated = new Application(
            existing.getId(),
            command.getName().trim(),
            normalizeWebsite(command.getWebsiteUrl()),
            apiToken,
            normalizeGallery(command.getGallery())
        );
        return toDto(applicationRepository.save(updated));
    }

    @Override
    public void delete(String id) {
        if (!applicationRepository.existsById(id)) {
            throw new NotFoundException("Application not found");
        }
        applicationRepository.deleteById(id);
    }

    @Override
    public PageResult<GalleryImageDto> listGallery(String applicationId, PageRequest pageRequest) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new NotFoundException("Application not found"));
        List<GalleryImageDto> items = application.getGallery().stream()
            .filter(item -> item.getUrl() != null && !item.getUrl().isBlank())
            .map(item -> new GalleryImageDto(item.getUrl(), item.getAlt(), item.getCaption()))
            .toList();
        int page = Math.max(0, pageRequest.getPage());
        int size = Math.max(1, pageRequest.getSize());
        int start = page * size;
        int end = Math.min(items.size(), start + size);
        List<GalleryImageDto> slice = start >= items.size() ? List.of() : items.subList(start, end);
        int totalPages = (int) Math.ceil(items.size() / (double) size);
        return new PageResult<>(slice, items.size(), totalPages, page, size);
    }

    @Override
    public GalleryImageDto getGalleryItem(String applicationId, int index) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new NotFoundException("Application not found"));
        List<GalleryImage> gallery = application.getGallery().stream()
            .filter(item -> item.getUrl() != null && !item.getUrl().isBlank())
            .toList();
        if (index < 0 || index >= gallery.size()) {
            throw new NotFoundException("Gallery item not found");
        }
        GalleryImage item = gallery.get(index);
        return new GalleryImageDto(item.getUrl(), item.getAlt(), item.getCaption());
    }

    private ApplicationDto toDto(Application application) {
        List<GalleryImageDto> gallery = application.getGallery().stream()
            .map(item -> new GalleryImageDto(item.getUrl(), item.getAlt(), item.getCaption()))
            .toList();
        return new ApplicationDto(
            application.getId(),
            application.getName(),
            application.getWebsiteUrl(),
            application.getApiToken(),
            gallery
        );
    }

    private String normalizeWebsite(String websiteUrl) {
        if (websiteUrl == null) {
            return null;
        }
        String trimmed = websiteUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeToken(String token) {
        if (token == null) {
            return null;
        }
        String trimmed = token.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<GalleryImage> normalizeGallery(List<GalleryImageDto> gallery) {
        if (gallery == null) {
            return List.of();
        }
        List<GalleryImage> normalized = new ArrayList<>();
        for (GalleryImageDto item : gallery) {
            if (item == null || item.getUrl() == null || item.getUrl().isBlank()) {
                continue;
            }
            normalized.add(new GalleryImage(item.getUrl().trim(), item.getAlt(), item.getCaption()));
        }
        return normalized;
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
