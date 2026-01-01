package com.contentplatform.backend.infrastructure.seed;

import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.domain.model.Application;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class SeedDataRunner implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(SeedDataRunner.class);

    private final ApplicationRepository applicationRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public SeedDataRunner(ApplicationRepository applicationRepository,
                          AdminUserRepository adminUserRepository,
                          PasswordEncoder passwordEncoder) {
        this.applicationRepository = applicationRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String applicationId = ensureApplication();
        if (applicationId != null) {
            ensureAdminUser(applicationId);
        }
    }

    private String ensureApplication() {
        if (applicationRepository.count() > 0) {
            String existingId = applicationRepository.findFirst()
                .map(Application::getId)
                .orElse(null);
            if (existingId != null) {
                logger.info("Existing applicationId: {}", existingId);
            }
            return existingId;
        }
        String applicationId = UUID.randomUUID().toString();
        Application app = new Application(applicationId, "Demo Application", null);
        applicationRepository.save(app);
        logger.info("Seeded applicationId: {}", applicationId);
        return applicationId;
    }

    private void ensureAdminUser(String applicationId) {
        adminUserRepository.findByEmail("admin@example.com").ifPresentOrElse(
            user -> logger.info("Admin user already exists"),
            () -> {
                String passwordHash = passwordEncoder.encode("Admin123!");
                AdminUser admin = new AdminUser(UUID.randomUUID().toString(), "admin@example.com", passwordHash, List.of(applicationId));
                adminUserRepository.save(admin);
                logger.info("Seeded admin user: admin@example.com / Admin123!");
            }
        );
    }
}
