import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, wait, waitUntil } from "../../../src/test/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;

beforeAll(async () => {
  engine = await bootEngine();
}, 20000);

describe("runtime helpers", () => {
  it("finds the engine, workbook, editor and sheets", async () => {
    const r = engine.runtime;
    expect(r.isReady()).toBe(true);
    expect(r.getCurrentSheetId()).toBe("sheet1");
    expect(r.getSheetIds().length).toBeGreaterThan(1);
    expect(r.getSheet().cells).toBeTypeOf("object");
    expect(r.resolveSheetId(r.getSheetName("sheet2"))).toBe("sheet2");
  });

  it("parses ranges and converts columns", () => {
    const r = engine.runtime;
    expect(r.parseRange("C5:A2")).toMatchObject({ top: 2, bottom: 5, left: 1, right: 3, range: "A2:C5" });
    expect(r.columnToLetters(28)).toBe("AB");
    expect(r.lettersToColumn("AB")).toBe(28);
    const seen: string[] = [];
    r.forEachCellInRange("A1:B2", (c: string) => seen.push(c));
    expect(seen).toEqual(["A1", "B1", "A2", "B2"]);
    expect(() => r.parseRange("nope")).toThrow();
  });

  it("builds value commands with encoding", () => {
    const r = engine.runtime;
    expect(r.buildSetValueCommands("A1", 5)).toEqual(["set A1 value n 5"]);
    expect(r.buildSetValueCommands("A1", "=SUM(B1:B2)")).toEqual(["set A1 formula SUM(B1:B2)"]);
    expect(r.buildSetValueCommands("A1", "")).toEqual(["set A1 empty"]);
    expect(r.buildSetValueCommands("A1", "C:\\new\nline")).toEqual(["set A1 text t C\\c\\bnew\\nline"]);
    expect(r.buildSetValueCommands("A1", "$1,200", { detectTypes: true })[0]).toMatch(/^set A1 constant n\$ 1200 /);
  });

  it("builds and parses font values in the engine format", () => {
    const r = engine.runtime;
    expect(r.buildFontValue({ size: "18px" })).toBe("* 18px *");
    expect(r.buildFontValue({ bold: true })).toBe("normal bold * *");
    expect(r.parseFontValue("italic bold 12pt Times New Roman")).toEqual({ style: "italic", weight: "bold", size: "12pt", family: "Times New Roman" });
    expect(r.parseFontValue("* * 18px *")).toEqual({ style: null, weight: null, size: "18px", family: null });
    expect(r.mergeFontValue("normal bold * *", { size: "14px" })).toBe("normal bold 14px *");
  });

  it("normalizes colors", () => {
    const r = engine.runtime;
    expect(r.normalizeColor("#f00")).toBe("rgb(255,0,0)");
    expect(r.normalizeColor("#0a141e")).toBe("rgb(10,20,30)");
    expect(r.normalizeColor("red")).toBe("rgb(255,0,0)");
    expect(r.normalizeColor("rgb( 1, 2 ,3 )")).toBe("rgb(1,2,3)");
    expect(r.colorToHex("rgb(10,20,30)")).toBe("#0a141e");
  });

  it("runCommands executes, recalculates and resolves when idle", async () => {
    const r = engine.runtime;
    await r.runCommands(["set Z40 value n 21", "set Z41 formula Z40*2"]);
    expect(r.getSheet().cells.Z40.datavalue).toBe(21);
    expect(r.getSheet().cells.Z41.datavalue).toBe(42);
  });

  it("runCommands can target another sheet without switching", async () => {
    const r = engine.runtime;
    await r.runCommands("set Z1 value n 7", { sheet: "sheet2" });
    expect(r.getCurrentSheetId()).toBe("sheet1");
    expect(r.getSheet("sheet2").cells.Z1.datavalue).toBe(7);
    await expect(r.runCommands("set Z1 value n 1", { sheet: "missing-sheet" })).rejects.toThrow(/Unknown sheet/);
  });
});

describe("event bus", () => {
  it("emits command and cell-change after the command ran", async () => {
    const { events, runtime } = engine;
    const commands: any[] = [];
    const changes: any[] = [];
    const offCommand = events.on("command", (d: any) => commands.push(d));
    const offChange = events.on("cell-change", (d: any) => {
      changes.push({ ...d, stored: runtime.getSheet().cells[d.coord]?.datavalue });
    });
    await runtime.runCommands("set Z50 text t Hello");
    await waitUntil(() => changes.length > 0);
    offCommand();
    offChange();
    expect(commands.some((c) => c.cmdstr === "set Z50 text t Hello")).toBe(true);
    expect(changes[0]).toMatchObject({ coord: "Z50", value: "Hello", kind: "value", sheetId: "sheet1", stored: "Hello" });
  });

  it("describes which cells a command touches", () => {
    expect(engine.events.describeCommandChanges("set B2:C3 bgcolor rgb(1,2,3)\ninsertrow A5\nset sheet defaultcolor red")).toEqual([
      { coord: "B2", range: "B2:C3", kind: "format" },
      { coord: "A5", range: "A5", kind: "structure" },
    ]);
  });

  it("emits selection-change and sheet-change", async () => {
    const { events, runtime, SocialCalc } = engine;
    const selections: any[] = [];
    const sheets: any[] = [];
    const off1 = events.on("selection-change", (d: any) => selections.push(d));
    const off2 = events.on("sheet-change", (d: any) => sheets.push(d));
    runtime.getEditor().MoveECell("C3");
    SocialCalc.WorkBookControlActivateSheet("sheet2");
    await wait(300);
    SocialCalc.WorkBookControlActivateSheet("sheet1");
    await waitUntil(() => sheets.length >= 2);
    off1();
    off2();
    expect(selections.some((s) => s.coord === "C3")).toBe(true);
    expect(sheets[0]).toMatchObject({ sheetId: "sheet2", previousSheetId: "sheet1" });
  });

  it("forwards window events dispatched by other code and supports once/off", () => {
    const { events } = engine;
    const got: any[] = [];
    const off = events.on("plugin-change", (d: any) => got.push(d));
    window.dispatchEvent(new CustomEvent("socialcalc:plugin-change", { detail: { plugin: "x", enabled: true } }));
    events.emit("plugin-change", { plugin: "y", enabled: false });
    off();
    events.emit("plugin-change", { plugin: "z", enabled: false });
    expect(got.map((g) => g.plugin)).toEqual(["x", "y"]);
    let count = 0;
    events.once("render", () => count++);
    events.emit("render", {});
    events.emit("render", {});
    expect(count).toBe(1);
  });
});
