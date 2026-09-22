/**
 * SocialCalc PDF Export Plugin (offline)
 *
 * Renders sheet HTML to a multi-page PDF entirely on the device using jsPDF and html2canvas.
 * No server round-trip is needed, so it works offline and inside Capacitor apps.
 *
 * - Pages are split on table row boundaries, so rows are never cut in half.
 * - Charts drawn on <canvas> in the live editor are copied into the export.
 * - Every page gets a timestamp header, a footer label and "Page X of Y".
 *
 * This module is opt-in and is NOT re-exported from the main "socialcalc-ai" entry.
 * Import it from "socialcalc-ai/pdf-export" and install its peer dependencies:
 *
 *   npm install jspdf html2canvas
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { registerPlugin } from "./plugin-manager.js";
import { getCurrentSheetId } from "./runtime.js";
import { getCurrentHTMLContent, getAllSheetsData } from "./sheets.js";
import { blobToBase64 } from "./exporters.js";

let _pdfExportEnabled = true; // Enabled as soon as the module is imported

let _pdfExportConfig = {
  format: "a4",
  orientation: "portrait",
  margin: 10,
  headerText: null, // null = current date/time
  footerText: "",
  showPageNumbers: true,
  editorElementId: "tableeditor",
};

function ensureEnabled() {
  if (!_pdfExportEnabled) {
    throw new Error('PDF export plugin is disabled. Call enablePdfExport() or enablePlugin("pdfExport") first.');
  }
}

// ─── Page decoration ────────────────────────────────────────────────────────

function formatTimestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function addHeaderAndFooter(pdf, pageNumber, totalPages, opts) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);

  const headerText = opts.headerText === null || opts.headerText === undefined ? formatTimestamp() : opts.headerText;
  if (headerText) pdf.text(String(headerText), 10, 8);

  if (opts.footerText) pdf.text(String(opts.footerText), 10, pageHeight - 5);

  if (opts.showPageNumbers) {
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, pageWidth - pageTextWidth - 10, pageHeight - 5);
  }

  pdf.setTextColor(0, 0, 0);
}

// ─── Rendering ──────────────────────────────────────────────────────────────

/**
 * Copies chart canvases (and their cell markup) from the live editor into the offscreen copy,
 * because canvas pixels are not part of the sheet HTML.
 */
function syncCanvases(screenEditor, tempContainer) {
  const screenCanvases = screenEditor.querySelectorAll("canvas");
  const processedCellIds = new Set();

  for (let i = 0; i < screenCanvases.length; i++) {
    // Walk up to the nearest ancestor with an id (the table cell)
    let cell = screenCanvases[i].parentElement;
    while (cell && cell !== screenEditor && !cell.id) {
      cell = cell.parentElement;
    }
    if (!cell || !cell.id || processedCellIds.has(cell.id)) continue;
    processedCellIds.add(cell.id);

    // Attribute selector avoids CSS id escaping issues
    const tempCell = tempContainer.querySelector(`[id="${cell.id}"]`);
    if (!tempCell) continue;

    for (let j = 0; j < cell.attributes.length; j++) {
      const attr = cell.attributes[j];
      tempCell.setAttribute(attr.name, attr.value);
    }
    tempCell.innerHTML = cell.innerHTML;

    const cellCanvases = cell.querySelectorAll("canvas");
    const tempCellCanvases = tempCell.querySelectorAll("canvas");
    for (let j = 0; j < Math.min(cellCanvases.length, tempCellCanvases.length); j++) {
      const src = cellCanvases[j];
      const dest = tempCellCanvases[j];
      dest.width = src.width;
      dest.height = src.height;
      const ctx = dest.getContext("2d");
      if (ctx) ctx.drawImage(src, 0, 0);
    }
  }
}

function createOffscreenContainer(htmlContent, extraStyles) {
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  Object.assign(container.style, {
    position: "absolute",
    left: "-9999px",
    top: "-9999px",
    width: "210mm", // A4 width
    padding: "20px",
    backgroundColor: "white",
    color: "#000",
    fontFamily: "Arial, sans-serif",
    ...extraStyles,
  });
  document.body.appendChild(container);
  return container;
}

/**
 * Renders one HTML block to page-sized canvas slices, split on <tr> boundaries.
 * @returns {Promise<Array<{ canvas: HTMLCanvasElement, heightMm: number }>>}
 */
