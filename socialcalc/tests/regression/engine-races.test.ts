/**
 * Regression: command scheduling races in the engine.
 *
 * - A render that overlapped a just-started command cleared editor.busy while the command was
 *   still waiting on its timer; the next command then replaced it in the single
 *   SheetCommandInfo and the first edit was lost.
 * - A command finishing while the grid DOM lagged behind a scroll threw inside the status
 *   callback, leaving editor.busy stuck at true: every later edit queued forever (frozen sheet).
 */
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { bootEngine, idle, cell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let listeners: typeof import("../../modules/listeners.js");
let violations: string[] = [];

beforeAll(async () => {
  engine = await bootEngine();
  listeners = await import("../../modules/listeners.js");
  // Invariant for the whole file: when the editor reports idle after a render, no command may be
  // waiting on its timer
  const editor = engine.runtime.getEditor();
  editor.StatusCallback.raceInvariant = {
    func: (ed: any, status: string) => {
      if (status === "doneposcalc" && !ed.busy && engine.SocialCalc.SheetCommandInfo.timerobj) {
        violations.push("busy cleared while a command was pending");
      }
    },
    params: null,
  };
}, 20000);

afterEach(() => {
  expect(violations).toEqual([]);
  violations = [];
});

describe("edits right after scrolling", () => {
  it("are never lost (30 scroll + edit cycles)", async () => {
    const editor = engine.runtime.getEditor();
    for (let i = 0; i < 30; i++) {
      editor.MoveECell(i % 2 ? "A1" : `Y${60 + i}`); // scrolls, schedules a render
      const coord = `X${100 + i}`;
      expect(listeners.commitCellEdit(coord, `v${i}`)).toBe(true);
      editor.MoveECell(i % 2 ? "Y90" : "A2"); // and scroll again before it ran
      await idle(engine);
      expect(cell(engine, coord)?.datavalue).toBe(`v${i}`);
    }
  }, 60000);

  it("back-to-back commits without waiting all land, in order", async () => {
    for (let i = 0; i < 12; i++) listeners.commitCellEdit(`W${i + 1}`, String(i));
    listeners.commitCellEdit("W1", "last");
    await idle(engine);
    expect(cell(engine, "W1").datavalue).toBe("last");
    for (let i = 1; i < 12; i++) expect(cell(engine, `W${i + 1}`).datavalue).toBe(i);
  });

  it("committing to a cell the grid has not rendered yet does not freeze the engine", async () => {
    const editor = engine.runtime.getEditor();
    editor.MoveECell("AZ300"); // far away: panes move, the table re-renders later
    listeners.commitCellEdit("AZ300", "far");
    await idle(engine); // throws on timeout if editor.busy got stuck
    expect(cell(engine, "AZ300").datavalue).toBe("far");

    // and the engine keeps accepting edits afterwards
    editor.MoveECell("A1");
    listeners.commitCellEdit("B3", "after");
    await idle(engine);
    expect(cell(engine, "B3").datavalue).toBe("after");
  });
});

describe("runCommands", () => {
  it("resolves only after its values are in the sheet, also when issued rapidly", async () => {
    const editor = engine.runtime.getEditor();
    for (let i = 0; i < 10; i++) {
      editor.MoveECell(i % 2 ? "A1" : "Y80");
      await engine.runtime.runCommands([`set V${i + 1} value n ${i}`]);
      expect(cell(engine, `V${i + 1}`)?.datavalue).toBe(i);
    }
    await idle(engine);
  }, 30000);
});
