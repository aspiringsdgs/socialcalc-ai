/**
 * Regression tests for cell editing and host (React) synchronization against the real engine.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { bootEngine, waitUntil } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let listeners: typeof import("../../modules/listeners.js");
let formatting: typeof import("../../modules/formatting.js");
let headers: typeof import("../../modules/row-col-headers.js");
let sheets: typeof import("../../modules/sheets.js");
let history: typeof import("../../modules/history.js");
let plugins: typeof import("../../modules/plugin-manager.js");
let grid: typeof import("../../modules/grid-lines.js");
let touch: typeof import("../../modules/touch-scroll.js");
let utils: typeof import("../../modules/utils.js");
let prompts: typeof import("../../modules/prompts.js");

const idle = () =>
  waitUntil(() => {
    const editor = engine.runtime.getEditor();
    return !!editor && !editor.busy && editor.deferredCommands.length === 0;
  });

const run = async (cmds: string[]) => {
  await engine.runtime.runCommands(cmds);
  await idle();
};

/** Simulates a click on a grid cell: the layout-free jsdom grid gets a stubbed hit test. */
function clickCell(coord: string, target?: HTMLElement) {
  const SC = engine.SocialCalc;
  const editor = engine.runtime.getEditor();
  const cr = SC.coordToCr(coord);
  const realGridMousePosition = SC.GridMousePosition;
  SC.GridMousePosition = () => ({ coord, row: cr.row, col: cr.col });
  const el = target || editor.fullgrid;
  try {
    SC.ProcessEditorMouseDown({
      target: el,
      clientX: 0,
      clientY: 0,
      shiftKey: false,
      stopPropagation() {},
      preventDefault() {},
    });
    SC.ProcessEditorMouseUp && SC.ProcessEditorMouseUp({ target: el, clientX: 0, clientY: 0 });
  } finally {
    SC.GridMousePosition = realGridMousePosition;
  }
}

function captureEditRequest(fn: () => void) {
  let detail: any = null;
  const handler = (e: any) => (detail = e.detail);
  window.addEventListener("socialcalc:cell-edit-request", handler);
  try {
    fn();
  } finally {
    window.removeEventListener("socialcalc:cell-edit-request", handler);
  }
  return detail;
}

beforeAll(async () => {
  engine = await bootEngine();
  listeners = await import("../../modules/listeners.js");
  formatting = await import("../../modules/formatting.js");
  headers = await import("../../modules/row-col-headers.js");
  sheets = await import("../../modules/sheets.js");
  history = await import("../../modules/history.js");
  plugins = await import("../../modules/plugin-manager.js");
  grid = await import("../../modules/grid-lines.js");
  touch = await import("../../modules/touch-scroll.js");
  utils = await import("../../modules/utils.js");
  prompts = await import("../../modules/prompts.js");
  listeners.setupMouseListener();
  listeners.enableCellEditModal();
}, 20000);

afterEach(async () => {
  headers.disableRowColHeaders();
  listeners.enableCellEditModal();
  await idle();
});

