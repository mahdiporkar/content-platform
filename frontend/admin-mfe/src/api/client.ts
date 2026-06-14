import axios from "axios";
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

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const applicationId = tenantStore.getApplicationId();
  if (applicationId) {
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
