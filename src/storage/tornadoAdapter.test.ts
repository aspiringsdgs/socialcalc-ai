import { describe, it, expect, vi } from "vitest";
import { createTornadoAdapter, describeStorageError, StorageError } from "./tornadoAdapter";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function adapterWith(impl: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchImpl = vi.fn(impl as any) as unknown as typeof fetch;
  return { adapter: createTornadoAdapter({ baseUrl: "http://api.test/", fetchImpl }), fetchImpl: fetchImpl as any };
}

const caught = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as StorageError;
  }
  throw new Error("expected rejection");
};

describe("tornadoAdapter", () => {
  describe("success", () => {
    it("login posts credentials as JSON with credentials:include", async () => {
      const { adapter, fetchImpl } = adapterWith(async () => json({ ok: true, user: "a@b.c" }));
      expect(await adapter.login("a@b.c", "pw")).toEqual({ ok: true, user: "a@b.c" });
      const [url, init] = fetchImpl.mock.calls[0];
      expect(url).toBe("http://api.test/api/login");
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(init.body)).toEqual({ email: "a@b.c", password: "pw" });
    });

    it("list returns the array", async () => {
      const rows = [{ name: "s1", size: 10, modified: "2026-01-01T00:00:00Z" }];
      const { adapter } = adapterWith(async () => json(rows));
      expect(await adapter.list()).toEqual(rows);
    });

    it("load GETs the encoded name and returns the raw data string", async () => {
      const { adapter, fetchImpl } = adapterWith(async () => json({ name: "my sheet", data: "RAW" }));
      expect(await adapter.load("my sheet")).toEqual({ name: "my sheet", data: "RAW" });
      expect(fetchImpl.mock.calls[0][0]).toBe("http://api.test/api/sheets/my%20sheet");
    });

    it("save PUTs {data} untouched", async () => {
      const raw = '{"numsheets":1,"x":"a\\nb"}';
      const { adapter, fetchImpl } = adapterWith(async () => json({ ok: true, name: "s1" }, 201));
      await adapter.save("s1", raw);
      const [url, init] = fetchImpl.mock.calls[0];
      expect(url).toBe("http://api.test/api/sheets/s1");
      expect(init.method).toBe("PUT");
      expect(JSON.parse(init.body)).toEqual({ data: raw });
    });

    it("remove handles 204 No Content", async () => {
      const { adapter, fetchImpl } = adapterWith(async () => new Response(null, { status: 204 }));
      await expect(adapter.remove("s1")).resolves.toBeUndefined();
      expect(fetchImpl.mock.calls[0][1].method).toBe("DELETE");
    });

    it("logout posts to /api/logout", async () => {
      const { adapter, fetchImpl } = adapterWith(async () => json({ ok: true }));
      await adapter.logout();
      expect(fetchImpl.mock.calls[0][0]).toBe("http://api.test/api/logout");
    });
  });

  describe("errors", () => {
    it("401 -> StorageError(status 401) and 'Please log in'", async () => {
      const { adapter } = adapterWith(async () => json({ error: "authentication required" }, 401));
      const err = await caught(adapter.list());
      expect(err).toBeInstanceOf(StorageError);
      expect(err.status).toBe(401);
      expect(err.kind).toBe("http");
      expect(err.message).toBe("authentication required");
      expect(describeStorageError(err, "Open")).toContain("Please log in");
    });

    it("404 -> StorageError(status 404)", async () => {
      const { adapter } = adapterWith(async () => json({ error: "sheet not found" }, 404));
      const err = await caught(adapter.load("nope"));
      expect(err.status).toBe(404);
      expect(describeStorageError(err, "Open")).toContain("HTTP 404");
    });

    it("500 -> StorageError(status 500) with server message", async () => {
      const { adapter } = adapterWith(async () => json({ error: "storage write failed" }, 500));
      const err = await caught(adapter.save("s1", "x"));
      expect(err.status).toBe(500);
      expect(describeStorageError(err, "Save")).toBe("Save failed (HTTP 500): storage write failed");
    });

    it("non-JSON 4xx body falls back to 'HTTP <status>'", async () => {
      const { adapter } = adapterWith(async () => new Response("<html>nope</html>", { status: 403 }));
      const err = await caught(adapter.list());
      expect(err.kind).toBe("http");
      expect(err.status).toBe(403);
      expect(err.message).toBe("HTTP 403");
    });

    it("5xx with a non-JSON body (proxy/gateway, backend down) -> 'Backend unreachable'", async () => {
      for (const status of [500, 502, 503, 504]) {
        const { adapter } = adapterWith(async () => new Response("", { status }));
        const err = await caught(adapter.save("s1", "x"));
        expect(err.kind).toBe("network");
        expect(err.status).toBe(status);
        expect(describeStorageError(err, "Save")).toBe("Backend unreachable");
      }
    });

    it("network failure -> kind 'network', status null, 'Backend unreachable'", async () => {
      const { adapter } = adapterWith(async () => {
        throw new TypeError("Failed to fetch");
      });
      const err = await caught(adapter.save("s1", "x"));
      expect(err.kind).toBe("network");
      expect(err.status).toBeNull();
      expect(describeStorageError(err, "Save")).toBe("Backend unreachable");
    });

    it("200 with an HTML body (proxy not configured) -> parse error, not a silent success", async () => {
      const { adapter } = adapterWith(async () => new Response("<!doctype html>", { status: 200 }));
      const err = await caught(adapter.list());
      expect(err.kind).toBe("parse");
    });
  });
});
