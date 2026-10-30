/**
 * modules/sheets.js, modules/history.js and modules/init.js on the real engine.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, idle, run, cell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let sheets: typeof import("../../modules/sheets.js");
let history: typeof import("../../modules/history.js");

beforeAll(async () => {
  engine = await bootEngine();
  sheets = await import("../../modules/sheets.js");
  history = await import("../../modules/history.js");
}, 20000);

describe("workbook info", () => {
  it("lists sheets and the active one", () => {
    const info = sheets.getWorkbookInfo();
    expect(info.numsheets).toBe(4);
    expect(info.sheets).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
    expect(sheets.getCurrentSheet()).toBe("sheet1");
  });

  it("getAllSheetsData renders every sheet and returns to the active one", async () => {
    const data = sheets.getAllSheetsData();
    await idle(engine);
    expect(data.map((d: any) => d.id)).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
    expect(data.every((d: any) => typeof d.htmlContent === "string" && d.htmlContent.length > 0)).toBe(true);
    expect(data[0].title).toBe(engine.runtime.getSheetName("sheet1"));
    expect(sheets.getCurrentSheet()).toBe("sheet1");
  });

  it("getCurrentHTMLContent and getAllHTMLContent include cell values", async () => {
    await run(engine, ["set M5 text t html-marker"]);
    expect(sheets.getCurrentHTMLContent()).toContain("html-marker");
    expect(String(sheets.getAllHTMLContent())).toContain("html-marker");
  });
});

describe("activateFooterButton", () => {
  it("switches by 1-based tab index and ignores out-of-range indexes", async () => {
    sheets.activateFooterButton(3);
    await idle(engine);
    expect(sheets.getCurrentSheet()).toBe("sheet3");
    sheets.activateFooterButton(99);
    await idle(engine);
    expect(sheets.getCurrentSheet()).toBe("sheet3");
    sheets.activateFooterButton(1);
    await idle(engine);
    expect(sheets.getCurrentSheet()).toBe("sheet1");
  });
});

describe("save and load", () => {
  it("getSpreadsheetContent round-trips through loadWorkbookData", async () => {
    await run(engine, ["set M6 value n 6", "set M7 formula M6*2"]);
    const saved = sheets.getSpreadsheetContent();
    await run(engine, ["set M6 value n 0"]);
    sheets.loadWorkbookData(JSON.parse(saved));
    await idle(engine);
    expect(cell(engine, "M6").datavalue).toBe(6);
    expect(cell(engine, "M7").datavalue).toBe(12);
    expect(sheets.getWorkbookInfo().sheets).toEqual(["sheet1", "sheet2", "sheet3", "sheet4"]);
  });
});

describe("undo / redo", () => {
  it("undoes and redoes several steps in order", async () => {
    await run(engine, ["set M10 value n 1"]);
    await run(engine, ["set M10 value n 2"]);
    await run(engine, ["set M10 value n 3"]);
    history.undo();
    await idle(engine);
    expect(cell(engine, "M10").datavalue).toBe(2);
    history.undo();
    await idle(engine);
    expect(cell(engine, "M10").datavalue).toBe(1);
    history.redo();
    await idle(engine);
    expect(cell(engine, "M10").datavalue).toBe(2);
  });

  it("redo with nothing to redo leaves the sheet unchanged", async () => {
    await run(engine, ["set M11 value n 9"]);
    history.redo();
    await idle(engine);
    expect(cell(engine, "M11").datavalue).toBe(9);
  });
});
