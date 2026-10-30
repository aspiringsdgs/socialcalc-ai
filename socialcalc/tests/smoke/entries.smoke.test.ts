/**
 * Smoke: every package entry loads and exposes its public API, and socialcalc-ai/react
 * never reaches Ionic (it must work in apps that do not install @ionic/react).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const LIB = path.resolve(__dirname, "../..");

const REACT_API = [
  // engine and lifecycle
  "SocialCalc", "initializeApp", "setupMouseListener", "loadWorkbookData", "getSpreadsheetContent",
  // editing and sync
  "setupCellChangeListener", "addBeforeCellCommitHook", "commitCellEdit", "updateCellValueAndFormat",
  "getCellFormatting", "applySelectedFormatting", "resetCellFormatting", "executeCommand",
  "enableCellEditModal", "disableCellEditModal", "toggleCellEditModal", "isCellEditModalEnabled",
  "undo", "redo",
  // sheets
  "activateFooterButton", "getAllSheetsData", "getWorkbookInfo", "getCurrentSheet",
  // plugin manager
  "registerPlugin", "enablePlugin", "disablePlugin", "togglePlugin", "isPluginEnabled", "getPlugin",
  "getRegisteredPlugins", "subscribePluginChanges", "notifyPluginStateChange",
  // view plugins
  "enableRowColHeaders", "disableRowColHeaders", "toggleRowColHeaders", "insertRowAbove", "insertRowBelow",
  "deleteRowAt", "setColumnWidth", "executeSheetCommand", "selectRow", "selectColumn",
  "enableGridLines", "disableGridLines", "toggleGridLines",
  "enableHorizontalScroll", "disableHorizontalScroll", "scrollToColumn", "scrollHorizontalBy",
  "getHorizontalScrollInfo", "subscribeHorizontalScroll",
  "enableTouchScroll", "disableTouchScroll", "toggleTouchScroll", "configureTouchScroll",
  "enableEditableCellsOnly", "disableEditableCellsOnly", "isCellEditable", "generateEditableCells", "setAppMapping",
  // exporters, prompts, utils, data writers
  "getCSVContent", "cleanCSV", "convertToCSV", "parseMSCFile", "enhancedShowPrompt", "saveAs",
  "addDynamicInvoiceData", "getDynamicInvoiceData", "clearDynamicInvoiceData", "addLogo", "removeLogo",
  // React components without Ionic
  "CellEditModal", "FONT_COLORS", "BG_COLORS", "HorizontalScrollBar", "RowActionPopover", "compressImage",
];

const IONIC_API = [
  "EditableCellsModal", "parseAppMappingToItems", "DemoVideosModal", "FORMULA_GUIDES", "AgentModal",
  "DEFAULT_GENERIC_SUGGESTIONS", "DEFAULT_INVOICE_SUGGESTIONS", "AgentPluginTest", "Agentplugintest",
];

const PDF_API = ["exportCurrentSheetAsPDF", "exportWorkbookAsPDF", "enablePdfExport", "configurePdfExport"];
const SHARE_API = ["getPlatform", "saveFile", "shareFile", "sendEmail", "printHTML", "configureShare", "enableShare"];

/** All modules (and bare packages) reachable from an entry file through static imports. */
function importGraph(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
  const exts = ["", ".js", ".ts", ".tsx", "/index.js"];
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const src = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
    const specs = [...src.matchAll(/(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g)];
    for (const m of specs) {
      const spec = m[1] || m[2];
      if (spec.startsWith(".")) {
        const base = path.resolve(path.dirname(file), spec);
        const hit = exts.map((e) => base + e).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!hit) throw new Error(`${path.relative(LIB, file)} imports missing ${spec}`);
        if (!hit.endsWith(".css")) visit(hit);
      } else {
        packages.add(spec);
      }
    }
  };
  visit(entry);
  return { files, packages };
}

describe("package entries", () => {
  it("socialcalc-ai/react exposes the engine, plugins and plain React components", async () => {
    const mod: any = await import("../../react.js");
    const missing = REACT_API.filter((name) => mod[name] === undefined);
    expect(missing).toEqual([]);
    expect(IONIC_API.filter((name) => name in mod)).toEqual([]);
  });

  it("socialcalc-ai/ionic exposes the Ionic-based components", async () => {
    const mod: any = await import("../../ionic.js");
    expect(IONIC_API.filter((name) => mod[name] === undefined)).toEqual([]);
  });

  it("the root entry still exports everything (backward compatible)", async () => {
    const mod: any = await import("../../index.js");
    expect([...REACT_API, ...IONIC_API].filter((name) => mod[name] === undefined)).toEqual([]);
  });

  it("socialcalc-ai/pdf-export and socialcalc-ai/share load on their own", async () => {
    const pdf: any = await import("../../pdf-export.js");
    const share: any = await import("../../share.js");
    expect(PDF_API.filter((n) => typeof pdf[n] !== "function")).toEqual([]);
    expect(SHARE_API.filter((n) => typeof share[n] !== "function")).toEqual([]);
  });

  it("socialcalc-ai/react never imports Ionic, directly or through another module", () => {
    const { packages } = importGraph(path.join(LIB, "react.js"));
    const ionic = [...packages].filter((p) => /^(@ionic\/|ionicons)/.test(p));
    expect(ionic).toEqual([]);
    // Only React (and its JSX runtime) is needed besides the package's own dependencies
    const allowed = /^(react|react-dom|react\/jsx-runtime|marked)$/;
    expect([...packages].filter((p) => !allowed.test(p))).toEqual([]);
  });

  it("the root entry reaches Ionic only through socialcalc-ai/ionic", () => {
    const reactGraph = importGraph(path.join(LIB, "react.js")).files;
    const ionicOnly = [...importGraph(path.join(LIB, "index.js")).files].filter((f) => !reactGraph.has(f));
    const outside = ionicOnly
      .map((f) => path.relative(LIB, f))
      .filter((f) => !/^(index\.js|ionic\.js|components\/(EditableCellsModal|DemoVideosModal|AgentModal|AgentPluginTest)\/)/.test(f));
    expect(outside).toEqual([]);
  });
});
