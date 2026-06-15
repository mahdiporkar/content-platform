import { AdminUserRole } from '../entities/admin-user.entity';

export enum SystemPermission {
  APPLICATIONS_MANAGE = 'applications.manage',
  USERS_MANAGE = 'users.manage',
}

export enum ServicePermission {
  POSTS_MANAGE = 'posts.manage',
  ARTICLES_MANAGE = 'articles.manage',
  MEDIA_MANAGE = 'media.manage',
  PAGES_MANAGE = 'pages.manage',
  MENUS_MANAGE = 'menus.manage',
  GALLERIES_MANAGE = 'galleries.manage',
  IMAGES_MANAGE = 'images.manage',
  VIDEOS_MANAGE = 'videos.manage',
  COLLECTIONS_MANAGE = 'collections.manage',
  ANALYTICS_VIEW = 'analytics.view',
}

export const DEFAULT_SYSTEM_PERMISSIONS: SystemPermission[] = [
  SystemPermission.APPLICATIONS_MANAGE,
  SystemPermission.USERS_MANAGE,
];

export const DEFAULT_SERVICE_PERMISSIONS: ServicePermission[] = [
  ServicePermission.POSTS_MANAGE,
  ServicePermission.ARTICLES_MANAGE,
  ServicePermission.MEDIA_MANAGE,
  ServicePermission.PAGES_MANAGE,
  ServicePermission.MENUS_MANAGE,
  ServicePermission.GALLERIES_MANAGE,
  ServicePermission.IMAGES_MANAGE,
  ServicePermission.VIDEOS_MANAGE,
  ServicePermission.COLLECTIONS_MANAGE,
  ServicePermission.ANALYTICS_VIEW,
];

export const normalizeSystemPermissions = (
  role: AdminUserRole,
  permissions?: string[] | null,
): SystemPermission[] => {
  if (role === AdminUserRole.SUPER_ADMIN) {
    return [];
  }
  if (!permissions) {
    return [];
  }
  const allowed = new Set<string>(Object.values(SystemPermission));
  return Array.from(
    new Set(
      permissions
        .map((entry) => entry.trim())
        .filter((entry) => allowed.has(entry)),
    ),
  ) as SystemPermission[];
};

export const normalizeServicePermissions = (
  role: AdminUserRole,
  permissions?: string[] | null,
): ServicePermission[] => {
  if (role === AdminUserRole.SUPER_ADMIN) {
    return [];
  }
  if (!permissions) {
    return [];
  }
  const allowed = new Set<string>(Object.values(ServicePermission));
  return Array.from(
    new Set(
      permissions
        .map((entry) => entry.trim())
        .filter((entry) => allowed.has(entry)),
    ),
  ) as ServicePermission[];
};
