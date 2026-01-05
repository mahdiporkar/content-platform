import axios from "axios";
import { authStore } from "../app/auth";
import { tenantStore } from "../app/tenantStore";

const client = axios.create({
  baseURL: process.env.API_BASE_URL || "/",
  headers: {
    "Content-Type": "application/json"
  }
});

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

export default client;