describe("cell edit modal request", () => {
  it("opens for a data cell whose text looks like a column letter while headers are on", async () => {
    // Runs first: jsdom cannot re-render a scrolled grid with headers on, so O40 must be in view
    await run(["set O40 text t Er"]);
    headers.enableRowColHeaders();
    await idle(); // headers re-render the grid
    // The rendered grid cell itself: <td id="cell_O40">Er</td>
    const editor = engine.runtime.getEditor();
    const td = engine.SocialCalc.GetEditorCellElement(editor, 40, 15).element as HTMLElement;
    expect(td.id).toBe("cell_O40");
    expect(td.textContent).toBe("Er");
    const detail = captureEditRequest(() => clickCell("O40", td));
    expect(detail).not.toBeNull();
    expect(detail.coord).toBe("O40");
    expect(detail.text).toBe("Er");
  });

  it("shows a constant's typed text, not '=$1,200' or its numeric value", async () => {
    await run(["set Y60 constant n$ 1200 $1,200", "set Y61 formula 2+3", "set Y62 text t hello", "set Y63 value n 7.5"]);
    const SC = engine.SocialCalc;
    const sheet = engine.runtime.getSheet();
    const text = (coord: string) => captureEditRequest(() => clickCell(coord))?.text;
    expect(sheet.cells.Y60.datatype).toBe("c");
    expect(text("Y60")).toBe("$1,200");
    expect(text("Y61")).toBe("=2+3");
    expect(text("Y62")).toBe("hello");
    expect(text("Y63")).toBe("7.5");
    expect(SC).toBeTruthy();
  });

  it("does not create empty cells just by clicking them", () => {
    const sheet = engine.runtime.getSheet();
    expect(sheet.cells.Y70).toBeUndefined();
    const detail = captureEditRequest(() => clickCell("Y70"));
    expect(detail.text).toBe("");
    expect(sheet.cells.Y70).toBeUndefined();
  });

  it("a tap on a data cell reading 'Er' edits it; a tap on header 'O' selects the column", async () => {
    // The original bug: the touch handler took any cell whose text was 1-2 letters for a column header
    const SC = engine.SocialCalc;
    const editor = engine.runtime.getEditor();
    await run(["set O40 text t Er"]);
    headers.enableRowColHeaders();
    await idle();
    const dataTd = SC.GetEditorCellElement(editor, 40, 15).element as HTMLElement;
    const headerTd = Array.from(editor.fullgrid.querySelectorAll("td")).find(
      (td: any) => !td.id && td.textContent.trim() === "O"
    ) as HTMLElement;
    expect(dataTd.textContent).toBe("Er");
    expect(headerTd).toBeTruthy();

    SC.HasTouch = true;
    touch.enableTouchScroll();
    const realElementFromPoint = (document as any).elementFromPoint;
    const find = vi.spyOn(SC, "FindTouchElement").mockReturnValue(null);
    const select = vi.spyOn(SC, "selectColumn").mockImplementation(() => {});
    const tap = (el: HTMLElement) => {
      (document as any).elementFromPoint = () => el;
      SC.ProcessTouchStart({ touches: [{ pageX: 5, pageY: 5, clientX: 5, clientY: 5 }] });
      SC.ProcessTouchEnd({ touches: [], changedTouches: [{ pageX: 5, pageY: 5, clientX: 5, clientY: 5 }] });
    };
    try {
      tap(dataTd);
      expect(select).not.toHaveBeenCalled();
      expect(find).toHaveBeenCalledTimes(1); // went on to the normal tap → edit path

      tap(headerTd);
      expect(select).toHaveBeenCalledWith(15);
      expect(find).toHaveBeenCalledTimes(1);

      // With headers off nothing is a header, even header-looking text
      headers.disableRowColHeaders();
      await idle();
      select.mockClear();
      tap(dataTd);
      expect(select).not.toHaveBeenCalled();
    } finally {
      find.mockRestore();
      select.mockRestore();
      (document as any).elementFromPoint = realElementFromPoint;
      touch.disableTouchScroll();
    }
  });

  it("okfn stores typed currency as a number like the built-in editor", async () => {
    const detail = captureEditRequest(() => clickCell("Y65"));
    detail.okfn("$1,250.50");
    await idle();
    const cell = engine.runtime.getSheet().cells.Y65;
    expect(cell.datavalue).toBe(1250.5);
    expect(String(cell.valuetype).charAt(0)).toBe("n");
  });
});

