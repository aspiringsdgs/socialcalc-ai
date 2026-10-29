/**
 * Regression: opening a workbook dropped its EditableCells.
 *
 * Open / Upload JSON hand the app a raw MSC with no appMapping. The load restores the saved
 * EditableCells, but the app then called setAppMapping({}), which regenerated EditableCells from an
 * empty mapping (allow: true, no cells) and wiped them. setAppMapping(mapping, { keepEditableCells })
 * records the mapping without regenerating, so the app can keep what the load restored.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, defaultTemplate, idle } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let api: any;

beforeAll(async () => {
  engine = await bootEngine();
  api = await import("../../react.js");
}, 20000);

const editableCells = () => JSON.parse(JSON.stringify(engine.SocialCalc.EditableCells));
const reload = async (saved: string) => {
  // what the app does for Open / Upload JSON: parseMSCFile -> loadWorkbookData, no appMapping
  api.loadWorkbookData(api.parseMSCFile(saved).msc);
  await idle(engine);
};

describe("EditableCells across save and open", () => {
  it("the template's EditableCells survive save -> open, identical", async () => {
    api.setAppMapping((defaultTemplate as any).appMapping);
    const before = editableCells();
    expect(before.allow).toBe(true);
    expect(Object.keys(before.cells).length).toBeGreaterThan(0);

    const saved = api.getSpreadsheetContent();
    expect(JSON.parse(saved).EditableCells).toEqual(before);

    // the app's applyTemplate for a raw MSC: no appMapping in the file
    await reload(saved);
    api.setAppMapping({}, { keepEditableCells: true });

    expect(editableCells()).toEqual(before);
    expect(JSON.parse(api.getSpreadsheetContent()).EditableCells).toEqual(before);
  });

  it("they survive repeated save -> open cycles", async () => {
    const before = editableCells();
    for (let i = 0; i < 3; i++) {
      await reload(api.getSpreadsheetContent());
      api.setAppMapping({}, { keepEditableCells: true });
    }
    expect(editableCells()).toEqual(before);
  });

  it("the locks still apply after opening: a mapped cell is editable, others are not", async () => {
    const editor = engine.runtime.getEditor();
    api.enableEditableCellsOnly();
    try {
      const mapped = Object.keys(editableCells().cells).find((k) => /^[A-Z]+\d+$/.test(k))!;
      expect(api.isCellEditable(editor, mapped)).toBe(true);
      expect(api.isCellEditable(editor, "Z99")).toBe(false);
    } finally {
      api.disableEditableCellsOnly();
    }
  });

  it("without keepEditableCells, setAppMapping({}) still regenerates them (documented behaviour)", async () => {
    api.setAppMapping({});
    expect(editableCells().cells).toEqual({});
    api.setAppMapping((defaultTemplate as any).appMapping); // restore for later tests
  });

  it("keepEditableCells still generates them when none exist yet", () => {
    const sc = engine.SocialCalc;
    const saved = sc.EditableCells;
    delete sc.EditableCells;
    api.setAppMapping((defaultTemplate as any).appMapping, { keepEditableCells: true });
    expect(Object.keys(sc.EditableCells.cells).length).toBeGreaterThan(0);
    sc.EditableCells = saved;
  });
});
