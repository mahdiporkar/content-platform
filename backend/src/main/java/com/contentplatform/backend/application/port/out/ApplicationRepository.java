package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.Application;

import java.util.Optional;

public interface ApplicationRepository {
    Optional<Application> findById(String id);
    Optional<Application> findFirst();
    Application save(Application application);
    boolean existsById(String id);
    long count();
}
