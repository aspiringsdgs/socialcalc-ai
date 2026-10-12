/**
 * Real-UI end-to-end test for the Tornado storage integration.
 *
 * Drives the actual app in headless Chromium: login, enter values / formula /
 * format / colour through the Edit Cell modal, Save As, verify the object in
 * MinIO, hard reload, Open, delete, plus cross-UI checks against the legacy
 * Tornado UI and (optionally) the "Backend unreachable" path.
 *
 * Prerequisites (this repo does NOT depend on Playwright, so it is not added here)
 *   1. Tornado on :8888 started with the MinIO endpoint and the dev origin allowed, e.g.
 *        AWS_ENDPOINT_URL=http://localhost:9000 ALLOWED_ORIGINS=http://localhost:5173 \
 *          python cloudmain-dev.py --port=8888
 *      (with ALLOWED_ORIGINS unset it still works here: Vite proxies /api, so it is same-origin)
 *   2. MinIO on :9000 with bucket mc2-app-storage-useast1 and the `aws` CLI installed
 *      (used to check the stored object). Credentials default to minioadmin/minioadmin.
 *   3. Vite dev server on :5173:  npm run dev
 *   4. A Playwright install, e.g. the one in the tornado_version repo.
 *
 * Run
 *   PLAYWRIGHT_MODULE=$HOME/Desktop/tornado_version/node_modules/playwright/index.mjs \
 *     node scripts/e2e-tornado-storage.mjs
 *
 * Optional environment
 *   AI_URL (http://localhost:5173)  TORNADO_URL (http://localhost:8888)
 *   S3_ENDPOINT (http://localhost:9000)  S3_BUCKET (mc2-app-storage-useast1)
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (default minioadmin)
 *   TORNADO_STOP_CMD / TORNADO_START_CMD  shell commands to stop/start Tornado; when both are
 *       set the script also verifies the "Backend unreachable" toast, otherwise that step is skipped.
 *
 * Notes: it registers a fresh test user (e2eui_<timestamp>@example.com) in Tornado and leaves that
 * account behind; the sheets it creates are deleted by the test itself (e2e_legacy is left behind).
 * Exit code is 1 if any check fails. The Edit Cell modal swatch/format clicks use fixed viewport
 * coordinates (1400x900), so keep the viewport as is.
 */
import { execSync, spawnSync } from "node:child_process";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const AI = process.env.AI_URL || "http://localhost:5173";
const TO = process.env.TORNADO_URL || "http://localhost:8888";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const BUCKET = process.env.S3_BUCKET || "mc2-app-storage-useast1";
const email = `e2eui_${Date.now()}@example.com`;
const pw = "TestPassword123!";

const awsEnv = {
  ...process.env,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "minioadmin",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "minioadmin",
  AWS_DEFAULT_REGION: "us-east-1",
  AWS_PAGER: "",
};
// Tornado stores each sheet under the key json.dumps(["home", user, name])
const keyOf = (n) => `["home", "${email}", "${n}"]`;
const s3has = (n) =>
  spawnSync("aws", ["s3api", "head-object", "--endpoint-url", S3_ENDPOINT, "--bucket", BUCKET, "--key", keyOf(n)], { env: awsEnv }).status === 0;

const results = [];
const ok = (name, cond, extra = "") => {
  results.push(cond);
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
};
const toastMessages = (page) => page.locator("ion-toast").evaluateAll((els) => els.map((e) => e.getAttribute("message")));
const visible = (loc, timeout = 5000) => loc.waitFor({ state: "visible", timeout }).then(() => true).catch(() => false);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

