/**
 * View plugins on the real engine: grid lines, row/column headers (selection, row inserts,
 * column widths), horizontal scroll and touch scroll.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { bootEngine, idle, run, cell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let grid: typeof import("../../modules/grid-lines.js");
let headers: typeof import("../../modules/row-col-headers.js");
let hscroll: typeof import("../../modules/horizontal-scroll.js");
let touch: typeof import("../../modules/touch-scroll.js");
let plugins: typeof import("../../modules/plugin-manager.js");

beforeAll(async () => {
  engine = await bootEngine();
  grid = await import("../../modules/grid-lines.js");
  headers = await import("../../modules/row-col-headers.js");
  hscroll = await import("../../modules/horizontal-scroll.js");
  touch = await import("../../modules/touch-scroll.js");
  plugins = await import("../../modules/plugin-manager.js");
}, 20000);

describe("grid lines", () => {
  it("turns the grid on with custom CSS and off again", async () => {
    const editor = engine.runtime.getEditor();
    grid.enableGridLines("1px dotted #999;");
    expect(grid.isGridLinesEnabled()).toBe(true);
    expect(editor.context.showGrid).toBe(true);
    expect(editor.context.gridCSS).toBe("1px dotted #999;");
    expect(grid.toggleGridLines()).toBe(false);
    expect(editor.context.showGrid).toBe(false);
    expect(plugins.isPluginEnabled("gridLines")).toBe(false);
    await idle(engine);
  });
});

describe("row and column headers", () => {
  it("shows and hides headers", async () => {
    const SC = engine.SocialCalc;
    headers.enableRowColHeaders();
    expect(headers.isRowColHeadersEnabled()).toBe(true);
    expect(SC.Constants.SCNoColNames).toBe(false);
    expect(engine.runtime.getEditor().context.showRCHeaders).toBe(true);
    await idle(engine);
    expect(headers.toggleRowColHeaders()).toBe(false);
    expect(SC.Constants.SCNoColNames).toBe(true);
    await idle(engine);
  });

  it("selects a whole row or column", () => {
    const editor = engine.runtime.getEditor();
    headers.selectRow(3);
    expect(editor.range).toMatchObject({ hasrange: true, top: 3, bottom: 3, left: 1 });
    headers.selectColumn(2);
    expect(editor.range).toMatchObject({ hasrange: true, left: 2, right: 2, top: 1 });
    editor.RangeRemove();
  });

  it("inserts and deletes rows, shifting values and formulas", async () => {
    await run(engine, ["set N50 value n 5", "set N52 formula N50*2"]);
    headers.insertRowBelow(50);
    await idle(engine);
    expect(cell(engine, "N50").datavalue).toBe(5);
    expect(cell(engine, "N53").formula).toBe("N50*2");
    headers.deleteRowAt(51);
    await idle(engine);
    expect(cell(engine, "N52").formula).toBe("N50*2");
    expect(cell(engine, "N52").datavalue).toBe(10);
  });

  it("sets column widths and clamps them to the minimum", async () => {
    headers.setColumnWidth(14, 140);
    await idle(engine);
    expect(engine.runtime.getSheet().colattribs.width.N).toBe("140");
    headers.setColumnWidth(14, 1);
    await idle(engine);
    const min = engine.SocialCalc.Constants.defaultMinimumColWidth || 10;
    expect(Number(engine.runtime.getSheet().colattribs.width.N)).toBe(min);
  });

  it("executeSheetCommand accepts a command string or a Parse object", async () => {
    headers.executeSheetCommand("set N60 value n 1");
    headers.executeSheetCommand(new engine.SocialCalc.Parse("set N61 value n 2"));
    await idle(engine);
    expect(cell(engine, "N60").datavalue).toBe(1);
    expect(cell(engine, "N61").datavalue).toBe(2);
  });
});

describe("horizontal scroll", () => {
  it("reports scroll info and column letters", () => {
    const info = hscroll.getHorizontalScrollInfo();
    expect(info.currentFirstCol).toBeGreaterThanOrEqual(1);
    expect(info.totalCols).toBeGreaterThanOrEqual(26);
    expect(hscroll.getColumnLetter(1)).toBe("A");
    expect(hscroll.getColumnLetter(27)).toBe("AA");
  });

  it("scrolls to a column and notifies subscribers", async () => {
    const seen: number[] = [];
    const off = hscroll.subscribeHorizontalScroll((info: any) => seen.push(info.currentFirstCol));
    try {
      hscroll.scrollToColumn(5);
      await idle(engine);
      expect(hscroll.getHorizontalScrollInfo().currentFirstCol).toBe(5);
      expect(seen).toContain(5);
      hscroll.scrollHorizontalBy(-4);
      await idle(engine);
      expect(hscroll.getHorizontalScrollInfo().currentFirstCol).toBe(1);
    } finally {
      off();
    }
    hscroll.scrollToColumn(3);
    await idle(engine);
    expect(seen).not.toContain(3);
    hscroll.scrollToColumn(1);
    await idle(engine);
  });

  it("notifies when the grid scrolls by other means (keyboard, selection)", async () => {
    const seen: number[] = [];
    const off = hscroll.subscribeHorizontalScroll((info: any) => seen.push(info.currentFirstCol));
    try {
      engine.runtime.getEditor().ScrollRelativeBoth(0, 3);
      await idle(engine);
      expect(seen.length).toBeGreaterThan(0);
      expect(seen[seen.length - 1]).toBe(hscroll.getHorizontalScrollInfo().currentFirstCol);
    } finally {
      off();
      hscroll.scrollToColumn(1);
      await idle(engine);
    }
  });

  it("mounts and unmounts the vanilla slider bar", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    hscroll.enableHorizontalScroll({ container: host });
    expect(hscroll.isHorizontalScrollEnabled()).toBe(true);
    const slider = host.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();
    slider.value = "4";
    slider.dispatchEvent(new Event("input"));
    await idle(engine);
    expect(hscroll.getHorizontalScrollInfo().currentFirstCol).toBe(4);
    hscroll.disableHorizontalScroll();
    expect(host.querySelector(".sc-horizontal-scroll-bar")).toBeNull();
    hscroll.scrollToColumn(1);
    await idle(engine);
    host.remove();
  });
});

describe("touch scroll", () => {
  it("enables, disables, toggles and swaps the engine handlers", () => {
    const SC = engine.SocialCalc;
    SC.HasTouch = true;
    const original = SC.ProcessTouchStart;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      touch.enableTouchScroll();
      expect(touch.isTouchScrollEnabled()).toBe(true);
      expect(SC.ProcessTouchStart).not.toBe(original);
      expect(touch.toggleTouchScroll()).toBe(false);
      expect(SC.ProcessTouchStart).toBe(original);
    } finally {
      log.mockRestore();
    }
  });

  it("configureTouchScroll changes the tap tolerance", () => {
    const SC = engine.SocialCalc;
    SC.HasTouch = true;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const find = vi.spyOn(SC, "FindTouchElement").mockReturnValue(null);
    const realElementFromPoint = (document as any).elementFromPoint;
    (document as any).elementFromPoint = () => null;
    touch.enableTouchScroll();
    const swipe = () => {
      SC.ProcessTouchStart({ touches: [{ pageX: 0, pageY: 0, clientX: 0, clientY: 0 }] });
      SC.ProcessTouchEnd({ touches: [], changedTouches: [{ pageX: 40, pageY: 0, clientX: 40, clientY: 0 }] });
    };
    try {
      swipe();
      expect(find).not.toHaveBeenCalled();
      touch.configureTouchScroll({ tapMaxDistance: 100 });
      swipe();
      expect(find).toHaveBeenCalled();
    } finally {
      touch.configureTouchScroll({ tapMaxDistance: 12 });
      touch.disableTouchScroll();
      find.mockRestore();
      log.mockRestore();
      (document as any).elementFromPoint = realElementFromPoint;
    }
  });
});