describe("commitCellEdit", () => {
  it("runs before-commit hooks and does not write a rejected value", async () => {
    const remove = listeners.addBeforeCellCommitHook((coord: string, value: any) => value !== "bad");
    try {
      expect(listeners.commitCellEdit("Y66", "bad")).toBe(false);
      await idle();
      expect(engine.runtime.getSheet().cells.Y66).toBeUndefined();

      expect(listeners.commitCellEdit("Y66", "12%")).toBe(true);
      await idle();
      expect(engine.runtime.getSheet().cells.Y66.datavalue).toBeCloseTo(0.12);
    } finally {
      remove();
    }
  });

  it("changes only formatting when the value is undefined", async () => {
    await run(["set Y67 value n 5"]);
    listeners.commitCellEdit("Y67", undefined, { bgColor: "lightyellow" });
    await idle();
    const f = formatting.getCellFormatting("Y67");
    expect(f?.bgcolor).toBe("lightyellow");
    expect(engine.runtime.getSheet().cells.Y67.datavalue).toBe(5);
  });

  it("emits cell-change for edits made through it", async () => {
    const seen: any[] = [];
    const off = listeners.setupCellChangeListener((coord: string, detail: any) => seen.push({ coord, detail }));
    try {
      listeners.commitCellEdit("Y68", "hello");
      await idle();
      await waitUntil(() => seen.some((s) => s.coord === "Y68"));
    } finally {
      off();
    }
  });
});

describe("busy-safe scheduling", () => {
  it("queues updateCellValueAndFormat behind a running command instead of overwriting it", async () => {
    const editor = engine.runtime.getEditor();
    editor.busy = true;
    try {
      expect(formatting.updateCellValueAndFormat("Y69", "queued", {})).toBe(true);
      expect(editor.deferredCommands).toHaveLength(1);
      expect(editor.deferredCommands[0].cmdstr).toBe("set Y69 text t queued");
    } finally {
      editor.deferredCommands.length = 0;
      editor.busy = false;
    }
  });
});

describe("row/column commands", () => {
  it("insert row is its own undo step, recalculates and emits a command event", async () => {
    await run(["set Z90 value n 7", "set Z95 formula SUM(Z90:Z94)"]);
    await run(["set Z91 value n 3"]);
    expect(engine.runtime.getSheet().cells.Z95.datavalue).toBe(10);

    const commands: any[] = [];
    const off = engine.events.on("command", (d: any) => commands.push(d));
    try {
      headers.insertRowAbove(90);
      await idle();
      await waitUntil(() => commands.some((c) => /insertrow A90/.test(c.cmdstr)));
    } finally {
      off();
    }
    const sheet = engine.runtime.getSheet();
    expect(sheet.cells.Z91.datavalue).toBe(7);
    expect(sheet.cells.Z96.formula).toBe("SUM(Z91:Z95)");
    expect(sheet.cells.Z96.datavalue).toBe(10);

    // One undo removes only the inserted row; the earlier edit (Z91 = 3) stays
    history.undo();
    await idle();
    expect(sheet.cells.Z90.datavalue).toBe(7);
    expect(sheet.cells.Z91.datavalue).toBe(3);
  });

  it("column width changes go through the command queue", async () => {
    const commands: any[] = [];
    const off = engine.events.on("command", (d: any) => commands.push(d));
    try {
      headers.setColumnWidth(26, 133);
      await idle();
      await waitUntil(() => commands.some((c) => /set Z width 133/.test(c.cmdstr)));
    } finally {
      off();
    }
    expect(engine.runtime.getSheet().colattribs.width.Z).toBe("133");
  });
});

describe("sheet switching", () => {
  it("activateFooterButton follows the real active sheet, not a stale cached index", async () => {
    const SC = engine.SocialCalc;
    sheets.activateFooterButton(1);
    expect(engine.runtime.getCurrentSheetId()).toBe("sheet1");
    SC.WorkBookControlActivateSheet("sheet2"); // switched by other code
    await idle();
    expect(engine.runtime.getCurrentSheetId()).toBe("sheet2");
    sheets.activateFooterButton(1);
    await idle();
    expect(engine.runtime.getCurrentSheetId()).toBe("sheet1");
  });
});