try {
  // Fresh user, registered through the legacy page; then drop its session so the app starts logged out
  const reg = await ctx.newPage();
  await reg.goto(`${TO}/register`);
  await reg.fill('input[name="email"]', email);
  await reg.fill('input[name="password"]', pw);
  await reg.fill('input[name="repassword"]', pw);
  await reg.click('input[type="submit"][value="Register"]');
  await reg.locator('h2:has-text("Registration Complete")').waitFor();
  await reg.close();
  await ctx.clearCookies();

  await page.goto(AI);
  await page.waitForTimeout(3000);
  // the first load after a source change can come up blank while Vite transforms; reload once
  if (!(await page.locator("[data-testid=storage-user]").count())) {
    await page.reload();
    await page.waitForTimeout(3000);
  }
  ok("app starts logged out", (await page.getByTestId("storage-user").innerText()) === "Not logged in");
  const tabsBefore = await page.locator(".sheet-tab-btn").allInnerTexts();

  // Save before login -> "Please log in" toast + login modal
  const saveAsName = async (name) => {
    await page.waitForTimeout(900); // let the alert finish presenting before typing
    await page.locator(".alert-input").fill(name);
    await page.waitForTimeout(700);
    await page.locator('ion-alert[header="Save As"] .alert-button-role-confirm').click();
  };
  await page.getByTestId("btn-save").click(); // unnamed sheet -> opens Save As
  await saveAsName("unauth_try");
  ok('unauthenticated save shows "Please log in" toast', await visible(page.getByText("Please log in (HTTP 401)").first()));
  ok("login modal opened on 401", await visible(page.getByTestId("login-email")));

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("wrong");
  await page.getByTestId("login-submit").click();
  ok("bad password shows invalid-credentials toast", await visible(page.getByText("Invalid email or password (HTTP 401)").first()));
  await page.getByTestId("login-password").fill(pw);
  await page.getByTestId("login-submit").click();
  await page.waitForFunction(() => document.querySelector("[data-testid=storage-user]")?.textContent?.includes("Logged in"));
  ok("login works", (await page.getByTestId("storage-user").innerText()).includes(email));
  await page.waitForTimeout(1200);

  // Enter data through the Edit Cell modal with real clicks
  const cellPos = (col, row) =>
    page.evaluate(([c, r]) => {
      const el = document.getElementById("cell_" + c + r).getBoundingClientRect();
      return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
    }, [col, row]);
  const setCell = async (row, val) => {
    const p = await cellPos("J", row);
    await page.mouse.click(p.x, p.y);
    await page.waitForSelector(".sc-cell-input");
    await page.fill(".sc-cell-input", val);
    await page.click(".sc-cell-btn-apply");
    await page.waitForTimeout(500);
  };
  await setCell(3, "10");
  await setCell(4, "20");
  await setCell(5, "30");
  const p6 = await cellPos("J", 6);
  await page.mouse.click(p6.x, p6.y);
  await page.waitForSelector(".sc-cell-input");
  await page.fill(".sc-cell-input", "=SUM(J3:J5)");
  await page.click(".sc-accordion-toggle");
  await page.waitForTimeout(500);
  await page.getByText("Background Color").click();
  await page.waitForTimeout(600);
  await page.mouse.click(748, 460); // Light Yellow swatch
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Format/ }).click();
  await page.waitForTimeout(600);
  await page.mouse.click(748, 610); // $1,234.56
  await page.waitForTimeout(300);
  await page.click(".sc-cell-btn-apply");
  await page.waitForTimeout(800);

  const snap = () =>
    page.evaluate(() => {
      const sh = window.SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.sheet;
      const pick = (k) => {
        const c = sh.cells[k];
        return c && { v: c.datavalue, f: c.formula || "", disp: c.displaystring, bg: c.bgcolor || 0, color: sh.colors[c.bgcolor] || null, fmt: sh.valueformats[c.nontextvalueformat] || null };
      };
      return { J3: pick("J3"), J4: pick("J4"), J5: pick("J5"), J6: pick("J6") };
    });
  const before = await snap();
  ok("pre-save J6 is =SUM, $60.00, light yellow", before.J6.f === "SUM(J3:J5)" && before.J6.disp === "$60.00" && before.J6.color === "lightyellow");
  const liveLen = (await page.evaluate(() => window.SocialCalc.WorkBookControlSaveSheet())).length;

  // Save As
  await page.getByTestId("btn-save-as").click();
  await saveAsName("e2e_ai");
  await page.getByText('Saved "e2e_ai"').first().waitFor({ timeout: 8000 });
  ok("Save As toast + header shows the name", (await page.getByTestId("current-sheet-name").innerText()) === "e2e_ai");
  ok("object exists in MinIO at home/<user>/e2e_ai", s3has("e2e_ai"));
  const cp = spawnSync("aws", ["s3", "cp", "--endpoint-url", S3_ENDPOINT, `s3://${BUCKET}/${keyOf("e2e_ai")}`, "-"], { env: awsEnv });
  const stored = JSON.parse(cp.stdout.toString());
  const parsed = JSON.parse(stored.data);
  ok("stored data is the raw workbook string (no {msc,..} wrapper)", stored.type === "file" && "sheetArr" in parsed && !("msc" in parsed), `len=${stored.data.length} vs live ${liveLen}`);

  // Hard reload -> session still valid -> logout -> Open needs login -> login -> Open
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(3000);
  ok("after hard reload the session cookie is still valid", (await page.getByTestId("storage-user").innerText()).includes("Logged in"));
  await page.getByTestId("btn-logout").click();
  await page.getByTestId("btn-login").waitFor();
  ok("logout works", (await page.getByTestId("storage-user").innerText()) === "Not logged in");
  await page.getByTestId("btn-open").click();
  ok("Open while logged out -> Please log in", await visible(page.getByText("Please log in (HTTP 401)").first()));
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(pw);
  await page.getByTestId("login-submit").click();
  await page.waitForFunction(() => document.querySelector("[data-testid=storage-user]")?.textContent?.includes("Logged in"));
  await page.waitForTimeout(800);
  await page.getByTestId("btn-open").click();
  ok("Open list shows e2e_ai", await visible(page.getByTestId("sheet-row-e2e_ai"), 8000));
  await page.getByTestId("open-e2e_ai").click();
  await page.getByText("Loaded e2e_ai").first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);
  const after = await snap();
  ok("values / formula / format / colour intact after load", JSON.stringify(after) === JSON.stringify(before));
  const tabsAfter = await page.locator(".sheet-tab-btn").allInnerTexts();
  console.log(`INFO round-trip tab names: before ${JSON.stringify(tabsBefore)} after ${JSON.stringify(tabsAfter)} (template footers are not stored)`);
  ok("current sheet name set after Open", (await page.getByTestId("current-sheet-name").innerText()) === "e2e_ai");

  // Cross-UI (a): sheet saved from this app opens in the legacy UI
  const legacy = await ctx.newPage();
  legacy.on("dialog", (d) => d.accept());
  await legacy.goto(`${TO}/login`);
  await legacy.fill('input[name="email"]', email);
  await legacy.fill('input[name="password"]', pw);
  await legacy.click('input[type="submit"][value="Login"]');
  await legacy.waitForURL("**/save");
  ok("legacy list shows the app-saved e2e_ai", await legacy.locator("tr", { hasText: "e2e_ai" }).isVisible());
  await legacy.locator("tr", { hasText: "e2e_ai" }).locator('input[value="Edit"]').click();
  const ready = () => legacy.waitForFunction(() => { const s = window.spreadsheet; return s && s.editor && s.editor.busy === false && s.editor.state === "start"; }, { timeout: 30000 });
  await ready();
  await legacy.waitForTimeout(1500);
  const legJ6 = await legacy.evaluate(() => { const c = window.spreadsheet.sheet.cells.J6; return { v: c.datavalue, f: c.formula, disp: c.displaystring, bg: c.bgcolor }; });
  ok("legacy UI renders the app's sheet (J6=60, SUM, $60.00, bg)", legJ6.v === 60 && legJ6.f === "SUM(J3:J5)" && legJ6.disp === "$60.00" && legJ6.bg === 1, JSON.stringify(legJ6));

  // Cross-UI (b): sheet saved from the legacy UI opens in this app via Open
  const legacyCmd = async (cmd) => {
    await legacy.evaluate((c) => window.spreadsheet.editor.EditorScheduleSheetCommands(c, true, false), cmd);
    await legacy.waitForFunction(() => window.spreadsheet.editor.busy === false);
  };
  await legacyCmd("set A1 value n 7");
  await legacyCmd("set A2 formula A1*6");
  await legacy.locator('td[id$="saveastab"]').click();
  await legacy.fill("#saveasentry", "e2e_legacy");
  await legacy.evaluate(() => window.savecheck());
  await legacy.waitForTimeout(1500);
  await legacy.close();
  await page.getByTestId("btn-open").click();
  ok("Open list shows the legacy-saved e2e_legacy", await visible(page.getByTestId("sheet-row-e2e_legacy"), 8000));
  await page.getByTestId("open-e2e_legacy").click();
  await page.getByText("Loaded e2e_legacy").first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);
  const a2 = await page.evaluate(() => { const c = window.SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.sheet.cells; return { A2: c.A2 && { v: c.A2.datavalue, f: c.A2.formula } }; });
  ok("app renders the legacy-saved sheet (A2 = A1*6 = 42)", a2.A2 && a2.A2.v === 42 && a2.A2.f === "A1*6", JSON.stringify(a2));

  // Delete with confirm
  await page.getByTestId("btn-open").click();
  await page.getByTestId("sheet-row-e2e_ai").waitFor();
  await page.getByTestId("delete-e2e_ai").click();
  await page.waitForTimeout(700);
  await page.locator('ion-alert[header="Delete sheet?"] .alert-button-role-confirm').click();
  await page.waitForTimeout(700);
  // the toast sits behind the open modal, so check its message rather than its visibility
  ok("delete toast message set", (await toastMessages(page)).some((m) => m && m.includes("Deleted")));
  ok("deleted sheet gone from the Open list", !(await page.getByTestId("sheet-row-e2e_ai").isVisible().catch(() => false)));
  ok("deleted sheet gone from MinIO", !s3has("e2e_ai"));
  ok("other sheet untouched in MinIO", s3has("e2e_legacy"));

  // Backend down -> "Backend unreachable"
  if (process.env.TORNADO_STOP_CMD && process.env.TORNADO_START_CMD) {
    execSync(process.env.TORNADO_STOP_CMD, { stdio: "inherit" });
    try {
      await page.keyboard.press("Escape"); // close the Open modal
      await page.waitForTimeout(800);
      await page.getByTestId("btn-save").click();
      ok('backend down -> Save shows "Backend unreachable"', await visible(page.getByText("Backend unreachable").first(), 8000));
    } finally {
      execSync(process.env.TORNADO_START_CMD, { stdio: "inherit" });
    }
  } else {
    console.log("SKIP backend-down check (set TORNADO_STOP_CMD and TORNADO_START_CMD to enable)");
  }

  ok("no uncaught page errors", pageErrors.length === 0, JSON.stringify(pageErrors));
} catch (err) {
  console.error("E2E aborted:", err);
  results.push(false);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r).length;
console.log(`SUMMARY ${failed} failed of ${results.length}`);
process.exit(failed ? 1 : 0);
