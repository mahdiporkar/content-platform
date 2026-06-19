package com.contentplatform.backend.application.service;

import com.contentplatform.backend.application.exception.BadRequestException;
import com.contentplatform.backend.application.exception.ConflictException;
import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.application.exception.NotFoundException;
import com.contentplatform.backend.domain.value.ContentLocale;
import com.contentplatform.backend.domain.value.ContentStatus;
import com.contentplatform.backend.domain.value.MenuItemTarget;
import com.contentplatform.backend.domain.value.MenuItemType;
import com.contentplatform.backend.domain.value.MenuLocation;
import com.contentplatform.backend.domain.value.MenuStatus;
import com.contentplatform.backend.infrastructure.jpa.entity.ApplicationEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.ArticleEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MenuEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.MenuItemEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.PageEntity;
import com.contentplatform.backend.infrastructure.jpa.entity.PostEntity;
import com.contentplatform.backend.infrastructure.jpa.repository.ApplicationJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.ArticleJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MenuItemJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.MenuJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.PageJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.PostJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.repository.TenantRouteJpaRepository;
import com.contentplatform.backend.infrastructure.jpa.entity.TenantRouteEntity;
import com.contentplatform.backend.domain.value.TenantRouteStatus;
import com.contentplatform.backend.interfaces.web.request.MenuItemLayoutRequest;
import com.contentplatform.backend.interfaces.web.request.MenuItemUpsertRequest;
import com.contentplatform.backend.interfaces.web.request.MenuUpsertRequest;
import com.contentplatform.backend.interfaces.web.request.PageUpsertRequest;
import com.contentplatform.backend.interfaces.web.response.MenuContentCandidateResponse;
import com.contentplatform.backend.interfaces.web.response.MenuItemResponse;
import com.contentplatform.backend.interfaces.web.response.MenuResponse;
import com.contentplatform.backend.interfaces.web.response.PageContentResponse;
import com.contentplatform.backend.interfaces.web.response.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PageMenuService {
    private static final Pattern SCRIPT_TAG = Pattern.compile("(?is)<script[^>]*>.*?</script>");
    private static final Pattern EVENT_ATTR = Pattern.compile("(?i)\\s+on[a-z]+\\s*=\\s*(['\"]).*?\\1");
    private static final Set<MenuItemType> CONTENT_ITEM_TYPES = Set.of(
        MenuItemType.PAGE,
        MenuItemType.ARTICLE,
        MenuItemType.POST,
        MenuItemType.GALLERY,
        MenuItemType.TENANT_ROUTE
    );

    private final PageJpaRepository pageRepo;
    private final MenuJpaRepository menuRepo;
    private final MenuItemJpaRepository itemRepo;
    private final ArticleJpaRepository articleRepo;
    private final PostJpaRepository postRepo;
    private final ApplicationJpaRepository applicationRepo;
    private final PublicMediaUrlService publicMediaUrlService;
    private final TenantRouteJpaRepository tenantRouteRepo;

    public PageMenuService(PageJpaRepository pageRepo,
                           MenuJpaRepository menuRepo,
                           MenuItemJpaRepository itemRepo,
                           ArticleJpaRepository articleRepo,
                           PostJpaRepository postRepo,
                           ApplicationJpaRepository applicationRepo,
                           PublicMediaUrlService publicMediaUrlService,
                           TenantRouteJpaRepository tenantRouteRepo) {
        this.pageRepo = pageRepo;
        this.menuRepo = menuRepo;
        this.itemRepo = itemRepo;
        this.articleRepo = articleRepo;
        this.postRepo = postRepo;
        this.applicationRepo = applicationRepo;
        this.publicMediaUrlService = publicMediaUrlService;
        this.tenantRouteRepo = tenantRouteRepo;
    }

    @Transactional
    public PageContentResponse createPage(PageUpsertRequest request, String userId) {
        String languageCode = ContentLocale.normalizeOrDefault(request.getLanguageCode());
        String slug = trimRequired(request.getSlug(), "slug is required");
        if (pageRepo.existsByApplicationIdAndLanguageCodeAndSlug(request.getApplicationId(), languageCode, slug)) {
            throw new ConflictException("Page slug must be unique per application and language.");
        }
        String parentId = ensureParent(request.getApplicationId(), languageCode, request.getParentId());
        Instant now = Instant.now();
        PageEntity saved = pageRepo.save(new PageEntity(
            UUID.randomUUID().toString(),
            request.getApplicationId(),
            trimRequired(request.getTitle(), "title is required"),
            slug,
            request.getContent(),
            sanitize(request.getContent()),
            trimToNull(request.getCoverImage()),
            languageCode,
            request.getStatus(),
            trimToNull(request.getSeoTitle()),
            trimToNull(request.getSeoDescription()),
            normalizeKeywords(request.getSeoKeywords()),
            parentId,
            request.getSortOrder(),
            request.getShowInMenu() != null && request.getShowInMenu(),
            publishedAtFor(request.getStatus(), null),
            userId,
            userId,
            now,
            now
        ));
        return toPageResponse(saved);
    }

    @Transactional
    public PageContentResponse updatePage(String id, PageUpsertRequest request, String userId) {
        PageEntity page = pageRepo.findById(id).orElseThrow(() -> new NotFoundException("Page not found."));
        String languageCode = ContentLocale.normalizeOrDefault(request.getLanguageCode());
        String slug = trimRequired(request.getSlug(), "slug is required");
        if (pageRepo.existsByApplicationIdAndLanguageCodeAndSlugAndIdNot(request.getApplicationId(), languageCode, slug, id)) {
            throw new ConflictException("Page slug must be unique per application and language.");
        }
        page.update(
            request.getApplicationId(),
            trimRequired(request.getTitle(), "title is required"),
            slug,
            request.getContent(),
            sanitize(request.getContent()),
            trimToNull(request.getCoverImage()),
            languageCode,
            request.getStatus(),
            trimToNull(request.getSeoTitle()),
            trimToNull(request.getSeoDescription()),
            normalizeKeywords(request.getSeoKeywords()),
            ensureParent(request.getApplicationId(), languageCode, request.getParentId()),
            request.getSortOrder(),
            request.getShowInMenu() != null && request.getShowInMenu(),
            publishedAtFor(request.getStatus(), page.getPublishedAt()),
            userId,
            Instant.now()
        );
        return toPageResponse(pageRepo.save(page));
    }

    @Transactional
    public PageContentResponse changePageStatus(String id, ContentStatus status, String userId) {
        PageEntity page = pageRepo.findById(id).orElseThrow(() -> new NotFoundException("Page not found."));
        page.update(
            page.getApplicationId(),
            page.getTitle(),
            page.getSlug(),
            page.getContent(),
            page.getSanitizedHtml(),
            page.getCoverImage(),
            page.getLanguageCode(),
            status,
            page.getSeoTitle(),
            page.getSeoDescription(),
            page.getSeoKeywords(),
            page.getParentId(),
            page.getSortOrder(),
            page.isShowInMenu(),
            publishedAtFor(status, page.getPublishedAt()),
            userId,
            Instant.now()
        );
        return toPageResponse(pageRepo.save(page));
    }

    public String getPageApplicationId(String id) {
        return pageRepo.findById(id).map(PageEntity::getApplicationId).orElseThrow(() -> new NotFoundException("Page not found."));
    }

    public PageContentResponse getPage(String id) {
        return toPageResponse(pageRepo.findById(id).orElseThrow(() -> new NotFoundException("Page not found.")));
    }

    public PageResponse<PageContentResponse> listPages(String applicationId, ContentStatus status, String languageCode, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = Math.max(1, size);
        var pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.desc("updatedAt")));
        org.springframework.data.domain.Page<PageEntity> result;
        if (languageCode != null && status != null) {
            result = pageRepo.findByApplicationIdAndLanguageCodeAndStatus(applicationId, languageCode, status, pageable);
        } else if (languageCode != null) {
            result = pageRepo.findByApplicationIdAndLanguageCode(applicationId, languageCode, pageable);
        } else if (status != null) {
            result = pageRepo.findByApplicationIdAndStatus(applicationId, status, pageable);
        } else {
            result = pageRepo.findByApplicationId(applicationId, pageable);
        }
        return new PageResponse<>(
            result.getContent().stream().map(this::toPageResponse).toList(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.getNumber(),
            result.getSize()
        );
    }

    public List<PageContentResponse> listPublishedPages(String applicationId, String languageCode) {
        List<PageEntity> pages = languageCode == null
            ? pageRepo.findByApplicationIdAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(applicationId, ContentStatus.PUBLISHED)
            : pageRepo.findByApplicationIdAndLanguageCodeAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(applicationId, languageCode, ContentStatus.PUBLISHED);
        return pages.stream().map(this::toPageResponse).toList();
    }

    public PageContentResponse getPublishedPage(String applicationId, String languageCode, String slug) {
        PageEntity page = pageRepo.findByApplicationIdAndLanguageCodeAndSlugAndStatus(applicationId, languageCode, slug, ContentStatus.PUBLISHED)
            .orElseThrow(() -> new NotFoundException("Page not found."));
        return toPageResponse(page);
    }

    @Transactional
    public MenuResponse createMenu(MenuUpsertRequest request) {
        Instant now = Instant.now();
        MenuEntity menu = menuRepo.save(new MenuEntity(
            UUID.randomUUID().toString(),
            request.getApplicationId(),
            trimRequired(request.getCode(), "code is required"),
            trimRequired(request.getTitle(), "title is required"),
            request.getLocation(),
            ContentLocale.normalizeOrDefault(request.getLanguageCode()),
            request.getStatus(),
            now,
            now
        ));
        return toMenuResponse(menu, true);
    }

    @Transactional
    public MenuResponse updateMenu(String id, MenuUpsertRequest request) {
        MenuEntity menu = menuRepo.findById(id).orElseThrow(() -> new NotFoundException("Menu not found."));
        menu.update(
            request.getApplicationId(),
            trimRequired(request.getCode(), "code is required"),
            trimRequired(request.getTitle(), "title is required"),
            request.getLocation(),
            ContentLocale.normalizeOrDefault(request.getLanguageCode()),
            request.getStatus(),
            Instant.now()
        );
        return toMenuResponse(menuRepo.save(menu), true);
    }

    @Transactional
    public MenuResponse changeMenuStatus(String id, MenuStatus status) {
        MenuEntity menu = menuRepo.findById(id).orElseThrow(() -> new NotFoundException("Menu not found."));
        menu.setStatus(status, Instant.now());
        return toMenuResponse(menuRepo.save(menu), true);
    }

    @Transactional
    public void deleteMenu(String id) {
        itemRepo.deleteByMenuId(id);
        menuRepo.deleteById(id);
    }

    public String getMenuApplicationId(String id) {
        return menuRepo.findById(id).map(MenuEntity::getApplicationId).orElseThrow(() -> new NotFoundException("Menu not found."));
    }

    public MenuResponse getMenu(String id) {
        return toMenuResponse(menuRepo.findById(id).orElseThrow(() -> new NotFoundException("Menu not found.")), true);
    }

    public List<MenuResponse> listMenus(String applicationId, String languageCode, MenuStatus status) {
        List<MenuEntity> menus;
        if (languageCode != null && status != null) {
            menus = menuRepo.findByApplicationIdAndLanguageCodeAndStatusOrderByUpdatedAtDesc(applicationId, languageCode, status);
        } else if (languageCode != null) {
            menus = menuRepo.findByApplicationIdAndLanguageCodeOrderByUpdatedAtDesc(applicationId, languageCode);
        } else if (status != null) {
            menus = menuRepo.findByApplicationIdAndStatusOrderByUpdatedAtDesc(applicationId, status);
        } else {
            menus = menuRepo.findByApplicationIdOrderByUpdatedAtDesc(applicationId);
        }
        return menus.stream().map(menu -> toMenuResponse(menu, false)).toList();
    }

    @Transactional
    public MenuResponse addMenuItem(String menuId, MenuItemUpsertRequest request) {
        validateMenuItem(request);
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        Instant now = Instant.now();
        MenuItemEntity item = new MenuItemEntity(
            UUID.randomUUID().toString(),
            menuId,
            ensureSameMenuParent(menuId, request.getParentId()),
            trimRequired(request.getTitle(), "title is required"),
            request.getItemType(),
            trimToNull(request.getReferenceId()),
            trimToNull(request.getUrl()),
            request.getTarget() == null ? MenuItemTarget.SELF : request.getTarget(),
            trimToNull(request.getIcon()),
            trimToNull(request.getCssClass()),
            request.getSortOrder() == null ? 0 : request.getSortOrder(),
            request.getIsVisible() == null || request.getIsVisible(),
            now,
            now
        );
        applyOwnership(item, request.getItemType(), trimToNull(request.getReferenceId()));
        itemRepo.save(item);
        return toMenuResponse(menu, true);
    }

    @Transactional
    public MenuResponse updateMenuItem(String menuId, String itemId, MenuItemUpsertRequest request) {
        validateMenuItem(request);
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        MenuItemEntity item = itemRepo.findByIdAndMenuId(itemId, menuId).orElseThrow(() -> new NotFoundException("Menu item not found."));
        String parentId = ensureSameMenuParent(menuId, request.getParentId());
        ensureNoCircularParent(itemId, menuId, parentId);
        item.update(
            parentId,
            trimRequired(request.getTitle(), "title is required"),
            request.getItemType(),
            trimToNull(request.getReferenceId()),
            trimToNull(request.getUrl()),
            request.getTarget() == null ? MenuItemTarget.SELF : request.getTarget(),
            trimToNull(request.getIcon()),
            trimToNull(request.getCssClass()),
            request.getSortOrder() == null ? 0 : request.getSortOrder(),
            request.getIsVisible() == null || request.getIsVisible(),
            Instant.now()
        );
        applyOwnership(item, request.getItemType(), trimToNull(request.getReferenceId()));
        itemRepo.save(item);
        return toMenuResponse(menu, true);
    }

    @Transactional
    public MenuResponse deleteMenuItem(String menuId, String itemId) {
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        List<MenuItemEntity> all = itemRepo.findByMenuId(menuId);
        Set<String> ids = collectDescendants(itemId, all);
        itemRepo.deleteAllById(ids);
        return toMenuResponse(menu, true);
    }

    @Transactional
    public MenuResponse updateMenuItemsLayout(String menuId, List<MenuItemLayoutRequest> layout) {
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        List<MenuItemEntity> all = itemRepo.findByMenuId(menuId);
        Map<String, MenuItemEntity> byId = new HashMap<>();
        for (MenuItemEntity item : all) {
            byId.put(item.getId(), item);
        }
        List<MenuItemLayoutRequest> request = layout == null ? List.of() : layout;
        Set<String> seen = new HashSet<>();
        for (MenuItemLayoutRequest entry : request) {
            if (entry.getId() == null || !seen.add(entry.getId()) || !byId.containsKey(entry.getId())) {
                throw new BadRequestException("Layout contains invalid menu item ids.");
            }
        }
        for (MenuItemLayoutRequest entry : request) {
            String parentId = ensureSameMenuParent(menuId, entry.getParentId());
            ensureNoCircularParent(entry.getId(), menuId, parentId);
            MenuItemEntity item = byId.get(entry.getId());
            item.update(
                parentId,
                item.getTitle(),
                item.getItemType(),
                item.getReferenceId(),
                item.getUrl(),
                item.getTarget(),
                item.getIcon(),
                item.getCssClass(),
                entry.getSortOrder(),
                entry.getIsVisible() == null ? item.isVisible() : entry.getIsVisible(),
                Instant.now()
            );
            itemRepo.save(item);
        }
        return toMenuResponse(menu, true);
    }

    public List<MenuContentCandidateResponse> listPublishedContentCandidates(String menuId) {
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        List<MenuItemEntity> existing = itemRepo.findByMenuId(menuId);
        Set<String> refs = new HashSet<>();
        for (MenuItemEntity item : existing) {
            if (item.getReferenceId() != null) {
                refs.add(item.getItemType() + ":" + item.getReferenceId());
            }
        }
        List<MenuContentCandidateResponse> candidates = new ArrayList<>();
        pageRepo.findByApplicationIdAndLanguageCodeAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(
            menu.getApplicationId(), menu.getLanguageCode(), ContentStatus.PUBLISHED
        ).forEach(page -> candidates.add(new MenuContentCandidateResponse(
            page.getId(), MenuItemType.PAGE, page.getTitle(), page.getSlug(),
            "/" + menu.getLanguageCode() + "/" + page.getSlug(),
            refs.contains(MenuItemType.PAGE + ":" + page.getId()),
            page.getPublishedAt(), page.getUpdatedAt()
        )));
        postRepo.findByApplicationIdAndStatus(menu.getApplicationId(), ContentStatus.PUBLISHED).stream()
            .filter(post -> Objects.equals(post.getLocale(), menu.getLanguageCode()))
            .sorted(Comparator.comparing(PostEntity::getPublishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .forEach(post -> candidates.add(new MenuContentCandidateResponse(
                post.getId(), MenuItemType.POST, post.getTitle(), post.getSlug(),
                "/" + menu.getLanguageCode() + "/posts/" + post.getSlug(),
                refs.contains(MenuItemType.POST + ":" + post.getId()),
                post.getPublishedAt(), post.getUpdatedAt()
            )));
        articleRepo.findByApplicationIdAndStatus(menu.getApplicationId(), ContentStatus.PUBLISHED).stream()
            .filter(article -> Objects.equals(article.getLocale(), menu.getLanguageCode()))
            .sorted(Comparator.comparing(ArticleEntity::getPublishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .forEach(article -> candidates.add(new MenuContentCandidateResponse(
                article.getId(), MenuItemType.ARTICLE, article.getTitle(), article.getSlug(),
                "/" + menu.getLanguageCode() + "/articles/" + article.getSlug(),
                refs.contains(MenuItemType.ARTICLE + ":" + article.getId()),
                article.getPublishedAt(), article.getUpdatedAt()
            )));
        tenantRouteRepo.findByApplicationIdAndStatusOrderBySourceAscRouteKeyAsc(
            menu.getApplicationId(), TenantRouteStatus.AVAILABLE
        ).forEach(route -> candidates.add(new MenuContentCandidateResponse(
            route.getId(), MenuItemType.TENANT_ROUTE,
            route.getTitles().getOrDefault(menu.getLanguageCode(), route.getTitles().getOrDefault("en", route.getRouteKey())),
            route.getRouteKey(), resolveTenantPath(route.getPathTemplate(), menu.getLanguageCode()),
            refs.contains(MenuItemType.TENANT_ROUTE + ":" + route.getId()), null, route.getUpdatedAt()
        )));
        return candidates;
    }

    @Transactional
    public MenuResponse syncPublishedContent(String menuId) {
        MenuEntity menu = menuRepo.findById(menuId).orElseThrow(() -> new NotFoundException("Menu not found."));
        List<MenuContentCandidateResponse> candidates = listPublishedContentCandidates(menuId);
        int nextSort = itemRepo.findByMenuId(menuId).stream().mapToInt(MenuItemEntity::getSortOrder).max().orElse(-1) + 1;
        Instant now = Instant.now();
        for (MenuContentCandidateResponse candidate : candidates) {
            if (candidate.isAlreadyInMenu()) {
                continue;
            }
            MenuItemEntity item = new MenuItemEntity(
                UUID.randomUUID().toString(),
                menuId,
                null,
                candidate.getTitle(),
                candidate.getType(),
                candidate.getId(),
                candidate.getUrl(),
                MenuItemTarget.SELF,
                null,
                null,
                nextSort++,
                true,
                now,
                now
            );
            applyOwnership(item, candidate.getType(), candidate.getId());
            itemRepo.save(item);
        }
        return toMenuResponse(menu, true);
    }

    public MenuResponse getPublicMenuByCode(String applicationId, String languageCode, String code) {
        MenuEntity menu = menuRepo.findByApplicationIdAndLanguageCodeAndCodeAndStatus(applicationId, languageCode, code, MenuStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("Menu not found."));
        return toMenuResponse(menu, filterPublishedItems(applicationId, menu));
    }

    public List<MenuResponse> getPublicMenusByLocation(String applicationId, String languageCode, MenuLocation location) {
        return menuRepo.findByApplicationIdAndLanguageCodeAndLocationAndStatusOrderByUpdatedAtDesc(applicationId, languageCode, location, MenuStatus.ACTIVE)
            .stream()
            .map(menu -> toMenuResponse(menu, filterPublishedItems(applicationId, menu)))
            .toList();
    }

    public String validateApplicationToken(String applicationId, String token) {
        if (trimToNull(applicationId) == null || trimToNull(token) == null) {
            throw new ForbiddenException("Application credentials are required");
        }
        ApplicationEntity app = applicationRepo.findById(applicationId).orElseThrow(() -> new ForbiddenException("Invalid application credentials"));
        if (!Objects.equals(app.getApiToken(), token)) {
            throw new ForbiddenException("Invalid application credentials");
        }
        return app.getId();
    }

    private List<MenuItemEntity> filterPublishedItems(String applicationId, MenuEntity menu) {
        List<MenuItemEntity> visible = itemRepo.findByMenuIdOrderBySortOrderAscCreatedAtAsc(menu.getId()).stream()
            .filter(MenuItemEntity::isVisible)
            .toList();
        Map<String, PageEntity> pages = new HashMap<>();
        pageRepo.findByApplicationIdAndLanguageCodeAndStatusOrderBySortOrderAscPublishedAtDescCreatedAtDesc(
            applicationId, menu.getLanguageCode(), ContentStatus.PUBLISHED
        ).forEach(page -> pages.put(page.getId(), page));
        Map<String, PostEntity> posts = new HashMap<>();
        postRepo.findByApplicationIdAndStatus(applicationId, ContentStatus.PUBLISHED).stream()
            .filter(post -> Objects.equals(post.getLocale(), menu.getLanguageCode()))
            .forEach(post -> posts.put(post.getId(), post));
        Map<String, ArticleEntity> articles = new HashMap<>();
        articleRepo.findByApplicationIdAndStatus(applicationId, ContentStatus.PUBLISHED).stream()
            .filter(article -> Objects.equals(article.getLocale(), menu.getLanguageCode()))
            .forEach(article -> articles.put(article.getId(), article));
        Map<String, TenantRouteEntity> tenantRoutes = new HashMap<>();
        tenantRouteRepo.findByApplicationIdAndStatusOrderBySourceAscRouteKeyAsc(applicationId, TenantRouteStatus.AVAILABLE)
            .forEach(route -> tenantRoutes.put(route.getId(), route));

        List<MenuItemEntity> filtered = new ArrayList<>();
        for (MenuItemEntity item : visible) {
            if (item.getItemType() == MenuItemType.PAGE) {
                PageEntity page = pages.get(item.getReferenceId());
                if (page != null) {
                    filtered.add(copyWithUrl(item, item.getUrl() == null ? "/" + menu.getLanguageCode() + "/" + page.getSlug() : item.getUrl()));
                }
            } else if (item.getItemType() == MenuItemType.POST) {
                PostEntity post = posts.get(item.getReferenceId());
                if (post != null) {
                    filtered.add(copyWithUrl(item, item.getUrl() == null ? "/" + menu.getLanguageCode() + "/posts/" + post.getSlug() : item.getUrl()));
                }
            } else if (item.getItemType() == MenuItemType.ARTICLE) {
                ArticleEntity article = articles.get(item.getReferenceId());
                if (article != null) {
                    filtered.add(copyWithUrl(item, item.getUrl() == null ? "/" + menu.getLanguageCode() + "/articles/" + article.getSlug() : item.getUrl()));
                }
            } else if (item.getItemType() == MenuItemType.TENANT_ROUTE) {
                TenantRouteEntity route = tenantRoutes.get(item.getReferenceId());
                if (route != null) {
                    MenuItemEntity resolved = copyWithUrl(item, resolveTenantPath(route.getPathTemplate(), menu.getLanguageCode()));
                    resolved.update(resolved.getParentId(),
                        route.getTitles().getOrDefault(menu.getLanguageCode(), route.getTitles().getOrDefault("en", resolved.getTitle())),
                        resolved.getItemType(), resolved.getReferenceId(), resolved.getUrl(), resolved.getTarget(),
                        route.getIcon() == null ? resolved.getIcon() : route.getIcon(),
                        route.getCssClass() == null ? resolved.getCssClass() : route.getCssClass(),
                        resolved.getSortOrder(), resolved.isVisible(), resolved.getUpdatedAt());
                    resolved.setOwnership(route.getSource(), route.getRouteKey(), "TENANT");
                    filtered.add(resolved);
                }
            } else if (item.getItemType() != MenuItemType.GALLERY) {
                filtered.add(item);
            }
        }
        return filtered;
    }

    private MenuItemEntity copyWithUrl(MenuItemEntity item, String url) {
        MenuItemEntity copy = new MenuItemEntity(
            item.getId(), item.getMenuId(), item.getParentId(), item.getTitle(), item.getItemType(),
            item.getReferenceId(), url, item.getTarget(), item.getIcon(), item.getCssClass(),
            item.getSortOrder(), item.isVisible(), item.getCreatedAt(), item.getUpdatedAt()
        );
        copy.setOwnership(item.getSource(), item.getSourceKey(), item.getManagedBy());
        return copy;
    }

    private MenuResponse toMenuResponse(MenuEntity menu, boolean includeItems) {
        return toMenuResponse(menu, includeItems ? itemRepo.findByMenuIdOrderBySortOrderAscCreatedAtAsc(menu.getId()) : List.of());
    }

    private MenuResponse toMenuResponse(MenuEntity menu, List<MenuItemEntity> items) {
        return new MenuResponse(
            menu.getId(), menu.getApplicationId(), menu.getCode(), menu.getTitle(), menu.getLocation(),
            menu.getLanguageCode(), menu.getStatus(), buildTree(items), menu.getCreatedAt(), menu.getUpdatedAt()
        );
    }

    private List<MenuItemResponse> buildTree(List<MenuItemEntity> items) {
        Map<String, List<MenuItemEntity>> byParent = new HashMap<>();
        List<MenuItemEntity> sorted = items.stream()
            .sorted(Comparator.comparingInt(MenuItemEntity::getSortOrder).thenComparing(MenuItemEntity::getCreatedAt))
            .toList();
        for (MenuItemEntity item : sorted) {
            byParent.computeIfAbsent(item.getParentId(), ignored -> new ArrayList<>()).add(item);
        }
        return visit(null, byParent);
    }

    private List<MenuItemResponse> visit(String parentId, Map<String, List<MenuItemEntity>> byParent) {
        return byParent.getOrDefault(parentId, List.of()).stream()
            .map(item -> toItemResponse(item, visit(item.getId(), byParent)))
            .toList();
    }

    private MenuItemResponse toItemResponse(MenuItemEntity item, List<MenuItemResponse> children) {
        return new MenuItemResponse(
            item.getId(), item.getMenuId(), item.getParentId(), item.getTitle(), item.getItemType(),
            item.getReferenceId(), item.getUrl(), item.getTarget(), item.getIcon(), item.getCssClass(),
            item.getSortOrder(), item.isVisible(), CONTENT_ITEM_TYPES.contains(item.getItemType()),
            item.getSource(), item.getSourceKey(), item.getManagedBy(), children,
            item.getCreatedAt(), item.getUpdatedAt()
        );
    }

    private PageContentResponse toPageResponse(PageEntity page) {
        String html = publicMediaUrlService.rewriteHtmlMediaUrls(page.getApplicationId(), page.getSanitizedHtml() == null ? page.getContent() : page.getSanitizedHtml());
        String cover = publicMediaUrlService.toPublicMediaUrl(page.getApplicationId(), page.getCoverImage());
        return new PageContentResponse(
            page.getId(), page.getApplicationId(), page.getTitle(), page.getSlug(), page.getContent(),
            html, cover, page.getLanguageCode(), page.getStatus(), page.getSeoTitle(), page.getSeoDescription(),
            page.getSeoKeywords(), page.getParentId(), page.getSortOrder(), page.isShowInMenu(),
            page.getPublishedAt(), page.getCreatedBy(), page.getUpdatedBy(), page.getCreatedAt(), page.getUpdatedAt()
        );
    }

    private void validateMenuItem(MenuItemUpsertRequest request) {
        if ((request.getItemType() == MenuItemType.CUSTOM_URL || request.getItemType() == MenuItemType.EXTERNAL_URL)
            && trimToNull(request.getUrl()) == null) {
            throw new BadRequestException("URL is required for URL menu items.");
        }
        if (CONTENT_ITEM_TYPES.contains(request.getItemType()) && trimToNull(request.getReferenceId()) == null) {
            throw new BadRequestException("Reference id is required for content menu items.");
        }
        if (request.getItemType() == MenuItemType.GROUP && (trimToNull(request.getReferenceId()) != null || trimToNull(request.getUrl()) != null)) {
            throw new BadRequestException("Group menu items cannot have referenceId or URL.");
        }
    }

    private void applyOwnership(MenuItemEntity item, MenuItemType type, String referenceId) {
        if (type == MenuItemType.TENANT_ROUTE) {
            TenantRouteEntity route = tenantRouteRepo.findById(referenceId)
                .orElseThrow(() -> new NotFoundException("Tenant route not found."));
            item.setOwnership(route.getSource(), route.getRouteKey(), "TENANT");
        } else if (CONTENT_ITEM_TYPES.contains(type)) {
            item.setOwnership("content-platform", referenceId, "CMS");
        } else {
            item.setOwnership(null, null, "ADMIN");
        }
    }

    private String resolveTenantPath(String template, String languageCode) {
        return template.replace("{locale}", languageCode).replace("{languageCode}", languageCode);
    }

    private String ensureSameMenuParent(String menuId, String parentId) {
        String normalized = trimToNull(parentId);
        if (normalized == null) {
            return null;
        }
        itemRepo.findByIdAndMenuId(normalized, menuId).orElseThrow(() -> new NotFoundException("Parent menu item not found."));
        return normalized;
    }

    private void ensureNoCircularParent(String itemId, String menuId, String parentId) {
        if (parentId == null) {
            return;
        }
        if (Objects.equals(itemId, parentId)) {
            throw new BadRequestException("Menu item cannot be its own parent.");
        }
        Map<String, MenuItemEntity> byId = new HashMap<>();
        itemRepo.findByMenuId(menuId).forEach(item -> byId.put(item.getId(), item));
        MenuItemEntity cursor = byId.get(parentId);
        while (cursor != null) {
            if (Objects.equals(cursor.getParentId(), itemId)) {
                throw new BadRequestException("Circular menu parent-child relationship is not allowed.");
            }
            cursor = cursor.getParentId() == null ? null : byId.get(cursor.getParentId());
        }
    }

    private Set<String> collectDescendants(String id, List<MenuItemEntity> all) {
        Set<String> ids = new HashSet<>();
        ids.add(id);
        for (MenuItemEntity item : all) {
            if (Objects.equals(item.getParentId(), id)) {
                ids.addAll(collectDescendants(item.getId(), all));
            }
        }
        return ids;
    }

    private String ensureParent(String applicationId, String languageCode, String parentId) {
        String normalized = trimToNull(parentId);
        if (normalized == null) {
            return null;
        }
        PageEntity parent = pageRepo.findById(normalized).orElseThrow(() -> new NotFoundException("Parent page not found."));
        if (!Objects.equals(parent.getApplicationId(), applicationId) || !Objects.equals(parent.getLanguageCode(), languageCode)) {
            throw new NotFoundException("Parent page not found.");
        }
        return parent.getId();
    }

    private Instant publishedAtFor(ContentStatus status, Instant current) {
        if (status == ContentStatus.PUBLISHED) {
            return current == null ? Instant.now() : current;
        }
        return null;
    }

    private List<String> normalizeKeywords(List<String> keywords) {
        if (keywords == null) {
            return null;
        }
        List<String> normalized = keywords.stream().map(this::trimToNull).filter(Objects::nonNull).toList();
        return normalized.isEmpty() ? null : normalized;
    }

    private String sanitize(String html) {
        if (html == null) {
            return null;
        }
        return EVENT_ATTR.matcher(SCRIPT_TAG.matcher(html).replaceAll("")).replaceAll("");
    }

    private String trimRequired(String value, String message) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new BadRequestException(message);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
