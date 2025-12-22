package com.contentplatform.backend.infrastructure.config;

import com.contentplatform.backend.application.port.out.TimeProvider;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SystemTimeProvider implements TimeProvider {
    @Override
    public Instant now() {
        return Instant.now();
    }
}
