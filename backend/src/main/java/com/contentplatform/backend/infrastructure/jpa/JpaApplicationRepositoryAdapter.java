package com.contentplatform.backend.infrastructure.jpa;

import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.Application;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaApplicationRepositoryAdapter implements ApplicationRepository {
    private final ApplicationJpaRepository repository;

    public JpaApplicationRepositoryAdapter(ApplicationJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Application> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Application> findFirst() {
        ApplicationEntity entity = repository.findFirstByOrderByIdAsc();
        return entity == null ? Optional.empty() : Optional.of(toDomain(entity));
    }

    @Override
    public List<Application> findAll() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "name"))
            .stream()
            .map(this::toDomain)
            .toList();
    }

    @Override
    public Application save(Application application) {
        ApplicationEntity entity = new ApplicationEntity(
            application.getId(),
            application.getName(),
            application.getWebsiteUrl()
        );
        return toDomain(repository.save(entity));
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public boolean existsById(String id) {
        return repository.existsById(id);
    }

    @Override
    public long count() {
        return repository.count();
    }

    private Application toDomain(ApplicationEntity entity) {
        return new Application(entity.getId(), entity.getName(), entity.getWebsiteUrl());
    }
}
