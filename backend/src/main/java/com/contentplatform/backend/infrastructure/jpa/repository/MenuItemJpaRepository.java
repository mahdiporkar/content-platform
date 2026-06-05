package com.contentplatform.backend.infrastructure.jpa.repository;

import com.contentplatform.backend.infrastructure.jpa.entity.MenuItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuItemJpaRepository extends JpaRepository<MenuItemEntity, String> {
    List<MenuItemEntity> findByMenuId(String menuId);
    List<MenuItemEntity> findByMenuIdOrderBySortOrderAscCreatedAtAsc(String menuId);
    Optional<MenuItemEntity> findByIdAndMenuId(String id, String menuId);
    void deleteByMenuId(String menuId);
}
