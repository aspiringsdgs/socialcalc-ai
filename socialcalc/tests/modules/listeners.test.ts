/**
 * modules/listeners.js: the edit-modal plugin, cell-change subscriptions, before-commit hooks
 * and commitCellEdit, on the real engine.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { bootEngine, idle, run, cell, clickCell, captureEditRequest } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let listeners: typeof import("../../modules/listeners.js");
let editable: typeof import("../../modules/editable-cells.js");
let plugins: typeof import("../../modules/plugin-manager.js");

beforeAll(async () => {
  engine = await bootEngine();
  listeners = await import("../../modules/listeners.js");
  editable = await import("../../modules/editable-cells.js");
  plugins = await import("../../modules/plugin-manager.js");
  listeners.setupMouseListener();
}, 20000);

afterEach(async () => {
  listeners.enableCellEditModal();
  editable.disableEditableCellsOnly();
  await idle(engine);
});

describe("cell edit modal plugin", () => {
  it("is registered with the plugin manager and toggles", () => {
    expect(plugins.isPluginEnabled("cellEditModal")).toBe(listeners.isCellEditModalEnabled());
    expect(listeners.toggleCellEditModal(false)).toBe(false);
    expect(plugins.isPluginEnabled("cellEditModal")).toBe(false);
    expect(listeners.toggleCellEditModal()).toBe(true);
  });

  it("raises an edit request on click only while enabled", () => {
    listeners.enableCellEditModal();
    expect(captureEditRequest(() => clickCell(engine, "L5"))?.coord).toBe("L5");
    listeners.disableCellEditModal();
    expect(captureEditRequest(() => clickCell(engine, "L6"))).toBeNull();
  });

  it("respects editable-cells-only mode", () => {
    const SC = engine.SocialCalc;
    const saved = SC.EditableCells;
    SC.EditableCells = { allow: true, cells: { "sheet1!L7": true }, constraints: {} };
    editable.enableEditableCellsOnly();
    try {
      expect(captureEditRequest(() => clickCell(engine, "L7"))?.coord).toBe("L7");
      expect(captureEditRequest(() => clickCell(engine, "L8"))).toBeNull();
    } finally {
      SC.EditableCells = saved;
    }
  });

  it("the request carries a cleanup that re-renders", () => {
    const detail = captureEditRequest(() => clickCell(engine, "L9"));
    const editor = engine.runtime.getEditor();
    const spy = vi.spyOn(editor, "ScheduleRender");
    detail.cleanup();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("setupCellChangeListener", () => {
  it("reports changed cells until unsubscribed", async () => {
    const seen: string[] = [];
    const off = listeners.setupCellChangeListener((coord: string) => seen.push(coord));
    await run(engine, ["set L10 value n 1"]);
    expect(seen).toContain("L10");
    off();
    await run(engine, ["set L11 value n 1"]);
    expect(seen).not.toContain("L11");
  });
});

describe("before-commit hooks", () => {
  it("receive coord and value, can be removed, and a throwing hook does not block", async () => {
    const calls: any[] = [];
    const remove = listeners.addBeforeCellCommitHook((coord: string, value: any) => {
      calls.push([coord, value]);
    });
    const removeThrowing = listeners.addBeforeCellCommitHook(() => {
      throw new Error("hook bug");
    });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(listeners.commitCellEdit("L12", "ok")).toBe(true);
      await idle(engine);
      expect(calls).toEqual([["L12", "ok"]]);
      expect(cell(engine, "L12").datavalue).toBe("ok");
    } finally {
      remove();
      removeThrowing();
      err.mockRestore();
    }
    listeners.commitCellEdit("L13", "again");
    await idle(engine);
    expect(calls).toHaveLength(1);
  });

  it("are not run for formatting-only commits", async () => {
    const hook = vi.fn(() => false);
    const remove = listeners.addBeforeCellCommitHook(hook);
    try {
      expect(listeners.commitCellEdit("L14", undefined, { bgColor: "lightpink" })).toBe(true);
      await idle(engine);
      expect(hook).not.toHaveBeenCalled();
    } finally {
      remove();
    }
  });
});

describe("commitCellEdit", () => {
  it("detects typed values by default and can store raw text", async () => {
    listeners.commitCellEdit("L15", "$1,200");
    listeners.commitCellEdit("L16", "$1,200", undefined, { detectTypes: false });
    await idle(engine);
    expect(cell(engine, "L15").datavalue).toBe(1200);
    expect(cell(engine, "L16").datavalue).toBe("$1,200");
  });

  it("stores formulas, HTML and empty values", async () => {
    listeners.commitCellEdit("L17", "=2*21");
    listeners.commitCellEdit("L18", "<b>bold</b>");
    await run(engine, ["set L19 value n 5"]);
    listeners.commitCellEdit("L19", "");
    await idle(engine);
    expect(cell(engine, "L17").datavalue).toBe(42);
    expect(cell(engine, "L18").datavalue).toBe("<b>bold</b>");
    expect(engine.runtime.getSheet().valueformats[cell(engine, "L18").textvalueformat]).toBe("text-html");
    expect(cell(engine, "L19")?.datavalue ?? "").toBe("");
  });

  it("keeps text with colons, backslashes and newlines intact", async () => {
    const text = "Path: C:\\new\nsecond line";
    listeners.commitCellEdit("L20", text);
    await idle(engine);
    expect(cell(engine, "L20").datavalue).toBe(text);
  });
});
