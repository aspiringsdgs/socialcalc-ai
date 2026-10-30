/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Tornado base URL; empty = relative URLs via the Vite dev proxy */
  readonly VITE_API_BASE_URL?: string;
  /** Tornado URL serving /meshkit-helia/*; default http://localhost:8080 */
  readonly VITE_HELIA_BASE_URL?: string;
  /** "tornado" (default) or "none" */
  readonly VITE_STORAGE_BACKEND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
