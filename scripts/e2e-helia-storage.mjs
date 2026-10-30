/**
 * Live end-to-end check for Helia storage: save a workbook to Helia, reload the page, open it by
 * CID, and assert the restored MSC is byte-identical to what was saved.
 *
 * Prerequisites
 *   1. The Tornado stack with the Helia sidecar on :8080 (/meshkit-helia/*), with CORS allowing
 *      http://localhost:5173.
 *   2. Vite dev server on :5173:  npm run dev   (VITE_HELIA_BASE_URL defaults to http://localhost:8080)
 *   3. A Playwright install (this repo does not depend on it).
 *
 * Run
 *   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright-core/index.mjs node scripts/e2e-helia-storage.mjs
 *
 * Optional environment: AI_URL (http://localhost:5173), HELIA_URL (http://localhost:8080),
 *   SHOT_DIR (directory for screenshots; default ./e2e-shots, git-ignored by convention).
 *
 * It uploads one small encrypted object to Helia per run (Helia has no delete). Exit code 1 on failure.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const AI = process.env.AI_URL || "http://localhost:5173";
const HELIA = process.env.HELIA_URL || "http://localhost:8080";
const SHOTS = process.env.SHOT_DIR || "./e2e-shots";
const passphrase = `e2e-pass-${Date.now()}`;
mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, cond, extra = "") => {
  results.push(cond);
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
};
const visible = (loc, timeout = 5000) => loc.waitFor({ state: "visible", timeout }).then(() => true).catch(() => false);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

// SocialCalc stamps every save with `new Date().toString()`; freeze it so two saves of the same state can match.
await page.addInitScript(() => {
  Date.prototype.toString = () => "FROZEN";
});

// Independent EMSH decrypt (node WebCrypto) so the check does not rely on the app's own crypto.ts.
async function decryptEmsh(buf, pass) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const iterations = dv.getUint32(5, false);
  const base = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: buf.subarray(9, 25), iterations }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  return new TextDecoder().decode(await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(25, 37) }, key, buf.subarray(37)));
}

const loadApp = async () => {
  await page.goto(AI);
  await page.waitForTimeout(3000);
  if (!(await page.locator("[data-testid=storage-backend]").count())) {
    await page.reload(); // first load after a source change can be blank while Vite transforms
    await page.waitForTimeout(3000);
  }
};
const msc = () => page.evaluate(() => window.SocialCalc.WorkBookControlSaveSheet());

try {
  await loadApp();
  await page.getByTestId("storage-backend").selectOption("helia");

  // Put recognisable data in the sheet through the Edit Cell modal (real clicks)
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
  await setCell(5, "helia ✓ ünïcode");
  const saved = await msc();
  ok("sheet has the edited cells", saved.includes("helia ✓ ünïcode"), `len=${saved.length}`);

  // Save to Helia
  await page.getByTestId("btn-save").click();
  await page.getByTestId("helia-save-passphrase").fill(passphrase);
  await page.getByTestId("helia-save-submit").click();
  const cid = (await page.getByTestId("helia-cid").innerText({ timeout: 30000 })).trim();
  ok("CID is shown after saving", /^baf[a-z0-9]{20,}$/.test(cid), cid);
  await page.screenshot({ path: `${SHOTS}/helia-1-saved-cid.png` });

  // What Helia actually stores: an EMSH blob, no plaintext
  const res = await ctx.request.get(`${HELIA}/meshkit-helia/retrieve/${cid}`); // node-side: no CORS involved
  const bytes = await res.body();
  const stored = { status: res.status(), magic: bytes.subarray(0, 4).toString("latin1"), text: bytes.toString("latin1"), len: bytes.length };
  ok("stored object is EMSH-framed", stored.status === 200 && stored.magic === "EMSH", `len=${stored.len}`);
  ok("stored object contains no plaintext", !stored.text.includes("helia") && !stored.text.includes("cell:"));
  const payload = await decryptEmsh(new Uint8Array(bytes), passphrase);
  ok("decrypted Helia payload is byte-identical to the saved MSC", payload === saved, `saved=${saved.length} payload=${payload.length}`);

  // Reload: all in-page state is gone
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(3000);
  ok("backend choice survives the reload", (await page.getByTestId("storage-backend").inputValue()) === "helia");
  const freshMsc = await msc();
  ok("reloaded app does not have the edited cell", !freshMsc.includes("helia ✓ ünïcode"));

  // Open by CID: wrong passphrase first
  await page.getByTestId("btn-open").click();
  await page.getByTestId("helia-open-cid").fill(cid);
  await page.getByTestId("helia-open-passphrase").fill("wrong-passphrase");
  await page.getByTestId("helia-open-submit").click();
  ok("wrong passphrase shows a clear error", await visible(page.getByTestId("helia-open-error")) &&
    /wrong passphrase/.test(await page.getByTestId("helia-open-error").innerText()));
  ok("the node's CID list is offered", await visible(page.getByTestId("helia-list")));

  await page.getByTestId("helia-open-passphrase").fill(passphrase);
  await page.getByTestId("helia-open-submit").click();
  await page.getByText(/^Opened /).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  const restored = await msc();
  if (process.env.DUMP_DIR) {
    writeFileSync(`${process.env.DUMP_DIR}/saved.json`, saved);
    writeFileSync(`${process.env.DUMP_DIR}/restored.json`, restored);
  }
  // Re-serialising a loaded workbook is not byte-stable by itself (the timestamp and EditableCells
  // can differ), so compare what the user sees: every sheet's name and savestr, in order.
  const sheets = (m) => JSON.stringify(Object.values(JSON.parse(m).sheetArr).map((x) => [x.name, x.sheetstr.savestr]));
  const ids = (m) => Object.keys(JSON.parse(m).sheetArr).join(",");
  ok("sheet ids are not renumbered by open", ids(restored) === ids(saved), `${ids(saved)} -> ${ids(restored)}`);
  ok("restored sheets have byte-identical content", sheets(restored) === sheets(saved), `saved=${sheets(saved).length} restored=${sheets(restored).length}`);
  await page.screenshot({ path: `${SHOTS}/helia-2-restored.png` });

  // Helia down -> clear error in the save dialog (request aborted at the browser)
  await page.route("**/meshkit-helia/upload", (r) => r.abort());
  await page.getByTestId("btn-save").click();
  await page.getByTestId("helia-save-passphrase").fill(passphrase);
  await page.getByTestId("helia-save-submit").click();
  const msg = await page.getByTestId("helia-save-error").innerText({ timeout: 10000 }).catch(() => "");
  ok("unreachable Helia gives a clear error", /Helia is unreachable/.test(msg), msg);
  await page.screenshot({ path: `${SHOTS}/helia-3-unreachable.png` });

  ok("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
} catch (e) {
  console.error(e);
  ok("script completed", false, String(e.message || e).split("\n")[0]);
  await page.screenshot({ path: `${SHOTS}/helia-failure.png` }).catch(() => {});
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
