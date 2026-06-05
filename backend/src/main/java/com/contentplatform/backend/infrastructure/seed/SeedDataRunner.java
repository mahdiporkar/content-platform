package com.contentplatform.backend.infrastructure.seed;

import com.contentplatform.backend.application.port.out.AdminUserRepository;
import com.contentplatform.backend.application.port.out.ApplicationRepository;
import com.contentplatform.backend.domain.model.AdminUser;
import com.contentplatform.backend.domain.model.Application;
import com.contentplatform.backend.domain.value.MenuItemTarget;
import com.contentplatform.backend.domain.value.MenuItemType;
import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MenuEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MenuItemEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MenuItemJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MenuJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
public class SeedDataRunner implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(SeedDataRunner.class);

    private final ApplicationRepository applicationRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationJpaRepository applicationJpaRepository;
    private final MenuJpaRepository menuJpaRepository;
    private final MenuItemJpaRepository menuItemJpaRepository;

    public SeedDataRunner(ApplicationRepository applicationRepository,
                          AdminUserRepository adminUserRepository,
                          PasswordEncoder passwordEncoder,
                          ApplicationJpaRepository applicationJpaRepository,
                          MenuJpaRepository menuJpaRepository,
                          MenuItemJpaRepository menuItemJpaRepository) {
        this.applicationRepository = applicationRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationJpaRepository = applicationJpaRepository;
        this.menuJpaRepository = menuJpaRepository;
        this.menuItemJpaRepository = menuItemJpaRepository;
    }

    @Override
    public void run(String... args) {
        String applicationId = ensureApplication();
        if (applicationId != null) {
            ensureAdminUser(applicationId);
            ensurePersonalBrandingMenus();
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
        Application app = new Application(applicationId, "Demo Application", null, null, List.of());
        applicationRepository.save(app);
        logger.info("Seeded applicationId: {}", applicationId);
        return applicationId;
    }

    private void ensureAdminUser(String applicationId) {
        adminUserRepository.findByEmail("admin@example.com").ifPresentOrElse(
            user -> {
                List<ServicePermission> required = List.of(
                    ServicePermission.POSTS_MANAGE,
                    ServicePermission.ARTICLES_MANAGE,
                    ServicePermission.VIDEOS_MANAGE,
                    ServicePermission.MEDIA_MANAGE,
                    ServicePermission.PAGES_MANAGE,
                    ServicePermission.MENUS_MANAGE,
                    ServicePermission.COLLECTIONS_MANAGE,
                    ServicePermission.GALLERIES_MANAGE,
                    ServicePermission.IMAGES_MANAGE,
                    ServicePermission.ANALYTICS_VIEW
                );
                List<ServicePermission> servicePermissions = new ArrayList<>(user.getServicePermissions());
                boolean changed = false;
                for (ServicePermission permission : required) {
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
                        user.getId(),
                        user.getEmail(),
                        user.getPasswordHash(),
                        applicationIds,
                        user.getSystemPermissions(),
                        servicePermissions
                    ));
                    logger.info("Updated admin user permissions");
                } else {
                    logger.info("Admin user already exists");
                }
            },
            () -> {
                String passwordHash = passwordEncoder.encode("Admin123!");
                AdminUser admin = new AdminUser(
                    UUID.randomUUID().toString(),
                    "admin@example.com",
                    passwordHash,
                    List.of(applicationId),
                    List.of(SystemPermission.APPLICATIONS_MANAGE, SystemPermission.USERS_MANAGE),
                    List.of(
                        ServicePermission.POSTS_MANAGE,
                        ServicePermission.ARTICLES_MANAGE,
                        ServicePermission.VIDEOS_MANAGE,
                        ServicePermission.MEDIA_MANAGE,
                        ServicePermission.PAGES_MANAGE,
                        ServicePermission.MENUS_MANAGE,
                        ServicePermission.COLLECTIONS_MANAGE,
                        ServicePermission.GALLERIES_MANAGE,
                        ServicePermission.IMAGES_MANAGE,
                        ServicePermission.ANALYTICS_VIEW
                    )
                );
                adminUserRepository.save(admin);
                logger.info("Seeded admin user: admin@example.com / Admin123!");
            }
        );
    }

    private void ensurePersonalBrandingMenus() {
        ApplicationEntity app = applicationJpaRepository.findById("b04535c1-6dea-48a5-bd74-a27d379afad4")
            .orElseGet(() -> applicationJpaRepository.findAll().stream()
                .filter(candidate -> "majidporkar".equalsIgnoreCase(candidate.getName()))
                .findFirst()
                .orElse(null));
        if (app == null) {
            return;
        }
        List<MenuSeed> seeds = List.of(
            new MenuSeed("fa", "منوی اصلی", List.of(
                Map.entry("خانه", "/fa"),
                Map.entry("پروژه ها", "/fa/projects"),
                Map.entry("بلاگ", "/fa/blog"),
                Map.entry("گالری", "/fa/gallery"),
                Map.entry("ویدیوها", "/fa/videos"),
                Map.entry("اینستاگرام", "/fa/instagram"),
                Map.entry("درباره من", "/fa/about"),
                Map.entry("تماس", "/fa/contact")
            )),
            new MenuSeed("en", "Main Menu", List.of(
                Map.entry("Home", "/en"),
                Map.entry("Projects", "/en/projects"),
                Map.entry("Blog", "/en/blog"),
                Map.entry("Gallery", "/en/gallery"),
                Map.entry("Videos", "/en/videos"),
                Map.entry("Instagram", "/en/instagram"),
                Map.entry("About", "/en/about"),
                Map.entry("Contact", "/en/contact")
            )),
            new MenuSeed("ar", "القائمة الرئيسية", List.of(
                Map.entry("الرئيسية", "/ar"),
                Map.entry("المشاريع", "/ar/projects"),
                Map.entry("المدونة", "/ar/blog"),
                Map.entry("المعرض", "/ar/gallery"),
                Map.entry("الفيديوهات", "/ar/videos"),
                Map.entry("إنستغرام", "/ar/instagram"),
                Map.entry("نبذة عني", "/ar/about"),
                Map.entry("اتصال", "/ar/contact")
            ))
        );
        for (MenuSeed seed : seeds) {
            MenuEntity menu = menuJpaRepository.findByApplicationIdAndCodeAndLanguageCode(app.getId(), "main-menu", seed.languageCode())
                .orElseGet(() -> {
                    Instant now = Instant.now();
                    return menuJpaRepository.save(new MenuEntity(
                        UUID.randomUUID().toString(),
                        app.getId(),
                        "main-menu",
                        seed.title(),
                        MenuLocation.HEADER,
                        seed.languageCode(),
                        MenuStatus.ACTIVE,
                        now,
                        now
                    ));
                });
            List<MenuItemEntity> existing = new ArrayList<>(menuItemJpaRepository.findByMenuId(menu.getId()));
            for (int index = 0; index < seed.items().size(); index++) {
                Map.Entry<String, String> item = seed.items().get(index);
                boolean exists = existing.stream().anyMatch(existingItem -> Objects.equals(existingItem.getUrl(), item.getValue()));
                if (exists) {
                    continue;
                }
                Instant now = Instant.now();
                menuItemJpaRepository.save(new MenuItemEntity(
                    UUID.randomUUID().toString(),
                    menu.getId(),
                    null,
                    item.getKey(),
                    MenuItemType.CUSTOM_URL,
                    null,
                    item.getValue(),
                    MenuItemTarget.SELF,
                    null,
                    null,
                    index,
                    true,
                    now,
                    now
                ));
            }
            normalizeBaselineSortOrder(menu.getId(), seed.items());
        }
    }

    private void normalizeBaselineSortOrder(String menuId, List<Map.Entry<String, String>> seedItems) {
        List<MenuItemEntity> items = menuItemJpaRepository.findByMenuId(menuId);
        Map<String, Integer> orderByUrl = new java.util.HashMap<>();
        for (int i = 0; i < seedItems.size(); i++) {
            orderByUrl.put(seedItems.get(i).getValue(), i);
        }
        List<MenuItemEntity> baseline = items.stream()
            .filter(item -> orderByUrl.containsKey(item.getUrl()))
            .sorted(Comparator.comparingInt(item -> orderByUrl.get(item.getUrl())))
            .toList();
        boolean duplicated = baseline.stream().map(MenuItemEntity::getSortOrder).distinct().count() < baseline.size();
        if (!duplicated) {
            return;
        }
        for (MenuItemEntity item : baseline) {
            Instant now = Instant.now();
            item.update(
                item.getParentId(),
                item.getTitle(),
                item.getItemType(),
                item.getReferenceId(),
                item.getUrl(),
                item.getTarget(),
                item.getIcon(),
                item.getCssClass(),
                orderByUrl.get(item.getUrl()),
                item.isVisible(),
                now
            );
            menuItemJpaRepository.save(item);
        }
    }

    private record MenuSeed(String languageCode, String title, List<Map.Entry<String, String>> items) {
    }
}
