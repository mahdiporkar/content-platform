import axios, { InternalAxiosRequestConfig } from "axios";
import { authStore, isSuperAdmin } from "../app/auth";
import { tenantStore } from "../app/tenantStore";
import { apiBaseUrl } from "../config/env";

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});
let redirectingToLogin = false;

const normalizeRequestPath = (url?: string): string => {
  if (!url) {
    return "";
  }

  try {
    const baseUrl = apiBaseUrl.startsWith("http") ? apiBaseUrl : window.location.origin;
    return new URL(url, baseUrl).pathname;
  } catch {
    return url.split("?")[0] ?? "";
  }
};

const isAdminRequest = (path: string): boolean =>
  path.startsWith("/api/v1/admin/") || path === "/api/v1/media" || path.startsWith("/api/v1/media/");

const shouldSkipApplicationHeader = (path: string, superAdmin = false): boolean =>
  path === "/api/v1/auth/login" ||
  path === "/api/v1/admin/applications" ||
  path.startsWith("/api/v1/admin/applications/") ||
  (superAdmin && (path === "/api/v1/admin/users" || path.startsWith("/api/v1/admin/users/")));

const toApplicationId = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const getRequestBodyApplicationId = (data: unknown): string => {
  if (data instanceof FormData) {
    return toApplicationId(data.get("applicationId"));
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return toApplicationId((data as Record<string, unknown>).applicationId);
  }
  return "";
};

const moveApplicationIdFromAdminUrlToHeader = (config: InternalAxiosRequestConfig, path: string): string => {
  if (!isAdminRequest(path)) {
    return "";
  }
  const params = config.params as Record<string, unknown> | undefined;
  if (!params || !("applicationId" in params)) {
    return "";
  }
  const applicationId = toApplicationId(params.applicationId);
  delete params.applicationId;
  return applicationId;
};

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const requestPath = normalizeRequestPath(config.url);
  const requestApplicationId = moveApplicationIdFromAdminUrlToHeader(config, requestPath);
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tokenPayload = authStore.getTokenPayload();
  const superAdmin = isSuperAdmin(tokenPayload);
  const fallbackApplicationId = superAdmin ? "" : tokenPayload?.applicationIds?.[0] ?? "";
  const applicationId =
    requestApplicationId ||
    getRequestBodyApplicationId(config.data) ||
    tenantStore.getApplicationId() ||
    fallbackApplicationId;
  if (applicationId && !shouldSkipApplicationHeader(requestPath, superAdmin)) {
    config.headers["X-Application-Id"] = applicationId;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const token = authStore.getToken();
    if (status === 401 && token) {
      authStore.clearToken();
      if (!redirectingToLogin && window.location.pathname !== "/login") {
        redirectingToLogin = true;
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
