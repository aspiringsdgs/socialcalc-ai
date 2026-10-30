// Client for the Tornado JSON Sheets API (tornado_version: handlers/sheets_api.py).
//
// Sheets are stored as the RAW string returned by SocialCalc.WorkBookControlSaveSheet()
// (AppGeneral.getSpreadsheetContent()). The server treats it as an opaque string.

import { API_BASE_URL } from "./config";

export interface SheetInfo {
  name: string;
  size: number;
  /** ISO-8601 UTC, e.g. 2026-10-04T11:09:59Z */
  modified: string;
}

export type StorageErrorKind = "http" | "network" | "parse";

/** Failure talking to the backend. `status` is the HTTP status, or null when none was received. */
export class StorageError extends Error {
  readonly status: number | null;
  readonly kind: StorageErrorKind;

  constructor(message: string, status: number | null, kind: StorageErrorKind) {
    super(message);
    this.name = "StorageError";
    this.status = status;
    this.kind = kind;
  }
}

export interface TornadoAdapter {
  login(email: string, password: string): Promise<{ ok: true; user: string }>;
  logout(): Promise<void>;
  list(): Promise<SheetInfo[]>;
  load(name: string): Promise<{ name: string; data: string }>;
  save(name: string, data: string): Promise<void>;
  remove(name: string): Promise<void>;
}

export interface AdapterOptions {
  baseUrl?: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export function createTornadoAdapter(options: AdapterOptions = {}): TornadoAdapter {
  const baseUrl = (options.baseUrl ?? API_BASE_URL).replace(/\/+$/, "");

  async function request(method: string, path: string, body?: unknown): Promise<any> {
    const doFetch = options.fetchImpl ?? fetch;
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new StorageError("Backend unreachable", null, "network");
    }

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        if (err && typeof err.error === "string") message = err.error;
      } catch {
        // The API always answers errors with JSON. A 5xx without a JSON body comes from a
        // proxy/gateway in front of a dead backend (e.g. the Vite dev proxy answers 500 with an
        // empty body when Tornado is down), so treat it as unreachable.
        if (res.status >= 500) throw new StorageError("Backend unreachable", res.status, "network");
      }
      throw new StorageError(message, res.status, "http");
    }

    if (res.status === 204) return undefined;
    try {
      return await res.json();
    } catch {
      // e.g. a dev server answering with index.html when the proxy is not set up
      throw new StorageError("Unexpected (non-JSON) response from backend", res.status, "parse");
    }
  }

  const sheetPath = (name: string) => `/api/sheets/${encodeURIComponent(name)}`;

  return {
    login: (email, password) => request("POST", "/api/login", { email, password }),
    async logout() {
      await request("POST", "/api/logout", {});
    },
    async list() {
      const sheets = await request("GET", "/api/sheets");
      if (!Array.isArray(sheets)) throw new StorageError("Unexpected response from backend", 200, "parse");
      return sheets as SheetInfo[];
    },
    async load(name) {
      const res = await request("GET", sheetPath(name));
      if (!res || typeof res.data !== "string") throw new StorageError("Unexpected response from backend", 200, "parse");
      return { name: res.name ?? name, data: res.data };
    },
    async save(name, data) {
      await request("PUT", sheetPath(name), { data });
    },
    async remove(name) {
      await request("DELETE", sheetPath(name));
    },
  };
}

/** Shared adapter configured from Vite env. */
export const tornadoAdapter = createTornadoAdapter();

/** User-facing text for a failed storage call, always including the HTTP status when there is one. */
export function describeStorageError(err: unknown, action: string): string {
  if (err instanceof StorageError) {
    if (err.kind === "network") return "Backend unreachable";
    if (err.status === 401) return "Please log in (HTTP 401)";
    if (err.status === 404) return `${action} failed (HTTP 404): sheet not found`;
    return `${action} failed (HTTP ${err.status}): ${err.message}`;
  }
  return `${action} failed: ${err instanceof Error ? err.message : String(err)}`;
}
