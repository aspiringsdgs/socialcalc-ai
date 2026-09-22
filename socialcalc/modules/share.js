/**
 * SocialCalc Share, Email & Print Plugin
 *
 * Delivers exported files the right way for the platform the app runs on:
 *
 *              | saveFile / shareFile        | sendEmail                          | printHTML
 *   iOS        | Filesystem cache + Share    | Share sheet with attachment        | Printer (AirPrint), PDF first
 *   Android    | Filesystem cache + Share    | EmailComposer with attachment      | Printer (PrintService), PDF first
 *   Web        | download / Web Share API    | Web Share with file, else mailto:  | hidden iframe + window.print()
 *
 * The Capacitor plugins are NOT imported here. The app passes the ones it has installed:
 *
 *   import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
 *   import { Share } from "@capacitor/share";
 *   import { EmailComposer } from "capacitor-email-composer";
 *   import { Printer } from "@bcyesil/capacitor-plugin-printer";
 *   configureShare({ Filesystem, Directory, Encoding, Share, EmailComposer, Printer });
 *
 * On the web none of them are needed. When "socialcalc-ai/pdf-export" is also imported,
 * email and print use it to attach / print a PDF.
 *
 * Import from "socialcalc-ai/share".
 */

import { registerPlugin, getPlugin } from "./plugin-manager.js";
import { getCurrentHTMLContent } from "./sheets.js";
import { downloadBlob, blobToBase64 } from "./exporters.js";

const ADAPTER_KEYS = ["Filesystem", "Directory", "Encoding", "Share", "EmailComposer", "Printer", "Capacitor"];

let _shareEnabled = true; // Enabled as soon as the module is imported
let _adapters = {};
let _shareConfig = {
  cleanupAfterMs: 60000, // Delete temp files from the cache this long after sharing (0 = keep)
};

function ensureEnabled() {
  if (!_shareEnabled) {
    throw new Error('Share plugin is disabled. Call enableShare() or enablePlugin("share") first.');
  }
}

function requireAdapter(name, pkg) {
  const adapter = _adapters[name];
  if (!adapter) {
    throw new Error(`The ${name} adapter is missing. Install "${pkg}" and pass it: configureShare({ ${name} }).`);
  }
  return adapter;
}

function getPdfApi() {
  const plugin = getPlugin("pdfExport");
  if (!plugin || !plugin.api) return null;
  return typeof plugin.isEnabled === "function" && !plugin.isEnabled() ? null : plugin.api;
}

// ─── Platform ───────────────────────────────────────────────────────────────

/**
 * "ios", "android" or "web", from the Capacitor runtime (web when Capacitor is absent).
 * @returns {"ios" | "android" | "web"}
 */
export function getPlatform() {
  const cap = _adapters.Capacitor || (typeof window !== "undefined" ? window.Capacitor : undefined);
  const platform = cap && typeof cap.getPlatform === "function" ? cap.getPlatform() : "web";
  return platform === "ios" || platform === "android" ? platform : "web";
}

export function isNativePlatform() {
  return getPlatform() !== "web";
}

/**
 * What each action will do on the current platform with the adapters configured.
 */
export function getShareCapabilities() {
  const platform = getPlatform();
  const native = platform !== "web";
  const webShareFiles =
    !native && typeof navigator !== "undefined" && typeof navigator.canShare === "function";
  let emailMethod;
  if (platform === "android") emailMethod = _adapters.EmailComposer ? "email-composer" : "share-sheet";
  else if (platform === "ios") emailMethod = _adapters.Share ? "share-sheet" : "email-composer";
  else emailMethod = webShareFiles ? "web-share-or-mailto" : "mailto";

  return {
    platform,
    native,
    pdfAvailable: !!getPdfApi(),
    saveMethod: native ? "share-sheet" : "download",
    emailMethod,
    printMethod: native ? "native-printer" : "browser-print",
    adapters: ADAPTER_KEYS.filter((key) => !!_adapters[key]),
    missingAdapters: native
      ? ["Filesystem", "Share", "Printer", ...(platform === "android" ? ["EmailComposer"] : [])].filter((k) => !_adapters[k])
      : [],
  };
}