async function renderHtmlToSlices(htmlContent, { imgWidthMm, sliceHeightMm, scale, syncFromEditor, editorElementId, containerStyles }) {
  const tempContainer = createOffscreenContainer(htmlContent, containerStyles);
  try {
    if (syncFromEditor) {
      const screenEditor = document.getElementById(editorElementId);
      if (screenEditor) syncCanvases(screenEditor, tempContainer);
    }

    const canvas = await html2canvas(tempContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      scale,
      logging: false,
      removeContainer: false,
    });

    // Row boundaries in canvas pixels, used to avoid splitting a row across pages
    const containerRect = tempContainer.getBoundingClientRect();
    const domToCanvas = canvas.width / containerRect.width;
    const rowBoundaries = Array.from(tempContainer.getElementsByTagName("tr"))
      .map((tr) => {
        const rect = tr.getBoundingClientRect();
        return {
          top: (rect.top - containerRect.top) * domToCanvas,
          bottom: (rect.bottom - containerRect.top) * domToCanvas,
        };
      })
      .sort((a, b) => a.top - b.top);

    const pxPerMm = canvas.width / imgWidthMm;
    const sliceHeightPx = sliceHeightMm * pxPerMm;
    const slices = [];
    let sourceY = 0;

    while (sourceY < canvas.height) {
      const limitY = sourceY + sliceHeightPx;
      let splitY = limitY;

      if (limitY >= canvas.height) {
        splitY = canvas.height;
      } else {
        const crossedRow = rowBoundaries.find((r) => r.top < limitY && r.bottom > limitY);
        if (crossedRow && crossedRow.top > sourceY) {
          splitY = crossedRow.top;
        } else {
          const lastRowBefore = [...rowBoundaries].reverse().find((r) => r.bottom <= limitY && r.bottom > sourceY);
          if (lastRowBefore) splitY = lastRowBefore.bottom;
        }
      }

      const heightPx = Math.min(splitY - sourceY, canvas.height - sourceY);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = heightPx;
      const sliceCtx = sliceCanvas.getContext("2d");
      if (sliceCtx) {
        sliceCtx.drawImage(canvas, 0, sourceY, canvas.width, heightPx, 0, 0, canvas.width, heightPx);
      }
      slices.push({ canvas: sliceCanvas, heightMm: heightPx / pxPerMm });
      sourceY += heightPx;
    }

    return slices;
  } finally {
    if (tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
  }
}

/**
 * Builds a PDF from a list of HTML documents (each starts on a new page) and saves or returns it.
 */
async function buildPdf(documents, options, defaults) {
  const opts = { ...defaults, ..._pdfExportConfig, ...options };
  const { filename, format, orientation, margin, quality, onProgress, returnBlob, editorElementId, containerStyles } = opts;

  const pdf = new jsPDF({ orientation, unit: "mm", format });
  const imgWidthMm = pdf.internal.pageSize.getWidth() - margin * 2;
  const sliceHeightMm = pdf.internal.pageSize.getHeight() - margin * 2 - 10; // Leave room for header/footer

  let pageCount = 0;
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    if (documents.length > 1) {
      onProgress?.(`Processing sheet ${i + 1}/${documents.length}: ${doc.name}...`);
    }
    onProgress?.(documents.length > 1 ? `Generating Pdf: File ${i + 1}...` : "Loading File...");

    const slices = await renderHtmlToSlices(doc.htmlContent, {
      imgWidthMm,
      sliceHeightMm,
      scale: quality,
      syncFromEditor: doc.syncFromEditor,
      editorElementId,
      containerStyles,
    });

    onProgress?.(documents.length > 1 ? `Adding sheet ${i + 1} to PDF...` : "Adding content to PDF...");
    for (const slice of slices) {
      if (pageCount > 0) pdf.addPage();
      pageCount++;
      pdf.addImage(slice.canvas.toDataURL("image/png"), "PNG", margin, margin + 5, imgWidthMm, slice.heightMm, undefined, "FAST");
    }
  }

  onProgress?.("Adding headers and footers...");
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    addHeaderAndFooter(pdf, page, pageCount, opts);
  }

  if (returnBlob) {
    onProgress?.("PDF generated successfully!");
    return pdf.output("blob");
  }
  pdf.save(`${filename}.pdf`);
  onProgress?.("PDF saved successfully!");
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Converts an HTML string (usually getCurrentHTMLContent()) to a PDF.
 * Charts on the live editor are copied into the export.
 * @param {string} htmlContent
 * @param {object} [options] - See PdfExportOptions in pdf-export.d.ts
 * @returns {Promise<Blob | void>} A Blob when options.returnBlob is true, otherwise the file is downloaded.
 */
export async function exportHTMLAsPDF(htmlContent, options = {}) {
  ensureEnabled();
  try {
    options.onProgress?.("Preparing HTML content...");
    return await buildPdf([{ name: "Sheet", htmlContent, syncFromEditor: true }], options, {
      filename: "document",
      quality: 4,
    });
  } catch (error) {
    throw new Error("Failed to generate PDF. Please try again.", { cause: error });
  }
}

