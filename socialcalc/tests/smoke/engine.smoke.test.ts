/**
 * Smoke: the golden path an app relies on, end to end on the real engine.
 * Boot a template, edit through the public API, recalculate, save, reload, undo, switch sheets.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, idle, run, cell, clickCell, captureEditRequest } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let api: any;

beforeAll(async () => {
  engine = await bootEngine();
  api = await import("../../react.js");
  api.setupMouseListener();
  api.enableCellEditModal();
}, 20000);

describe("engine golden path", () => {
  it("boots a multi-sheet template", () => {
    expect(engine.runtime.isReady()).toBe(true);
    expect(api.getWorkbookInfo().numsheets).toBeGreaterThan(1);
    expect(api.getCurrentSheet()).toBe("sheet1");
  });

  it("a cell click raises an edit request and its okfn stores the value", async () => {
    const detail = captureEditRequest(() => clickCell(engine, "J40"));
    expect(detail?.coord).toBe("J40");
    expect(detail.okfn("1,200")).toBe(true);
    await idle(engine);
    expect(cell(engine, "J40").datavalue).toBe(1200);
  });

  it("formulas recalculate after edits made through commitCellEdit", async () => {
    await run(engine, ["set J41 value n 50", "set J42 formula J40+J41"]);
    expect(cell(engine, "J42").datavalue).toBe(1250);
    expect(api.commitCellEdit("J41", "$100")).toBe(true);
    await idle(engine);
    expect(cell(engine, "J42").datavalue).toBe(1300);
  });

  it("saves the workbook and loads it back with the same values", async () => {
    const saved = api.getSpreadsheetContent();
    expect(typeof saved).toBe("string");
    await run(engine, ["set J40 value n 1"]);
    expect(cell(engine, "J40").datavalue).toBe(1);

    api.loadWorkbookData(JSON.parse(saved));
    await idle(engine);
    expect(cell(engine, "J40").datavalue).toBe(1200);
    expect(cell(engine, "J42").datavalue).toBe(1300);
  });

  it("undo and redo walk the history", async () => {
    await run(engine, ["set J43 value n 7"]);
    api.undo();
    await idle(engine);
    expect(cell(engine, "J43")?.datavalue ?? "").toBe("");
    api.redo();
    await idle(engine);
    expect(cell(engine, "J43").datavalue).toBe(7);
  });

  it("switches sheets and back", async () => {
    api.activateFooterButton(2);
    await idle(engine);
    expect(api.getCurrentSheet()).toBe("sheet2");
    api.activateFooterButton(1);
    await idle(engine);
    expect(api.getCurrentSheet()).toBe("sheet1");
  });

  it("exports the active sheet as CSV", () => {
    const csv = api.getCSVContent();
    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  });
});
