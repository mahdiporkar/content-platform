type EnvironmentKey = "VITE_API_BASE_URL" | "API_BASE_URL" | "API_PROXY_TARGET" | "VITE_DEMO_MODE" | "VITE_DEMO_SITE_URL";

const runtimeEnv = window.__ENV__ ?? {};

const buildEnv: Partial<Record<EnvironmentKey, string>> = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL: import.meta.env.API_BASE_URL,
  API_PROXY_TARGET: import.meta.env.API_PROXY_TARGET,
  VITE_DEMO_MODE: import.meta.env.VITE_DEMO_MODE,
  VITE_DEMO_SITE_URL: import.meta.env.VITE_DEMO_SITE_URL
};

const readEnv = (key: EnvironmentKey): string | undefined => {
  const value = runtimeEnv[key]?.trim() || buildEnv[key]?.trim();
  return value || undefined;
};

export const apiBaseUrl =
  readEnv("VITE_API_BASE_URL") ??
  readEnv("API_BASE_URL") ??
  "http://localhost:3001";

export const apiProxyTarget =
  readEnv("API_PROXY_TARGET") ??
  readEnv("API_BASE_URL") ??
  "http://localhost:3001";

export const demoModeEnabled = readEnv("VITE_DEMO_MODE") === "true";
export const demoSiteUrl = readEnv("VITE_DEMO_SITE_URL") ?? "http://localhost:3003";
