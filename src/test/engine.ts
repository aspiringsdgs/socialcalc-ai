/**
 * Boots the real SocialCalc engine inside a vitest (jsdom) test file, using the same
 * sequence as socialcalc/modules/init.js. Call once per test file, e.g. in beforeAll.
 */
import template100001 from "../data/100001.json";

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

  await import("../../socialcalc/core/index.js");
  const events = await import("../../socialcalc/modules/events.js");
  const runtime = await import("../../socialcalc/modules/runtime.js");
  const { initializeApp } = await import("../../socialcalc/modules/init.js");

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
