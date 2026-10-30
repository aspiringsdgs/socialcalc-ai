/**
 * Regression: loading, reloading and re-initializing workbooks.
 *
 * - Reloading a workbook renumbered every sheet after the first (sheet1, sheet5, sheet6...),
 *   breaking app mappings and editable-cell locks keyed by sheet id.
 * - Loading while another tab was open put the file's first sheet into that tab's id.
 * - Running initializeApp again (React StrictMode, remounting a page) stacked a second set of
 *   sheet tabs with duplicate ids, and activateFooterButton skipped switches after a load.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, defaultTemplate, idle, run, cell, clickCell, captureEditRequest } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let api: any;

beforeAll(async () => {
  engine = await bootEngine();
  api = await import("../../react.js");
  api.setupMouseListener();
  api.enableCellEditModal();
}, 20000);

const ids = () => Object.keys(engine.control().sheetButtonArr);

describe("reloading a workbook", () => {
  it("keeps the saved sheet ids, however often it is reloaded", async () => {
    expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
    for (let i = 0; i < 3; i++) {
      api.loadWorkbookData(JSON.parse(api.getSpreadsheetContent()));
      await idle(engine);
      expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
    }
  });

  it("puts each sheet's data back under its own id when loaded from another tab", async () => {
    api.activateFooterButton(2);
    await idle(engine);
    await run(engine, ["set B2 text t on-sheet2"]);
    api.activateFooterButton(1);
    await idle(engine);
    await run(engine, ["set B2 text t on-sheet1"]);
    const saved = JSON.parse(api.getSpreadsheetContent());

    api.activateFooterButton(3); // load while the third tab is open
    await idle(engine);
    api.loadWorkbookData(saved);
    await idle(engine);
    await new Promise((r) => setTimeout(r, 250)); // the load activates the saved sheet after 200 ms
    await idle(engine);

    expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
    expect(engine.runtime.getSheet("sheet1").cells.B2.datavalue).toBe("on-sheet1");
    expect(engine.runtime.getSheet("sheet2").cells.B2.datavalue).toBe("on-sheet2");
    expect(api.getCurrentSheet()).toBe(saved.currentid);
  });

  it("gives a sheet added after a reload the next free id", async () => {
    engine.SocialCalc.WorkBookControlAddSheet(true);
    await idle(engine);
    expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4", "sheet5"]);
    api.loadWorkbookData(defaultTemplate);
    await idle(engine);
    expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
  });

  it("activateFooterButton switches after a load without any manual cache reset", async () => {
    api.activateFooterButton(1);
    await idle(engine);
    api.loadWorkbookData(JSON.parse(api.getSpreadsheetContent()));
    await new Promise((r) => setTimeout(r, 250)); // let the load finish opening its saved sheet
    await idle(engine);
    api.activateFooterButton(2);
    await idle(engine);
    expect(api.getCurrentSheet()).toBe("sheet2");
    api.activateFooterButton(1);
    await idle(engine);
    expect(api.getCurrentSheet()).toBe("sheet1");
  });

  it("a tab chosen right after loading is not undone by the load's delayed sheet activation", async () => {
    const saved = JSON.parse(api.getSpreadsheetContent());
    expect(saved.currentid).toBe("sheet1");
    api.loadWorkbookData(saved);
    api.activateFooterButton(3); // what apps do: load, then open their tab immediately
    await new Promise((r) => setTimeout(r, 300)); // past the load's 200 ms activation timer
    await idle(engine);
    expect(api.getCurrentSheet()).toBe("sheet3");
    api.activateFooterButton(1);
    await idle(engine);
  });
});

describe("re-running initializeApp", () => {
  it("leaves one set of sheet tabs with unique ids, and editing still works", async () => {
    api.initializeApp(defaultTemplate);
    await new Promise((r) => setTimeout(r, 400));
    await engine.runtime.whenReady();
    await idle(engine);

    const tabs = document.querySelectorAll("#workbookControl [id^='sheet']");
    const tabIds = Array.from(tabs).map((t) => t.id);
    expect(new Set(tabIds).size).toBe(tabIds.length);
    expect(tabIds.length).toBe(4);
    expect(ids()).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);

    const detail = captureEditRequest(() => clickCell(engine, "C4"));
    expect(detail?.coord).toBe("C4");
    const changes: string[] = [];
    const off = api.setupCellChangeListener((coord: string) => changes.push(coord));
    detail.okfn("works");
    await idle(engine);
    off();
    expect(cell(engine, "C4").datavalue).toBe("works");
    expect(changes).toContain("C4");
  });
});