// ─── Native file helpers ────────────────────────────────────────────────────

function toBlob({ blob, text, mimeType = "text/plain;charset=utf-8" }) {
  if (blob) return blob;
  if (text !== undefined && text !== null) return new Blob([String(text)], { type: mimeType });
  throw new Error("Pass either blob or text");
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Writes a file to the app cache and returns { uri, path, directory }. */
async function writeCacheFile(filename, { blob, text }) {
  const Filesystem = requireAdapter("Filesystem", "@capacitor/filesystem");
  const directory = (_adapters.Directory && _adapters.Directory.Cache) || "CACHE";
  const request = { path: filename, directory };
  if (blob) {
    request.data = await blobToBase64(blob);
  } else {
    request.data = String(text);
    request.encoding = (_adapters.Encoding && _adapters.Encoding.UTF8) || "utf8";
  }
  const result = await Filesystem.writeFile(request);
  return { uri: result.uri, path: filename, directory };
}

function scheduleCleanup(file) {
  const ms = _shareConfig.cleanupAfterMs;
  if (!ms || ms < 0 || !file) return;
  setTimeout(() => {
    Promise.resolve(_adapters.Filesystem.deleteFile({ path: file.path, directory: file.directory })).catch(() => {});
  }, ms);
}

async function nativeShareSheet(file, { title, message, dialogTitle }) {
  const Share = requireAdapter("Share", "@capacitor/share");
  try {
    await Share.share({ title, text: message, url: file.uri, dialogTitle });
  } finally {
    scheduleCleanup(file);
  }
}

function canWebShareFile(file) {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

// ─── Files ──────────────────────────────────────────────────────────────────

/**
 * "Save" an exported file: downloads it on the web; on iOS/Android writes it to the cache and
 * opens the share sheet (the way users save or send files there).
 * @param {{ blob?: Blob, text?: string, filename: string, mimeType?: string, title?: string, message?: string, dialogTitle?: string }} options
 * @returns {Promise<{ method: "download" | "share-sheet", platform: string }>}
 */
export async function saveFile(options) {
  ensureEnabled();
  const { filename, title = filename, message, dialogTitle = "Share" } = options;
  const platform = getPlatform();
  if (platform !== "web") {
    const file = await writeCacheFile(filename, { blob: options.blob, text: options.text });
    await nativeShareSheet(file, { title, message, dialogTitle });
    return { method: "share-sheet", platform };
  }
  downloadBlob(toBlob(options), filename);
  return { method: "download", platform };
}

/**
 * Share a file: the native share sheet on iOS/Android, the Web Share API in browsers that can
 * share files, otherwise a download.
 * @param {{ blob?: Blob, text?: string, filename: string, mimeType?: string, title?: string, message?: string, dialogTitle?: string }} options
 * @returns {Promise<{ method: "share-sheet" | "web-share" | "download" | "cancelled", platform: string }>}
 */
export async function shareFile(options) {
  ensureEnabled();
  const platform = getPlatform();
  if (platform !== "web") return saveFile(options);

  const { filename, title = filename, message } = options;
  const blob = toBlob(options);
  const file = new File([blob], filename, { type: blob.type });
  if (canWebShareFile(file)) {
    try {
      await navigator.share({ files: [file], title, text: message });
      return { method: "web-share", platform };
    } catch (err) {
      if (err && err.name === "AbortError") return { method: "cancelled", platform };
      // Anything else (e.g. not allowed): fall back to a download
    }
  }
  downloadBlob(blob, filename);
  return { method: "download", platform };
}

// ─── Email ──────────────────────────────────────────────────────────────────

function buildMailto({ to = [], cc = [], bcc = [], subject = "", body = "" }) {
  const params = [];
  if (cc.length) params.push(`cc=${encodeURIComponent(cc.join(","))}`);
  if (bcc.length) params.push(`bcc=${encodeURIComponent(bcc.join(","))}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${to.map(encodeURIComponent).join(",")}${params.length ? "?" + params.join("&") : ""}`;
}

/**
 * Opens an email with an optional attachment, using the best method for the platform:
 * - Android: EmailComposer (falls back to the share sheet without it)
 * - iOS: share sheet with the attachment (Mail is one of the targets), or EmailComposer without Share
 * - Web: Web Share with the file where supported, otherwise a mailto: link plus a download of the attachment
 * @param {{ to?: string[], cc?: string[], bcc?: string[], subject?: string, body?: string, isHtml?: boolean,
 *           attachment?: { blob?: Blob, text?: string, filename: string, mimeType?: string } }} options
 * @returns {Promise<{ method: "email-composer" | "share-sheet" | "web-share" | "mailto" | "cancelled", platform: string }>}
 */
export async function sendEmail(options = {}) {
  ensureEnabled();
  const { to = [], cc = [], bcc = [], subject = "", body = "", isHtml = false, attachment } = options;
  const platform = getPlatform();

  if (platform !== "web") {
    const useComposer = platform === "android" ? !!_adapters.EmailComposer : !_adapters.Share && !!_adapters.EmailComposer;
    if (useComposer) {
      const attachments = [];
      let file = null;
      if (attachment) {
        file = await writeCacheFile(attachment.filename, attachment);
        attachments.push({ type: "absolute", path: file.uri.replace("file://", ""), name: attachment.filename });
      }
      try {
        await _adapters.EmailComposer.open({ to, cc, bcc, subject, body, isHtml, attachments });
      } finally {
        scheduleCleanup(file);
      }
      return { method: "email-composer", platform };
    }

    const Share = requireAdapter("Share", "@capacitor/share");
    if (attachment) {
      const file = await writeCacheFile(attachment.filename, attachment);
      await nativeShareSheet(file, { title: subject || attachment.filename, message: body, dialogTitle: "Share via Email" });
    } else {
      await Share.share({ title: subject, text: body, dialogTitle: "Share via Email" });
    }
    return { method: "share-sheet", platform };
  }

  if (attachment) {
    const blob = toBlob(attachment);
    const file = new File([blob], attachment.filename, { type: blob.type });
    if (canWebShareFile(file)) {
      try {
        await navigator.share({ files: [file], title: subject, text: body });
        return { method: "web-share", platform };
      } catch (err) {
        if (err && err.name === "AbortError") return { method: "cancelled", platform };
      }
    }
    // mailto: cannot carry attachments, so hand the file over as a download to attach manually
    downloadBlob(blob, attachment.filename);
  }
  window.location.href = buildMailto({ to, cc, bcc, subject, body });
  return { method: "mailto", platform };
}

/**
 * Emails the active sheet. The attachment defaults to a PDF on iOS and the web (when the
 * pdf-export plugin is installed) and to HTML on Android.
 * @param {{ filename?: string, attachmentFormat?: "pdf" | "html" | "none", pdfOptions?: object,
 *           to?: string[], cc?: string[], bcc?: string[], subject?: string, body?: string, isHtml?: boolean }} [options]
 */
export async function emailCurrentSheet(options = {}) {
  ensureEnabled();
  const { filename = "Sheet", pdfOptions = {}, ...emailOptions } = options;
  const platform = getPlatform();
  const pdfApi = getPdfApi();
  let format = options.attachmentFormat || (platform === "android" ? "html" : "pdf");
  if (format === "pdf" && !pdfApi) {
    console.warn('[Share] PDF attachment needs "socialcalc-ai/pdf-export"; attaching HTML instead.');
    format = "html";
  }
  delete emailOptions.attachmentFormat;

  const html = getCurrentHTMLContent();
  let attachment;
  if (format === "pdf") {
    const blob = await pdfApi.exportHTMLAsPDF(html, { ...pdfOptions, filename, returnBlob: true });
    attachment = { blob, filename: `${filename}.pdf` };
  } else if (format === "html") {
    attachment = { text: html, filename: `${filename}.html`, mimeType: "text/html;charset=utf-8" };
  }
  return sendEmail({ ...emailOptions, attachment });
}

// ─── Print ──────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function browserPrint(html, { name, orientation }) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title>` +
        `<style>@page { size: ${orientation}; } body { margin: 0; font-family: Arial, sans-serif; }</style>` +
        `</head><body>${html}</body></html>`
    );
    doc.close();

    let done = false;
    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
    const run = () => {
      if (done) return;
      done = true;
      try {
        win.focus();
      } catch {
        // Not supported everywhere; printing still works
      }
      win.addEventListener("afterprint", () => setTimeout(cleanup, 100));
      win.print();
      setTimeout(cleanup, 60000); // In case afterprint never fires
      resolve();
    };
    // Wait for images (logos) to load before printing
    if (doc.readyState === "complete") setTimeout(run, 50);
    else win.addEventListener("load", run);
    setTimeout(run, 2000);
  });
}

