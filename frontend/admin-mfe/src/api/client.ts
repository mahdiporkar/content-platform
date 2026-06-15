import axios, { InternalAxiosRequestConfig } from "axios";
import { authStore } from "../app/auth";
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

const shouldSkipApplicationHeader = (path: string): boolean => {
  return (
    path === "/api/v1/auth/login"
  );
};

const isAdminRequest = (path: string): boolean => path.startsWith("/api/v1/admin/") || path === "/api/v1/media" || path.startsWith("/api/v1/media/");

const stripApplicationIdFromAdminRequest = (config: InternalAxiosRequestConfig, path: string) => {
  if (!isAdminRequest(path)) {
    return;
  }
  const params = config.params as Record<string, unknown> | undefined;
  if (params && "applicationId" in params) {
    delete params.applicationId;
  }
  if (config.data instanceof FormData) {
    config.data.delete("applicationId");
    return;
  }
  if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
    delete (config.data as Record<string, unknown>).applicationId;
  }
};

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const requestPath = normalizeRequestPath(config.url);
  stripApplicationIdFromAdminRequest(config, requestPath);
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const applicationId = tenantStore.getApplicationId();
  if (applicationId && !shouldSkipApplicationHeader(requestPath)) {
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
