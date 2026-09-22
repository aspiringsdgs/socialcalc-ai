// Captures the docs screenshots in public/screenshots/live/ from the showcase app (../src).
//
// 1. Start the showcase app from the repo root:   npm run dev      (serves http://localhost:5173)
// 2. From docs/:  npm run screenshots            (or: npm run screenshots -- agent   for one shot)
//
// Set SHOWCASE_URL to use another address, and CHROMIUM_PATH to reuse an installed browser
// instead of running `npx playwright install chromium`.

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/screenshots/live");
const URL = process.env.SHOWCASE_URL || "http://localhost:5173/";
const ONLY = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const file = (name) => `${OUT}/${name}.png`;

async function open(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("socialcalc_dark_mode", "false"));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByText("BILL TO:").first().waitFor({ timeout: 15000 });
  await wait(1200);
  return { ctx, page };
}

async function clickToolbar(page, title) {
  await page.locator(`ion-button[title="${title}"]`).first().click();
  await wait(900);
}

// Screenshot just the open Ionic modal, falling back to the viewport.
async function shotModal(page, name) {
  const box = await page
    .locator("ion-modal:not(.overlay-hidden)")
    .last()
    .locator(".modal-wrapper, .ion-page")
    .first()
    .boundingBox()
    .catch(() => null);
  if (box && box.width > 200 && box.height > 200) await page.screenshot({ path: file(name), clip: box });
  else await page.screenshot({ path: file(name) });
}

// Crop around the viewport centre (the cell edit modal is centred).
async function shotCentre(page, name, width, height) {
  const vp = page.viewportSize();
  await page.screenshot({ path: file(name), clip: { x: (vp.width - width) / 2, y: (vp.height - height) / 2, width, height } });
}

const openNameCell = (page) =>
  page.locator("#tableeditor td").filter({ hasText: /^\[Name\]$/ }).first().click({ force: true });

const shots = {
  "studio-overview": async () => {
    const { ctx, page } = await open();
    await page.screenshot({ path: file("studio-overview") });
    await ctx.close();
  },
  "studio-mobile": async () => {
    const { ctx, page } = await open({ width: 390, height: 844 });
    await page.screenshot({ path: file("studio-mobile") });
    await ctx.close();
  },
  "plugins-off": async () => {
    const { ctx, page } = await open();
    await page.locator("button.plugin-btn", { hasText: "Headers" }).click();
    await page.locator("button.plugin-btn", { hasText: "Grid" }).click();
    await wait(3000); // let the toast disappear
    await page.screenshot({ path: file("plugins-off") });
    await ctx.close();
  },
  agent: async () => {
    const { ctx, page } = await open();
    await clickToolbar(page, "AI Agent Workbench");
    await shotModal(page, "agent-workbench");
    for (const [tab, name] of [["Sheet Context", "agent-context"], ["LLM Schemas", "agent-schemas"]]) {
      await page.locator("ion-modal").getByText(tab).first().click();
      await wait(700);
      await shotModal(page, name);
    }
    await page.locator("ion-modal").getByText(/AI Copilot & Actions/).first().click();
    await wait(500);
    for (const action of ["Fill Header Fields", "Populate Line Items", "Set Total Formula"]) {
      await page.locator("ion-modal").getByText(action).first().click();
      await wait(900);
    }
    await page.locator("ion-modal").getByText(/^Console/).first().click();
    await wait(800);
    await shotModal(page, "agent-console-live");
    await page.keyboard.press("Escape");
    await wait(1200);
    await page.screenshot({ path: file("agent-filled-invoice"), clip: { x: 0, y: 0, width: 760, height: 900 } });
    await ctx.close();
  },
  "export-share": async () => {
    const { ctx, page } = await open();
    await clickToolbar(page, "Export, Share & Print");
    await shotModal(page, "export-share");
    await ctx.close();
  },
  "cell-mappings": async () => {
    const { ctx, page } = await open();
    await clickToolbar(page, "Manage Cell Mappings");
    await shotModal(page, "cell-mappings");
    await ctx.close();
  },
  "msc-save-data": async () => {
    const { ctx, page } = await open();
    await clickToolbar(page, "View Save Data / MSC");
    await shotModal(page, "msc-save-data");
    await ctx.close();
  },
  "cell-edit": async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    await openNameCell(page);
    await wait(1200);
    await shotCentre(page, "cell-edit", 500, 350);
    await page.getByText(/^OPTIONS$/i).first().click();
    await wait(900);
    await shotCentre(page, "cell-edit-options", 500, 550);
    await ctx.close();
  },
  "row-popover": async () => {
    const { ctx, page } = await open();
    await page.locator("#tableeditor td").filter({ hasText: /^6$/ }).first().click({ force: true });
    await wait(900);
    await page.screenshot({ path: file("row-popover"), clip: { x: 0, y: 0, width: 900, height: 620 } });
    await ctx.close();
  },
};

for (const [name, run] of Object.entries(shots)) {
  if (ONLY && ONLY !== name) continue;
  try {
    await run();
    console.log("ok  ", name);
  } catch (err) {
    console.log("FAIL", name, err.message.split("\n")[0]);
    process.exitCode = 1;
  }
}
await browser.close();
