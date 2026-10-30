/**
 * Boots the real SocialCalc engine inside a vitest (jsdom) test file, using the same
 * sequence as socialcalc/modules/init.js. Call once per test file, e.g. in beforeAll.
 */
import template100001 from "../fixtures/invoice-template.json";

export const defaultTemplate = template100001;

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitUntil(predicate: () => boolean, timeout = 5000, interval = 25) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error("waitUntil timed out");
    await wait(interval);
  }
}

export async function bootEngine(template: any = defaultTemplate) {
  // setup.ts installs a mock SocialCalc; the real engine must start from a clean global.
  delete (globalThis as any).SocialCalc;
  if (typeof window !== "undefined") delete (window as any).SocialCalc;

  document.body.innerHTML =
    '<div id="container"><div id="tableeditor"></div><div id="workbookControl"></div></div>';
  (window as any).focus = () => {};

  await import("../../core/index.js");
  const events = await import("../../modules/events.js");
  const runtime = await import("../../modules/runtime.js");
  const { initializeApp } = await import("../../modules/init.js");

  events.installEventHooks();
  const loaded = new Promise<void>((resolve) => events.once("load", () => resolve()));
  initializeApp(template);
  await Promise.race([loaded, wait(4000)]);
  await runtime.whenReady();
  await waitUntil(() => {
    const editor = runtime.getEditor();
    return !!editor && !editor.busy;
  });

  return {
    SocialCalc: runtime.getSocialCalc(),
    runtime,
    events,
    control: () => runtime.getWorkbookControl(),
    sheet: () => runtime.getSheet(),
  };
}

type Engine = Awaited<ReturnType<typeof bootEngine>>;

/**
 * Resolves once the engine has nothing left to do: no command, recalc or render running,
 * nothing queued, and no command waiting on its timer (editor.busy alone can be false then).
 */
export async function idle(engine: Engine, timeout = 5000) {
  await waitUntil(() => {
    const editor = engine.runtime.getEditor();
    const sci = engine.SocialCalc.SheetCommandInfo;
    return !!editor && !editor.busy && editor.deferredCommands.length === 0 && !(sci && sci.timerobj);
  }, timeout);
}

/** Runs commands through the editor and waits until the engine is idle again. */
export async function run(engine: Engine, cmds: string[]) {
  await engine.runtime.runCommands(cmds);
  await idle(engine);
}

/**
 * Simulates a click on a grid cell. jsdom has no layout, so the grid hit test is stubbed to
 * return `coord`; `target` is the element the event comes from (default: the grid itself).
 */
export function clickCell(engine: Engine, coord: string, target?: HTMLElement) {
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
    if (SC.ProcessEditorMouseUp) SC.ProcessEditorMouseUp({ target: el, clientX: 0, clientY: 0 });
  } finally {
    SC.GridMousePosition = realGridMousePosition;
  }
}

/** Returns the detail of the socialcalc:cell-edit-request fired while `fn` runs, or null. */
export function captureEditRequest(fn: () => void): any {
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

/** Reads a cell of the active sheet. */
export function cell(engine: Engine, coord: string): any {
  return engine.runtime.getSheet().cells[coord];
}
