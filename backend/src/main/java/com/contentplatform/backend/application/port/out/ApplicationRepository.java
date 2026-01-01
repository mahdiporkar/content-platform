package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.Application;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository {
    Optional<Application> findById(String id);
    Optional<Application> findFirst();
    List<Application> findAll();
    Application save(Application application);
    void deleteById(String id);
    boolean existsById(String id);
    long count();
}