describe("plugin state sync", () => {
  it("notifies subscribers when a plugin is switched directly, once per change", () => {
    grid.disableGridLines();
    const calls: any[] = [];
    const off = plugins.subscribePluginChanges((name: string, enabled: boolean) => calls.push([name, enabled]));
    try {
      grid.enableGridLines();
      grid.enableGridLines();
      grid.toggleGridLines(false);
      expect(calls.filter((c) => c[0] === "gridLines")).toEqual([
        ["gridLines", true],
        ["gridLines", false],
      ]);
    } finally {
      off();
    }
  });

  it("still notifies through enablePlugin/disablePlugin", () => {
    const calls: any[] = [];
    const off = plugins.subscribePluginChanges((name: string, enabled: boolean) => calls.push([name, enabled]));
    try {
      plugins.enablePlugin("gridLines");
      plugins.disablePlugin("gridLines");
      expect(calls).toEqual([
        ["gridLines", true],
        ["gridLines", false],
      ]);
    } finally {
      off();
    }
  });
});

describe("keyboard", () => {
  it("passes keys to the engine while its own input box has focus", () => {
    const SC = engine.SocialCalc;
    const editor = engine.runtime.getEditor();
    SC.KeyboardSetFocus(editor);
    const input = editor.inputBox.element as HTMLInputElement;
    // This build keeps the formula bar out of the page; a host that shows it puts the box in the DOM
    const detached = !input.isConnected;
    if (detached) document.body.appendChild(input);
    input.disabled = false; // native mode: the core enables and shows the box over the cell
    input.style.display = "";
    input.focus();
    expect(document.activeElement).toBe(input);
    const spy = vi.spyOn(SC, "ProcessKey").mockReturnValue(true);
    try {
      SC.ProcessKeyDown(new KeyboardEvent("keydown", { keyCode: 13, which: 13 } as any));
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      input.blur();
      input.disabled = true;
      if (detached) input.remove();
    }
  });

  it("leaves keys to other page inputs", () => {
    const SC = engine.SocialCalc;
    const other = document.createElement("input");
    document.body.appendChild(other);
    other.focus();
    const spy = vi.spyOn(SC, "ProcessKey").mockReturnValue(true);
    try {
      SC.ProcessKeyDown(new KeyboardEvent("keydown", { keyCode: 13, which: 13 } as any));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      other.remove();
    }
  });
});

describe("touch taps", () => {
  it("treats a sideways swipe as a gesture, not a tap", () => {
    const SC = engine.SocialCalc;
    SC.HasTouch = true;
    touch.enableTouchScroll();
    const find = vi.spyOn(SC, "FindTouchElement").mockReturnValue(null);
    const realElementFromPoint = (document as any).elementFromPoint;
    (document as any).elementFromPoint = () => null;
    try {
      SC.ProcessTouchStart({ touches: [{ pageX: 10, pageY: 10, clientX: 10, clientY: 10 }] });
      SC.ProcessTouchEnd({ touches: [], changedTouches: [{ pageX: 200, pageY: 12, clientX: 200, clientY: 12 }] });
      expect(find).not.toHaveBeenCalled();

      SC.ProcessTouchStart({ touches: [{ pageX: 10, pageY: 10, clientX: 10, clientY: 10 }] });
      SC.ProcessTouchEnd({ touches: [], changedTouches: [{ pageX: 12, pageY: 11, clientX: 12, clientY: 11 }] });
      expect(find).toHaveBeenCalled();
    } finally {
      find.mockRestore();
      (document as any).elementFromPoint = realElementFromPoint;
      touch.disableTouchScroll();
    }
  });
});

describe("prompts and utils", () => {
  it("enhancedShowPrompt commits to the cell it was opened for", async () => {
    const editor = engine.runtime.getEditor();
    editor.MoveECell("Y72");
    const detail = captureEditRequest(() => prompts.enhancedShowPrompt("Y72"));
    editor.MoveECell("Y73"); // cursor moves before the user confirms
    expect(detail.okfn("answer")).toBe(true);
    await idle();
    const sheet = engine.runtime.getSheet();
    expect(sheet.cells.Y72.datavalue).toBe("answer");
    expect(sheet.cells.Y73).toBeUndefined();
  });

  it("saveAs resolves null when the prompt is cancelled", async () => {
    const realPrompt = window.prompt;
    window.prompt = () => null;
    try {
      await expect(utils.saveAs()).resolves.toBeNull();
    } finally {
      window.prompt = realPrompt;
    }
  });
});