/**
 * Prints HTML. On iOS/Android it uses the native Printer (AirPrint / PrintService), sending a
 * PDF when the pdf-export plugin is installed (better fidelity) and falling back to HTML.
 * In browsers it prints through a hidden iframe, so no pop-up window is needed.
 * @param {string} html
 * @param {{ name?: string, orientation?: "portrait" | "landscape", usePdf?: boolean, pdfOptions?: object }} [options]
 * @returns {Promise<{ method: "native-pdf" | "native-html" | "browser-print", platform: string }>}
 */
export async function printHTML(html, options = {}) {
  ensureEnabled();
  const { name = "Document", orientation = "portrait", usePdf = true, pdfOptions = {} } = options;
  if (!html || String(html).trim() === "") throw new Error("No content available to print");
  const platform = getPlatform();

  if (platform === "web") {
    await browserPrint(html, { name, orientation });
    return { method: "browser-print", platform };
  }

  const Printer = requireAdapter("Printer", "@bcyesil/capacitor-plugin-printer");
  const pdfApi = usePdf ? getPdfApi() : null;
  if (pdfApi) {
    try {
      const blob = await pdfApi.exportHTMLAsPDF(html, { ...pdfOptions, orientation, filename: name, returnBlob: true });
      await Printer.print({ content: `base64:${await blobToDataURL(blob)}`, name, orientation });
      return { method: "native-pdf", platform };
    } catch (err) {
      console.warn("[Share] PDF print failed, printing HTML instead:", err);
    }
  }
  await Printer.print({ content: html, name, orientation });
  return { method: "native-html", platform };
}

