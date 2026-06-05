package com.contentplatform.backend.interfaces.web.controller;

import com.contentplatform.backend.application.service.PageMenuService;
import com.contentplatform.backend.domain.value.MenuStatus;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.interfaces.web.SecurityUtils;
import com.contentplatform.backend.interfaces.web.request.MenuItemUpsertRequest;
import com.contentplatform.backend.interfaces.web.request.MenuItemsLayoutRequest;
import com.contentplatform.backend.interfaces.web.request.MenuStatusRequest;
import com.contentplatform.backend.interfaces.web.request.MenuUpsertRequest;
import com.contentplatform.backend.interfaces.web.response.MenuContentCandidateResponse;
import com.contentplatform.backend.interfaces.web.response.MenuResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/menus")
public class AdminMenuController {
    private final PageMenuService pageMenuService;

    public AdminMenuController(PageMenuService pageMenuService) {
        this.pageMenuService = pageMenuService;
    }

    @PostMapping
    public ResponseEntity<MenuResponse> create(@Valid @RequestBody MenuUpsertRequest request) {
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(request.getApplicationId());
        return ResponseEntity.ok(pageMenuService.createMenu(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuResponse> update(@PathVariable String id, @Valid @RequestBody MenuUpsertRequest request) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.updateMenu(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MenuResponse> changeStatus(@PathVariable String id, @Valid @RequestBody MenuStatusRequest request) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.changeMenuStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(@PathVariable String id) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        pageMenuService.deleteMenu(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuResponse> get(@PathVariable String id) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.getMenu(id));
    }

    @GetMapping("/{id}/published-content")
    public ResponseEntity<List<MenuContentCandidateResponse>> publishedContent(@PathVariable String id) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.listPublishedContentCandidates(id));
    }

    @PostMapping("/{id}/sync-published")
    public ResponseEntity<MenuResponse> syncPublished(@PathVariable String id) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.syncPublishedContent(id));
    }

    @GetMapping
    public ResponseEntity<List<MenuResponse>> list(@RequestParam String applicationId,
                                                   @RequestParam(required = false) String languageCode,
                                                   @RequestParam(required = false) MenuStatus status) {
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.listMenus(applicationId, languageCode, status));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<MenuResponse> addItem(@PathVariable String id, @Valid @RequestBody MenuItemUpsertRequest request) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.addMenuItem(id, request));
    }

    @PutMapping("/{id}/items/layout")
    public ResponseEntity<MenuResponse> updateItemsLayout(@PathVariable String id, @RequestBody MenuItemsLayoutRequest request) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.updateMenuItemsLayout(id, request == null ? List.of() : request.getItems()));
    }

    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<MenuResponse> updateItem(@PathVariable String id,
                                                   @PathVariable String itemId,
                                                   @Valid @RequestBody MenuItemUpsertRequest request) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.updateMenuItem(id, itemId, request));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<MenuResponse> deleteItem(@PathVariable String id, @PathVariable String itemId) {
        String applicationId = pageMenuService.getMenuApplicationId(id);
        SecurityUtils.requireServicePermission(ServicePermission.MENUS_MANAGE);
        SecurityUtils.requireApplicationAccess(applicationId);
        return ResponseEntity.ok(pageMenuService.deleteMenuItem(id, itemId));
    }
}