/**
 * Converts several sheets (usually getAllSheetsData()) into one PDF; each sheet starts on a new page.
 * @param {Array<{ id: string, name: string, htmlContent: string }>} sheetsData
 * @param {object} [options] - See PdfExportOptions in pdf-export.d.ts
 * @returns {Promise<Blob | void>}
 */
export async function exportAllSheetsAsPDF(sheetsData, options = {}) {
  ensureEnabled();
  try {
    if (!sheetsData || sheetsData.length === 0) {
      throw new Error("No sheets data provided");
    }
    options.onProgress?.(`Starting export of ${sheetsData.length} sheets...`);

    // Only the sheet on screen has live chart canvases to copy
    const activeSheetId = getCurrentSheetId();
    const documents = sheetsData.map((sheet) => ({
      name: sheet.name,
      htmlContent: sheet.htmlContent,
      syncFromEditor: !!activeSheetId && sheet.id === activeSheetId,
    }));

    return await buildPdf(documents, options, {
      filename: "all_sheets",
      quality: 2,
      containerStyles: { fontSize: "12px", lineHeight: "1.4" },
    });
  } catch (error) {
    throw new Error("Failed to generate combined PDF. Please try again.", { cause: error });
  }
}

/**
 * Exports the active sheet of the workbook as a PDF.
 * @param {object} [options]
 * @returns {Promise<Blob | void>}
 */
export function exportCurrentSheetAsPDF(options = {}) {
  const htmlContent = getCurrentHTMLContent();
  if (!htmlContent || htmlContent.trim() === "") {
    return Promise.reject(new Error("No content available to export as PDF"));
  }
  return exportHTMLAsPDF(htmlContent, options);
}

/**
 * Exports every sheet of the workbook as one PDF.
 * @param {object} [options]
 * @returns {Promise<Blob | void>}
 */
export function exportWorkbookAsPDF(options = {}) {
  return exportAllSheetsAsPDF(getAllSheetsData(), options);
}

/**
 * Reads a Blob as base64 without the "data:...;base64," prefix
 * (the form Capacitor Filesystem.writeFile expects). Same as blobToBase64 from "socialcalc-ai".
 */
export const pdfBlobToBase64 = blobToBase64;

// ─── Plugin lifecycle ───────────────────────────────────────────────────────

/**
 * Enable the PDF export plugin, optionally setting default options.
 * @param {object} [options]
 */
export function enablePdfExport(options) {
  _pdfExportEnabled = true;
  if (options && typeof options === "object") configurePdfExport(options);
}

/**
 * Disable the PDF export plugin. Export calls reject while disabled.
 */
export function disablePdfExport() {
  _pdfExportEnabled = false;
}

export function isPdfExportEnabled() {
  return _pdfExportEnabled;
}

export function togglePdfExport(forceState) {
  const next = typeof forceState === "boolean" ? forceState : !_pdfExportEnabled;
  if (next) enablePdfExport();
  else disablePdfExport();
  return _pdfExportEnabled;
}

/**
 * Set default options used by every export (format, orientation, margin, headerText, footerText, ...).
 * Per-call options still win.
 * @param {object} config
 */
export function configurePdfExport(config = {}) {
  _pdfExportConfig = { ..._pdfExportConfig, ...config };
  return { ..._pdfExportConfig };
}

export function getPdfExportConfig() {
  return { ..._pdfExportConfig };
}

registerPlugin("pdfExport", {
  metadata: {
    displayName: "Offline PDF Export",
    description: "Generates multi-page PDFs of one or all sheets on the device (jsPDF + html2canvas)",
  },
  enable: enablePdfExport,
  disable: disablePdfExport,
  isEnabled: isPdfExportEnabled,
  toggle: togglePdfExport,
  configure: configurePdfExport,
  // Used by the share plugin (email / print as PDF) when this plugin is installed
  api: { exportHTMLAsPDF, exportAllSheetsAsPDF, exportCurrentSheetAsPDF, exportWorkbookAsPDF },
});

if (typeof window !== "undefined") {
  window.SocialCalc = window.SocialCalc || {};
  window.SocialCalc.exportHTMLAsPDF = exportHTMLAsPDF;
  window.SocialCalc.exportAllSheetsAsPDF = exportAllSheetsAsPDF;
  window.SocialCalc.exportCurrentSheetAsPDF = exportCurrentSheetAsPDF;
  window.SocialCalc.exportWorkbookAsPDF = exportWorkbookAsPDF;
}