/**
 * Prints the active sheet.
 * @param {{ name?: string, orientation?: "portrait" | "landscape", usePdf?: boolean, pdfOptions?: object }} [options]
 */
export function printCurrentSheet(options = {}) {
  return printHTML(getCurrentHTMLContent(), options);
}

// ─── Plugin lifecycle ───────────────────────────────────────────────────────

/**
 * Pass Capacitor plugins (Filesystem, Directory, Encoding, Share, EmailComposer, Printer, Capacitor)
 * and/or options (cleanupAfterMs). Adapters you pass are merged with ones passed before.
 * @param {object} config
 */
export function configureShare(config = {}) {
  for (const key of Object.keys(config)) {
    if (ADAPTER_KEYS.includes(key)) _adapters = { ..._adapters, [key]: config[key] };
    else _shareConfig = { ..._shareConfig, [key]: config[key] };
  }
  return getShareCapabilities();
}

export function enableShare(config) {
  _shareEnabled = true;
  if (config && typeof config === "object") configureShare(config);
}

export function disableShare() {
  _shareEnabled = false;
}

export function isShareEnabled() {
  return _shareEnabled;
}

export function toggleShare(forceState) {
  const next = typeof forceState === "boolean" ? forceState : !_shareEnabled;
  if (next) enableShare();
  else disableShare();
  return _shareEnabled;
}

registerPlugin("share", {
  metadata: {
    displayName: "Share, Email & Print",
    description: "Platform-aware (iOS / Android / web) file sharing, email with attachments and printing",
  },
  enable: enableShare,
  disable: disableShare,
  isEnabled: isShareEnabled,
  toggle: toggleShare,
  configure: configureShare,
  api: { saveFile, shareFile, sendEmail, emailCurrentSheet, printHTML, printCurrentSheet, getPlatform },
});
