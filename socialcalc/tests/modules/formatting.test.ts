/**
 * modules/formatting.js on the real engine: value + formatting writes, reading formatting back,
 * resets and raw commands.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine, idle, run, cell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let fmt: typeof import("../../modules/formatting.js");
let history: typeof import("../../modules/history.js");

beforeAll(async () => {
  engine = await bootEngine();
  fmt = await import("../../modules/formatting.js");
  history = await import("../../modules/history.js");
}, 20000);

describe("updateCellValueAndFormat", () => {
  it("writes value and formatting as one undo step", async () => {
    await run(engine, ["set K10 value n 1"]);
    expect(fmt.updateCellValueAndFormat("K10", "2", { bgColor: "lightblue", fontColor: "red" })).toBe(true);
    await idle(engine);
    expect(cell(engine, "K10").datavalue).toBe(2);
    expect(fmt.getCellFormatting("K10")).toMatchObject({ bgcolor: "lightblue", color: "red" });

    history.undo();
    await idle(engine);
    expect(cell(engine, "K10").datavalue).toBe(1);
    expect(fmt.getCellFormatting("K10")?.bgcolor ?? null).toBeNull();
  });

  it("stores text as-is by default and typed values as numbers with detectTypes", async () => {
    fmt.updateCellValueAndFormat("K11", "12%", {});
    fmt.updateCellValueAndFormat("K12", "12%", {}, { detectTypes: true });
    await idle(engine);
    expect(cell(engine, "K11").datavalue).toBe("12%");
    expect(cell(engine, "K12").datavalue).toBeCloseTo(0.12);
  });

  it("leaves the value alone when it is null/undefined", async () => {
    await run(engine, ["set K13 text t keep"]);
    fmt.updateCellValueAndFormat("K13", undefined, { bgColor: "lightgreen" });
    await idle(engine);
    expect(cell(engine, "K13").datavalue).toBe("keep");
    expect(fmt.getCellFormatting("K13")?.bgcolor).toBe("lightgreen");
  });

  it("returns false when there is nothing to write", () => {
    expect(fmt.updateCellValueAndFormat("K14", null, {})).toBe(false);
  });

  it("sets borders and number formats", async () => {
    fmt.updateCellValueAndFormat("K15", 1234.5, {
      borders: { top: "1px solid rgb(0,0,0)", bottom: "2px dashed rgb(255,0,0)" },
      valueFormat: "#,##0.00",
    });
    await idle(engine);
    const f = fmt.getCellFormatting("K15");
    expect(f?.borders.top).toBe("1px solid rgb(0,0,0)");
    expect(f?.borders.bottom).toBe("2px dashed rgb(255,0,0)");
    expect(f?.borders.left).toBeNull();
    expect(f?.valueFormat).toBe("#,##0.00");
  });
});

describe("getCellFormatting", () => {
  it("resolves font parts and returns null for cells that do not exist", async () => {
    await run(engine, ["set K20 text t x", "set K20 font italic bold 14pt Arial"]);
    expect(fmt.getCellFormatting("K20")).toMatchObject({
      fontSize: "14pt",
      fontFamily: "Arial",
      bold: true,
      italic: true,
      coord: "K20",
    });
    expect(fmt.getCellFormatting("K99")).toBeNull();
  });
});

describe("applySelectedFormatting / resetCellFormatting / executeCommand", () => {
  it("changes the font size without losing bold", async () => {
    await run(engine, ["set K21 text t x", "set K21 font normal bold * *"]);
    fmt.applySelectedFormatting("K21", { fontSize: "18pt", bgColor: "lightyellow" });
    await idle(engine);
    expect(fmt.getCellFormatting("K21")).toMatchObject({ fontSize: "18pt", bold: true, bgcolor: "lightyellow" });
  });

  it("resets font, colors and borders", async () => {
    fmt.resetCellFormatting("K21");
    await idle(engine);
    const f = fmt.getCellFormatting("K21");
    expect(f?.bold).toBe(false);
    expect(f?.bgcolor).toBeNull();
    expect(f?.borders.top).toBeNull();
    expect(cell(engine, "K21").datavalue).toBe("x");
  });

  it("executeCommand runs a raw command through the editor", async () => {
    fmt.executeCommand("set K22 value n 42");
    await idle(engine);
    expect(cell(engine, "K22").datavalue).toBe(42);
  });
});
