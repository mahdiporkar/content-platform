const TOKEN_KEY = "content-platform-token";

export type AdminTokenPayload = {
  sub?: string;
  email?: string;
  role?: "super_admin" | "editor" | "publisher";
  applicationIds?: string[];
  systemPermissions?: string[];
  servicePermissions?: string[];
  exp?: number;
  iat?: number;
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
