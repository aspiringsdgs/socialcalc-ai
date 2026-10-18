/**
 * modules/utils.js, modules/prompts.js and modules/device.js.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { bootEngine, idle, run, cell, captureEditRequest } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let utils: typeof import("../../modules/utils.js");
let prompts: typeof import("../../modules/prompts.js");
let device: typeof import("../../modules/device.js");
let listeners: typeof import("../../modules/listeners.js");
let fmt: typeof import("../../modules/formatting.js");

beforeAll(async () => {
  engine = await bootEngine();
  utils = await import("../../modules/utils.js");
  prompts = await import("../../modules/prompts.js");
  device = await import("../../modules/device.js");
  listeners = await import("../../modules/listeners.js");
  fmt = await import("../../modules/formatting.js");
}, 20000);

afterEach(() => {
  delete (navigator as any).notification;
  document.getElementById("cell-formatting-buttons")?.remove();
});

describe("saveAs", () => {
  it("resolves the typed name, or null on cancel, with the browser prompt", async () => {
    const prompt = vi.spyOn(window, "prompt").mockReturnValueOnce("report").mockReturnValueOnce(null);
    await expect(utils.saveAs()).resolves.toBe("report");
    await expect(utils.saveAs()).resolves.toBeNull();
    prompt.mockRestore();
  });

  it("uses the Cordova dialog when present", async () => {
    let answer: any;
    (navigator as any).notification = { prompt: (_m: string, cb: any) => cb(answer) };
    answer = { buttonIndex: 2, input1: "native-name" };
    await expect(utils.saveAs()).resolves.toBe("native-name");
    answer = { buttonIndex: 1, input1: "ignored" };
    await expect(utils.saveAs()).resolves.toBeNull();
  });
});

describe("old files in localStorage", () => {
  it("lists user files, skips app keys, tolerates bad encodings, and deletes them", async () => {
    // jsdom on this Node version has no Web Storage; give the test an in-memory one
    const store = new Map<string, string>();
    const localStorage = {
      get length() { return store.size; },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    };
    const realStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { value: localStorage, configurable: true });
    try {
    localStorage.setItem("invoice-a", encodeURIComponent("{\"a\":1}"));
    localStorage.setItem("broken-%", "100%");
    localStorage.setItem("logoArray", "x");
    localStorage.setItem("x".repeat(40), "long keys are skipped");
    const files: any = await utils.getAllOldFiles();
    expect(files).toEqual({ "invoice-a": "{\"a\":1}", "broken-%": "100%" });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await utils.deleteAllOldFiles(files);
    log.mockRestore();
    expect(localStorage.getItem("invoice-a")).toBeNull();
    expect(localStorage.getItem("logoArray")).toBe("x");
    } finally {
      if (realStorage) Object.defineProperty(window, "localStorage", realStorage);
      else delete (window as any).localStorage;
    }
  });
});

describe("formatting popup", () => {
  it("applies the chosen formatting and closes", async () => {
    await run(engine, ["set Q5 text t x"]);
    const done = vi.fn();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    utils.showFormattingButtons("Q5", done);
    const popup = document.getElementById("cell-formatting-buttons")!;
    (popup.querySelector('[data-action="bg-color"][data-value="lightyellow"]') as HTMLElement).click();
    (popup.querySelector("#apply-formatting") as HTMLElement).click();
    log.mockRestore();
    await idle(engine);
    expect(document.getElementById("cell-formatting-buttons")).toBeNull();
    expect(done).toHaveBeenCalledTimes(1);
    expect(fmt.getCellFormatting("Q5")?.bgcolor).toBe("lightyellow");
  });

  it("an earlier popup's outside-click listener does not close a later popup", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    utils.showFormattingButtons("Q6");
    await new Promise((r) => setTimeout(r, 120)); // the outside-click listener is installed after 100 ms
    (document.querySelector("#cancel-formatting") as HTMLElement).click();
    const second = vi.fn();
    utils.showFormattingButtons("Q7", second);
    document.body.click(); // within 100 ms: only a leaked listener from the first popup could react
    log.mockRestore();
    expect(document.getElementById("cell-formatting-buttons")).not.toBeNull();
    expect(second).not.toHaveBeenCalled();
  });
});

describe("enhancedShowPrompt", () => {
  it("raises an edit request with the editable text and commits through the hooks", async () => {
    await run(engine, ["set Q10 constant n$ 1500 $1,500"]);
    const editor = engine.runtime.getEditor();
    editor.MoveECell("Q10");
    const detail = captureEditRequest(() => prompts.enhancedShowPrompt("Q10"));
    expect(detail).toMatchObject({ coord: "Q10", text: "$1,500" });

    const remove = listeners.addBeforeCellCommitHook((_c: string, v: any) => v !== "nope");
    try {
      expect(detail.okfn("nope")).toBe(false);
      expect(detail.okfn("$2,000")).toBe(true);
    } finally {
      remove();
    }
    await idle(engine);
    expect(cell(engine, "Q10").datavalue).toBe(2000);
    detail.cleanup();
  });

  it("mustshowprompt always asks on phones", () => {
    expect(prompts.mustshowprompt("A1")).toBe(true);
  });
});

describe("getDeviceType", () => {
  it("recognises iPhone, iPad, Android and falls back to default", () => {
    const ua = vi.spyOn(navigator, "userAgent", "get");
    const cases: [string, string][] = [
      ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)", "iPhone"],
      ["Mozilla/5.0 (iPad; CPU OS 17_0)", "iPad"],
      ["Mozilla/5.0 (Linux; Android 14)", "Android"],
      ["Mozilla/5.0 (Macintosh)", "default"],
    ];
    for (const [agent, expected] of cases) {
      ua.mockReturnValue(agent);
      expect(device.getDeviceType()).toBe(expected);
    }
    ua.mockRestore();
  });
});
