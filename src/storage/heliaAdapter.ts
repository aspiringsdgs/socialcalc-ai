// Helia (IPFS) storage through Tornado's /meshkit-helia routes. The app never runs Helia itself:
//
//   POST {base}/meshkit-helia/upload         raw bytes          -> {cid}
//   GET  {base}/meshkit-helia/retrieve/<cid> raw bytes
//   GET  {base}/meshkit-helia/list           [{cid, ...}]
//
// Sheets are encrypted in the browser (EMSH: AES-256-GCM + PBKDF2-SHA256, see crypto.ts) before
// upload, so Helia and Tornado only ever see ciphertext. The sheet is the RAW string from
// SocialCalc.WorkBookControlSaveSheet(), UTF-8 encoded, so open() returns it byte-for-byte.

import { decrypt, encrypt } from "./crypto";
import { HELIA_BASE_URL } from "./config";
import { StorageError } from "./tornadoAdapter";

export interface HeliaItem {
  cid: string;
  size?: number;
  uploadedAt?: string;
}

export interface HeliaAdapter {
  /** Encrypt `data` with `passphrase`, upload it, and return the CID. */
  save(data: string, passphrase: string): Promise<string>;
  /** Fetch `cid`, decrypt with `passphrase`, and return the original string. */
  open(cid: string, passphrase: string): Promise<string>;
  list(): Promise<HeliaItem[]>;
}

export interface HeliaOptions {
  baseUrl?: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** PBKDF2 iterations; tests lower it, the default is meshkit's 200,000. */
  iterations?: number;
}

export function createHeliaAdapter(options: HeliaOptions = {}): HeliaAdapter {
  const baseUrl = (options.baseUrl ?? HELIA_BASE_URL).replace(/\/+$/, "");

  async function request(path: string, init?: RequestInit): Promise<Response> {
    const doFetch = options.fetchImpl ?? fetch;
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}/meshkit-helia${path}`, init);
    } catch {
      throw new StorageError("Helia is unreachable", null, "network");
    }
    if (res.ok) return res;
    // 502/503/504 come from Tornado (or a proxy) when the Helia sidecar is down.
    if ([502, 503, 504].includes(res.status)) throw new StorageError("Helia is unreachable", res.status, "network");
    if (res.status === 404) throw new StorageError("CID not found on Helia", 404, "http");
    if (res.status === 413) throw new StorageError("Sheet is too large for Helia", 413, "http");
    throw new StorageError(`Helia request failed (HTTP ${res.status})`, res.status, "http");
  }

  return {
    async save(data, passphrase) {
      const blob = await encrypt(new TextEncoder().encode(data), { password: passphrase, iterations: options.iterations });
      const res = await request("/upload", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob as unknown as BodyInit,
      });
      const body = await res.json().catch(() => null);
      if (!body || typeof body.cid !== "string" || !body.cid) {
        throw new StorageError("Helia upload response did not contain a CID", res.status, "parse");
      }
      return body.cid;
    },
    async open(cid, passphrase) {
      const res = await request(`/retrieve/${encodeURIComponent(cid.trim())}`);
      const blob = new Uint8Array(await res.arrayBuffer());
      return new TextDecoder().decode(await decrypt(blob, passphrase));
    },
    async list() {
      const res = await request("/list");
      const body = await res.json().catch(() => null);
      if (!Array.isArray(body)) throw new StorageError("Unexpected Helia list response", res.status, "parse");
      return body.map((o: any) => ({ cid: o.cid, size: o.size, uploadedAt: o.uploadedAt }));
    },
  };
}

/** Shared adapter configured from Vite env. */
export const heliaAdapter = createHeliaAdapter();

/** User-facing text for a failed Helia call. */
export function describeHeliaError(err: unknown, action: string): string {
  if (err instanceof StorageError) {
    if (err.kind === "network") return "Helia is unreachable. Check that the Tornado stack is running.";
    if (err.kind === "crypto") return `${action} failed: ${err.message}`;
    return `${action} failed${err.status ? ` (HTTP ${err.status})` : ""}: ${err.message}`;
  }
  return `${action} failed: ${err instanceof Error ? err.message : String(err)}`;
}
