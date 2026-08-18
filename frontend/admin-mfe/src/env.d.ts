interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly API_BASE_URL?: string;
  readonly API_PROXY_TARGET?: string;
  readonly VITE_DEMO_SITE_URL?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __ENV__?: {
    VITE_API_BASE_URL?: string;
    API_BASE_URL?: string;
    API_PROXY_TARGET?: string;
    VITE_DEMO_SITE_URL?: string;
    VITE_DEMO_MODE?: string;
  };
}
