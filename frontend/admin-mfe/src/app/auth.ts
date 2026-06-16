const TOKEN_KEY = "content-platform-token";

export type AdminTokenPayload = {
  sub?: string;
  email?: string;
  role?: "super_admin" | "system_admin" | "editor" | "publisher" | string;
  applicationIds?: string[];
  systemPermissions?: string[];
  servicePermissions?: string[];
  exp?: number;
  iat?: number;
};

export const normalizeAdminRole = (role?: string): string =>
  (role || "").trim().toLowerCase().replace(/-/g, "_");

export const isSuperAdmin = (payload: AdminTokenPayload | null): boolean =>
  normalizeAdminRole(payload?.role) === "super_admin";

export const canAccessSystemPermission = (payload: AdminTokenPayload | null, permission: string): boolean =>
  isSuperAdmin(payload) || (payload?.systemPermissions || []).includes(permission);

export const canAccessServicePermission = (payload: AdminTokenPayload | null, permission: string): boolean =>
  isSuperAdmin(payload) || (payload?.servicePermissions || []).includes(permission);

export const canAccessMedia = (payload: AdminTokenPayload | null): boolean => {
  const permissions = payload?.servicePermissions || [];
  return (
    isSuperAdmin(payload) ||
    permissions.includes("media.manage") ||
    permissions.includes("images.manage") ||
    permissions.includes("videos.manage") ||
    permissions.includes("posts.manage") ||
    permissions.includes("galleries.manage") ||
    permissions.includes("articles.manage") ||
    permissions.includes("pages.manage") ||
    permissions.includes("menus.manage")
  );
};

export const canAccessSitemap = (payload: AdminTokenPayload | null): boolean => {
  const permissions = payload?.servicePermissions || [];
  return (
    isSuperAdmin(payload) ||
    permissions.includes("posts.manage") ||
    permissions.includes("articles.manage") ||
    permissions.includes("videos.manage") ||
    permissions.includes("collections.manage")
  );
};

export const canAccessRoute = (payload: AdminTokenPayload | null, route: string): boolean => {
  if (!payload) {
    return false;
  }
  if (route === "applications") return canAccessSystemPermission(payload, "applications.manage");
  if (route === "users") return canAccessSystemPermission(payload, "users.manage");
  if (route === "collections") return canAccessServicePermission(payload, "collections.manage");
  if (route === "posts") return canAccessServicePermission(payload, "posts.manage");
  if (route === "articles") return canAccessServicePermission(payload, "articles.manage");
  if (route === "pages") return canAccessServicePermission(payload, "pages.manage");
  if (route === "menus") return canAccessServicePermission(payload, "menus.manage");
  if (route === "galleries") return canAccessServicePermission(payload, "galleries.manage");
  if (route === "videos") return canAccessServicePermission(payload, "videos.manage");
  if (route === "images") return canAccessServicePermission(payload, "images.manage");
  if (route === "media") return canAccessMedia(payload);
  if (route === "media-safety") return isSuperAdmin(payload);
  if (route === "sitemap") return canAccessSitemap(payload);
  if (route === "analytics") return canAccessServicePermission(payload, "analytics.view");
  return false;
};

export const getDefaultAdminRoute = (payload: AdminTokenPayload | null): string => {
  const routes = [
    "applications",
    "users",
    "collections",
    "posts",
    "articles",
    "pages",
    "menus",
    "galleries",
    "videos",
    "images",
    "media",
    "sitemap",
    "analytics"
  ];
  return routes.find((route) => canAccessRoute(payload, route)) || "login";
};

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(normalized);
};

const parseTokenPayload = (token: string): AdminTokenPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const decoded = decodeBase64Url(parts[1]);
    return JSON.parse(decoded) as AdminTokenPayload;
  } catch {
    return null;
  }
};

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getTokenPayload(): AdminTokenPayload | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }
    return parseTokenPayload(token);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
};
