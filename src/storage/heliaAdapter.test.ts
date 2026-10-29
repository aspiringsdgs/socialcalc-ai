import { describe, it, expect, vi } from "vitest";
import { createHeliaAdapter, describeHeliaError } from "./heliaAdapter";
import { isEncryptedPayload } from "./crypto";
import { StorageError } from "./tornadoAdapter";

const FAST = 1_000;
const SHEET = "version:1.5\ncell:A1:v:1\nsheet:c:1:r:1\n✓ ünïcode";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A fake Helia: stores whatever is POSTed and serves it back by CID. */
function fakeHelia() {
  const store = new Map<string, Uint8Array>();
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace("http://tornado.test/meshkit-helia", "");
    if (path === "/upload") {
      const bytes = new Uint8Array(init!.body as Uint8Array);
      const cid = `bafy${store.size}`;
      store.set(cid, bytes);
      return json({ cid });
    }
    if (path === "/list") return json([...store.keys()].map((cid) => ({ cid })));
    const m = path.match(/^\/retrieve\/(.+)$/);
    if (m && store.has(m[1])) return new Response(store.get(m[1])!);
    return new Response("nope", { status: 404 });
  });
  const adapter = createHeliaAdapter({ baseUrl: "http://tornado.test/", fetchImpl: fetchImpl as any, iterations: FAST });
  return { adapter, store, fetchImpl };
}

const caught = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as StorageError;
  }
  throw new Error("expected rejection");
};

describe("heliaAdapter", () => {
  it("save uploads an EMSH blob (never plaintext) and returns the CID", async () => {
    const { adapter, store, fetchImpl } = fakeHelia();
    const cid = await adapter.save(SHEET, "pw");
    expect(cid).toBe("bafy0");
    const [url, init] = fetchImpl.mock.calls[0] as any;
    expect(url).toBe("http://tornado.test/meshkit-helia/upload");
    expect(init.method).toBe("POST");
    const sent = store.get(cid)!;
    expect(isEncryptedPayload(sent)).toBe(true);
    expect(new TextDecoder().decode(sent)).not.toContain("cell:A1");
  });

  it("save then open returns the identical string", async () => {
    const { adapter } = fakeHelia();
    const cid = await adapter.save(SHEET, "pw");
    expect(await adapter.open(cid, "pw")).toBe(SHEET);
  });

  it("open fetches /retrieve/<encoded cid> and trims whitespace", async () => {
    const { adapter, fetchImpl } = fakeHelia();
    const cid = await adapter.save(SHEET, "pw");
    await adapter.open(`  ${cid}\n`, "pw");
    expect((fetchImpl.mock.calls[fetchImpl.mock.calls.length - 1] as any)[0]).toBe(`http://tornado.test/meshkit-helia/retrieve/${cid}`);
  });

  it("open with the wrong passphrase fails with a crypto error", async () => {
    const { adapter } = fakeHelia();
    const cid = await adapter.save(SHEET, "pw");
    const err = await caught(adapter.open(cid, "wrong"));
    expect(err.kind).toBe("crypto");
    expect(err.message).toMatch(/wrong passphrase/);
  });

  it("open of an unknown CID is a 404", async () => {
    const { adapter } = fakeHelia();
    const err = await caught(adapter.open("bafyMissing", "pw"));
    expect(err.status).toBe(404);
    expect(describeHeliaError(err, "Open")).toMatch(/not found/);
  });

  it("open of a plaintext (non-EMSH) object reports it is not encrypted", async () => {
    const fetchImpl = vi.fn(async () => new Response("plain text, definitely not EMSH ".repeat(3)));
    const adapter = createHeliaAdapter({ baseUrl: "http://t", fetchImpl: fetchImpl as any });
    const err = await caught(adapter.open("x", "pw"));
    expect(err.kind).toBe("crypto");
  });

  it("list returns the CIDs", async () => {
    const { adapter } = fakeHelia();
    await adapter.save("a", "pw");
    await adapter.save("b", "pw");
    expect((await adapter.list()).map((i) => i.cid)).toEqual(["bafy0", "bafy1"]);
  });

  describe("Helia unreachable", () => {
    it("a network failure gives a clear error on save, open and list", async () => {
      const fetchImpl = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      });
      const adapter = createHeliaAdapter({ baseUrl: "http://down", fetchImpl: fetchImpl as any, iterations: FAST });
      for (const call of [() => adapter.save("x", "pw"), () => adapter.open("c", "pw"), () => adapter.list()]) {
        const err = await caught(call());
        expect(err.kind).toBe("network");
        expect(describeHeliaError(err, "Save")).toBe("Helia is unreachable. Check that the Tornado stack is running.");
      }
    });

    it.each([502, 503, 504])("HTTP %i from Tornado means unreachable", async (status) => {
      const adapter = createHeliaAdapter({
        baseUrl: "http://t",
        fetchImpl: (async () => new Response("bad gateway", { status })) as any,
        iterations: FAST,
      });
      const err = await caught(adapter.save("x", "pw"));
      expect(err.kind).toBe("network");
      expect(err.status).toBe(status);
    });

    it("other HTTP errors keep their status", async () => {
      const adapter = createHeliaAdapter({
        baseUrl: "http://t",
        fetchImpl: (async () => new Response("", { status: 413 })) as any,
        iterations: FAST,
      });
      const err = await caught(adapter.save("x", "pw"));
      expect(err.kind).toBe("http");
      expect(describeHeliaError(err, "Save")).toBe("Save failed (HTTP 413): Sheet is too large for Helia");
    });
  });

  it("rejects an upload response with no CID", async () => {
    const adapter = createHeliaAdapter({ baseUrl: "http://t", fetchImpl: (async () => json({})) as any, iterations: FAST });
    expect((await caught(adapter.save("x", "pw"))).kind).toBe("parse");
  });

  it("an empty passphrase is rejected before any request", async () => {
    const { adapter, fetchImpl } = fakeHelia();
    expect((await caught(adapter.save("x", ""))).kind).toBe("crypto");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
