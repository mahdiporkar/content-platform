interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly API_BASE_URL?: string;
  readonly API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __ENV__?: {
    VITE_API_BASE_URL?: string;
    API_BASE_URL?: string;
    API_PROXY_TARGET?: string;
  };
}
