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

const shouldSkipApplicationHeader = (path: string, superAdmin = false): boolean => {
  return (
    path === "/api/v1/auth/login" ||
    path === "/api/v1/admin/applications" ||
    path.startsWith("/api/v1/admin/applications/") ||
    (superAdmin && (path === "/api/v1/admin/users" || path.startsWith("/api/v1/admin/users/")))
  );
};

const isAdminRequest = (path: string): boolean => path.startsWith("/api/v1/admin/") || path === "/api/v1/media" || path.startsWith("/api/v1/media/");

const toApplicationId = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const moveApplicationIdOutOfAdminUrl = (config: InternalAxiosRequestConfig, path: string): string => {
  let applicationId = "";
  if (!isAdminRequest(path)) {
    return applicationId;
  }
  const params = config.params as Record<string, unknown> | undefined;
  if (params && "applicationId" in params) {
    applicationId = toApplicationId(params.applicationId);
    delete params.applicationId;
  }
  if (config.data instanceof FormData) {
    applicationId = applicationId || toApplicationId(config.data.get("applicationId"));
    return applicationId;
  }
  if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
    const data = config.data as Record<string, unknown>;
    applicationId = applicationId || toApplicationId(data.applicationId);
  }
  return applicationId;
};

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const requestPath = normalizeRequestPath(config.url);
  const requestApplicationId = moveApplicationIdOutOfAdminUrl(config, requestPath);
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tokenPayload = authStore.getTokenPayload();
  const superAdmin = isSuperAdmin(tokenPayload);
  const fallbackApplicationId = superAdmin ? "" : tokenPayload?.applicationIds?.[0] ?? "";
  const applicationId = requestApplicationId || tenantStore.getApplicationId() || fallbackApplicationId;
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
