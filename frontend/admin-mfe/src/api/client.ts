import axios from "axios";
import { authStore } from "../app/auth";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json"
  }
});

client.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
