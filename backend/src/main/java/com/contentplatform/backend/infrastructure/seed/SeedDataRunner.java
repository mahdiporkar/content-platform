package com.contentplatform.backend.infrastructure.seed;

import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.domain.model.Application;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
        if (applicationId != null) ensureAdminUser(applicationId);
    }

    private String ensureApplication() {
        if (applicationRepository.count() > 0) {
            String existingId = applicationRepository.findFirst().map(Application::getId).orElse(null);
            if (existingId != null) logger.info("Existing applicationId: {}", existingId);
            return existingId;
        }
        String applicationId = UUID.randomUUID().toString();
        applicationRepository.save(new Application(applicationId, "Demo Application", null, null, List.of()));
        logger.info("Seeded applicationId: {}", applicationId);
        return applicationId;
    }

    private void ensureAdminUser(String applicationId) {
        adminUserRepository.findByEmail("admin@example.com").ifPresentOrElse(
            user -> {
                List<ServicePermission> servicePermissions = new ArrayList<>(user.getServicePermissions());
                boolean changed = false;
                for (ServicePermission permission : ServicePermission.values()) {
                    if (!servicePermissions.contains(permission)) {
                        servicePermissions.add(permission);
                        changed = true;
                    }
                }
                List<String> applicationIds = new ArrayList<>(user.getAllowedApplicationIds());
                if (!applicationIds.contains(applicationId)) {
                    applicationIds.add(applicationId);
                    changed = true;
                }
                if (changed) {
                    adminUserRepository.save(new AdminUser(
                        user.getId(), user.getEmail(), user.getPasswordHash(), applicationIds,
                        user.getSystemPermissions(), servicePermissions
                    ));
                }
            },
            () -> adminUserRepository.save(new AdminUser(
                UUID.randomUUID().toString(),
                "admin@example.com",
                passwordEncoder.encode("Admin123!"),
                List.of(applicationId),
                List.of(SystemPermission.APPLICATIONS_MANAGE, SystemPermission.USERS_MANAGE),
                List.of(ServicePermission.values())
            ))
        );
    }
}
