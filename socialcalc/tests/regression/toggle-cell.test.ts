/**
 * Regression: tapping a checkbox cell (a "tc" constraint, e.g. "Paid by: Cash") showed a broken
 * image, because ToggleCell inserted a dead imageshack.com URL. It also wrote the cell behind the
 * engine's back (no redraw, undo or change event), and on touch screens one tap toggled twice:
 * once from the browser's mouse-down and once from the synthetic mouse-down core/touch.js sends.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { bootEngine, idle, clickCell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
const COORD = "B2";
const OTHER = "C2";
let now = 1_000_000;

const value = (coord = COORD) => String(engine.sheet().cells[coord]?.datavalue ?? "");
const ticked = (coord = COORD) => /<img/i.test(value(coord));

/** A tap whose mouse-down is synthetic (isTrusted false), like the one core/touch.js dispatches */
function syntheticTap(coord: string) {
  const target = document.createElement("div");
  target.addEventListener("mousedown", () => clickCell(engine, coord));
  target.dispatchEvent(new MouseEvent("mousedown"));
}

beforeAll(async () => {
  engine = await bootEngine();
});

beforeEach(async () => {
  const SC = engine.SocialCalc;
  const name = engine.sheet().sheetname;
  SC.EditableCells = { allow: true, cells: {}, constraints: { [`${name}!${COORD}`]: ["tc"] } };
  await engine.runtime.runCommands([`set ${COORD} text th ${SC.encodeForSave("<div>&nbsp;</div>")}`, `set ${OTHER} text t plain`]);
  await idle(engine);
  now += 10_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ToggleCell (checkbox cells)", () => {
  it("ticks with a local checkmark image, not the dead imageshack URL", async () => {
    clickCell(engine, COORD);
    await idle(engine);
    expect(ticked()).toBe(true);
    expect(value()).not.toMatch(/imageshack/i);
    expect(value()).toContain('src="checkmark.png"');
  });

  it("changes the cell through a sheet command, so it renders and can be undone", async () => {
    clickCell(engine, COORD);
    await idle(engine);
    expect(document.getElementById("cell_" + COORD)?.innerHTML).toContain("checkmark.png");

    engine.runtime.getEditor().context.sheetobj.SheetUndo();
    await idle(engine);
    expect(ticked()).toBe(false);
  });

  it("unticks on the next tap", async () => {
    clickCell(engine, COORD);
    await idle(engine);
    now += 2000;
    clickCell(engine, COORD);
    await idle(engine);
    expect(ticked()).toBe(false);
    expect(value()).toContain("&nbsp;");
  });

  it("counts a tap once when the synthetic mouse-down follows the real one", async () => {
    clickCell(engine, COORD);
    now += 400;
    syntheticTap(COORD);
    await idle(engine);
    expect(ticked()).toBe(true);
  });

  it("leaves cells without a tc constraint alone", async () => {
    clickCell(engine, OTHER);
    await idle(engine);
    expect(value(OTHER)).toBe("plain");
  });

  it("uses the host's checkmark markup when configured", async () => {
    const SC = engine.SocialCalc;
    const previous = SC.ToggleCellSettings.checkedHTML;
    SC.ToggleCellSettings.checkedHTML = '<div><img src="/assets/tick.svg"></div>';
    try {
      clickCell(engine, COORD);
      await idle(engine);
      expect(value()).toContain("/assets/tick.svg");
    } finally {
      SC.ToggleCellSettings.checkedHTML = previous;
    }
  });
});
