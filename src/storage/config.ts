// Storage configuration, read from Vite env (see .env.example).
//
//   VITE_API_BASE_URL     Tornado base URL. Empty (default) = relative URLs, which
//                         the Vite dev proxy forwards to Tornado (see vite.config.ts).
//   VITE_HELIA_BASE_URL   Tornado URL that serves /meshkit-helia/* (default http://localhost:8080).
//                         Cross-origin, so Tornado must allow this app's origin (CORS).
//   VITE_STORAGE_BACKEND  "tornado" (default) or "none" (hides the save/open UI).

export type StorageBackend = "tornado" | "none";

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

export const STORAGE_BACKEND: StorageBackend =
  (import.meta.env.VITE_STORAGE_BACKEND ?? "tornado").trim().toLowerCase() === "none" ? "none" : "tornado";

export const HELIA_BASE_URL: string = (import.meta.env.VITE_HELIA_BASE_URL ?? "http://localhost:8080").trim().replace(/\/+$/, "");
