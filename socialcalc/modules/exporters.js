// Export functionality (CSV, MSC and file helpers). No third-party dependencies.
import { SocialCalcRef } from "./runtime.js";
import { getAppMapping } from "./editable-cells.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

export function getCSVContent() {
  var val = SocialCalc.WorkBookControlSaveSheet();
  var workBookObject = JSON.parse(val);
  var control = SocialCalc.GetCurrentWorkBookControl();
  var currentname = control.currentSheetButton.id;
  var savestrr = workBookObject.sheetArr[currentname].sheetstr.savestr;
  // The workbook stores a multi-part spreadsheet save; convert only its "sheet" part
  var parts = control.workbook.spreadsheet.DecodeSpreadsheetSave(savestrr);
  if (parts && parts.sheet) {
    savestrr = savestrr.substring(parts.sheet.start, parts.sheet.end);
  }
  var res = SocialCalc.ConvertSaveToOtherFormat(savestrr, "csv", false);
  return res;
}

// ─── File helpers ───────────────────────────────────────────────────────────

/**
 * Downloads a Blob in the browser under the given file name.
 * @param {Blob} blob
 * @param {string} filename - Full file name including extension
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Safari needs the URL to outlive the click
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Reads a Blob as base64 without the "data:...;base64," prefix
 * (the form Capacitor Filesystem.writeFile expects).
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ─── CSV ────────────────────────────────────────────────────────────────────

/**
 * Removes blank lines and surrounding whitespace from SocialCalc CSV output.
 * @param {string} csvContent
 * @returns {string}
 */
export function cleanCSV(csvContent) {
  if (!csvContent) return "";
  return csvContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim())
    .join("\n");
}

/** Alias of cleanCSV, kept for apps that used the name from their own CSV service. */
export const parseSocialCalcCSV = cleanCSV;

/**
 * Converts rows of values to CSV text, quoting values that contain commas, quotes or newlines.
 * @param {any[][]} rows
 * @returns {string}
 */
export function convertToCSV(rows) {
  if (!rows || rows.length === 0) return "";
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const value = String(cell);
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Wraps CSV text in a Blob with normalized line endings and a UTF-8 BOM (so Excel reads it correctly).
 * @param {string} csvContent
 * @returns {Blob}
 */
export function createCSVBlob(csvContent) {
  const normalized = String(csvContent || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return new Blob(["﻿" + normalized], { type: "text/csv;charset=utf-8;" });
}

/**
 * Downloads CSV text as a file, or returns it as a Blob.
 * @param {string} csvContent
 * @param {{ filename?: string, returnBlob?: boolean }} [options]
 * @returns {Promise<Blob | void>}
 */
export async function exportCSV(csvContent, options = {}) {
  const { filename = "sheet_data", returnBlob = false } = options;
  const blob = createCSVBlob(csvContent);
  if (returnBlob) return blob;
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Exports the active sheet as CSV (cleaned of blank lines).
 * @param {{ filename?: string, returnBlob?: boolean }} [options]
 * @returns {Promise<Blob | void>}
 */
export async function exportCurrentSheetAsCSV(options = {}) {
  const csv = cleanCSV(getCSVContent());
  if (!csv) throw new Error("No data available to export as CSV");
  return exportCSV(csv, options);
}

// ─── MSC (workbook save data) ───────────────────────────────────────────────

/**
 * The full workbook as an MSC JSON string (the same data initializeApp / loadWorkbookData accept).
 * @returns {string}
 */
export function getMSCContent() {
  return SocialCalc.WorkBookControlSaveSheet();
}

/**
 * Downloads the workbook as an MSC file, or returns it as a Blob.
 * With includeAppMapping the file is { msc, appMapping }, the template format that also
 * carries editable-cell mappings; otherwise it is the raw workbook save data.
 * @param {{ filename?: string, extension?: "msc" | "json", includeAppMapping?: boolean, pretty?: boolean, returnBlob?: boolean }} [options]
 * @returns {Promise<Blob | void>}
 */
export async function exportMSC(options = {}) {
  const { filename = "workbook", extension = "msc", includeAppMapping = false, pretty = false, returnBlob = false } = options;
  const raw = getMSCContent();
  if (!raw) throw new Error("No workbook data available to export");

  let text = raw;
  if (includeAppMapping || pretty) {
    const msc = JSON.parse(raw);
    const data = includeAppMapping ? { msc, appMapping: getAppMapping() || {} } : msc;
    text = JSON.stringify(data, null, pretty ? 2 : 0);
  }

  const blob = new Blob([text], { type: "application/json;charset=utf-8;" });
  if (returnBlob) return blob;
  downloadBlob(blob, `${filename}.${extension}`);
}

/**
 * Parses MSC file text (raw workbook data or a { msc, appMapping, footers } template) for loading.
 * @param {string} text
 * @returns {{ msc: any, appMapping?: any, footers?: any[] }}
 */
export function parseMSCFile(text) {
  const parsed = typeof text === "string" ? JSON.parse(text) : text;
  if (parsed && parsed.msc) return parsed;
  if (parsed && parsed.sheetArr) return { msc: parsed };
  throw new Error("Not a SocialCalc MSC file (expected sheetArr or msc)");
}
