package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.dto.ApplicationDto;
import com.contentplatform.backend.application.dto.CreateApplicationCommand;
import com.contentplatform.backend.application.dto.UpdateApplicationCommand;
import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.application.port.in.ApplicationUseCase;
import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.Application;
import org.springframework.stereotype.Service;

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
        Application application = new Application(
            resolvedId,
            command.getName().trim(),
            normalizeWebsite(command.getWebsiteUrl())
        );
        return toDto(applicationRepository.save(application));
    }

    @Override
    public ApplicationDto update(UpdateApplicationCommand command) {
        Application existing = applicationRepository.findById(command.getId())
            .orElseThrow(() -> new NotFoundException("Application not found"));
        Application updated = new Application(
            existing.getId(),
            command.getName().trim(),
            normalizeWebsite(command.getWebsiteUrl())
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

    private ApplicationDto toDto(Application application) {
        return new ApplicationDto(application.getId(), application.getName(), application.getWebsiteUrl());
    }

    private String normalizeWebsite(String websiteUrl) {
        if (websiteUrl == null) {
            return null;
        }
        String trimmed = websiteUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
