/**
 * SocialCalc runtime helpers
 *
 * Shared, framework-agnostic access to the live SocialCalc engine plus the
 * command builders every module uses. Nothing here captures the engine at
 * import time, so modules work no matter which order they are imported in.
 */

const NOT_READY_MESSAGE =
  "SocialCalc is not initialized yet. Call initializeApp() (or mount <SocialCalcSpreadsheet>) first.";

/**
 * Returns the live global SocialCalc object, or null when the core has not been loaded.
 * @returns {any}
 */
export function getSocialCalc() {
  if (typeof window !== "undefined" && window.SocialCalc) return window.SocialCalc;
  if (typeof globalThis !== "undefined" && globalThis.SocialCalc) return globalThis.SocialCalc;
  return null;
}

function liveSocialCalc(create) {
  let sc = getSocialCalc();
  if (!sc && create) {
    sc = {};
    if (typeof window !== "undefined") window.SocialCalc = sc;
    else globalThis.SocialCalc = sc;
  }
  return sc || {};
}

/**
 * A proxy that always forwards to the current global SocialCalc object.
 * Modules use it in place of a value captured at import time.
 * @type {any}
 */
export const SocialCalcRef = new Proxy(
  {},
  {
    get: (_target, key) => liveSocialCalc(false)[key],
    set: (_target, key, value) => {
      liveSocialCalc(true)[key] = value;
      return true;
    },
    has: (_target, key) => key in liveSocialCalc(false),
    deleteProperty: (_target, key) => {
      delete liveSocialCalc(false)[key];
      return true;
    },
    ownKeys: () => Reflect.ownKeys(liveSocialCalc(false)),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(liveSocialCalc(false), key);
      if (descriptor) descriptor.configurable = true;
      return descriptor;
    },
  }
);

/**
 * The active WorkBookControl, or null before initialization.
 * @returns {any}
 */
export function getWorkbookControl() {
  const sc = getSocialCalc();
  if (!sc || typeof sc.GetCurrentWorkBookControl !== "function") return null;
  return sc.GetCurrentWorkBookControl() || null;
}

/**
 * The active SpreadsheetControl, or null before initialization.
 * @returns {any}
 */
export function getSpreadsheet() {
  const control = getWorkbookControl();
  if (control && control.workbook && control.workbook.spreadsheet) return control.workbook.spreadsheet;
  const sc = getSocialCalc();
  return (sc && sc.CurrentSpreadsheetControlObject) || null;
}

/**
 * The active TableEditor, or null before initialization.
 * @returns {any}
 */
export function getEditor() {
  const spreadsheet = getSpreadsheet();
  if (spreadsheet && spreadsheet.editor) return spreadsheet.editor;
  const sc = getSocialCalc();
  return (sc && sc._activeEditor) || null;
}

/**
 * True once a workbook with an editor and an active sheet exists.
 * @returns {boolean}
 */
export function isReady() {
  const control = getWorkbookControl();
  return !!(control && control.workbook && control.currentSheetButton && getEditor());
}

/**
 * Resolves once the spreadsheet is ready.
 * @param {{ timeout?: number, interval?: number }} [options]
 * @returns {Promise<void>}
 */
export function whenReady(options = {}) {
  const { timeout = 15000, interval = 50 } = options;
  return new Promise((resolve, reject) => {
    if (isReady()) {
      resolve();
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (isReady()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeout) {
        clearInterval(timer);
        reject(new Error(NOT_READY_MESSAGE));
      }
    }, interval);
  });
}

/**
 * Throws a descriptive error when the spreadsheet is not ready.
 * @returns {{ sc: any, control: any, spreadsheet: any, editor: any }}
 */
export function requireReady() {
  const sc = getSocialCalc();
  const control = getWorkbookControl();
  const editor = getEditor();
  if (!sc || !control || !editor) throw new Error(NOT_READY_MESSAGE);
  return { sc, control, spreadsheet: getSpreadsheet(), editor };
}

/**
 * Id of the active sheet (e.g. "sheet1"), or null.
 * @returns {string | null}
 */
export function getCurrentSheetId() {
  const control = getWorkbookControl();
  if (control && control.currentSheetButton) return control.currentSheetButton.id;
  const spreadsheet = getSpreadsheet();
  return (spreadsheet && spreadsheet.sheet && spreadsheet.sheet.sheetid) || null;
}

/**
 * All sheet ids in tab order.
 * @returns {string[]}
 */
export function getSheetIds() {
  const control = getWorkbookControl();
  return control && control.sheetButtonArr ? Object.keys(control.sheetButtonArr) : [];
}

/**
 * Display name of a sheet (the tab label).
 * @param {string} sheetId
 * @returns {string | null}
 */
export function getSheetName(sheetId) {
  const control = getWorkbookControl();
  const button = control && control.sheetButtonArr && control.sheetButtonArr[sheetId];
  if (button) return button.value;
  const entry = control && control.workbook && control.workbook.sheetArr[sheetId];
  return entry && entry.sheet ? entry.sheet.sheetname || sheetId : null;
}

/**
 * Resolves a sheet id or display name to a sheet id. Undefined/null means the active sheet.
 * @param {string | null | undefined} idOrName
 * @returns {string | null}
 */
export function resolveSheetId(idOrName) {
  if (idOrName === undefined || idOrName === null || idOrName === "") return getCurrentSheetId();
  const control = getWorkbookControl();
  if (!control || !control.workbook) return null;
  const key = String(idOrName);
  if (control.workbook.sheetArr[key]) return key;
  const lower = key.toLowerCase();
  for (const id of Object.keys(control.sheetButtonArr || {})) {
    const button = control.sheetButtonArr[id];
    if (button && String(button.value).toLowerCase() === lower) return id;
  }
  for (const id of Object.keys(control.workbook.sheetArr)) {
    const sheet = control.workbook.sheetArr[id].sheet;
    if (sheet && String(sheet.sheetname || "").toLowerCase() === lower) return id;
  }
  return null;
}

/**
 * Returns a SocialCalc.Sheet by id or name (active sheet by default). A Sheet object is passed through.
 * @param {any} [sheetOrIdOrName]
 * @returns {any}
 */
export function getSheet(sheetOrIdOrName) {
  if (sheetOrIdOrName && typeof sheetOrIdOrName === "object" && sheetOrIdOrName.cells) return sheetOrIdOrName;
  const control = getWorkbookControl();
  const id = resolveSheetId(sheetOrIdOrName);
  if (control && control.workbook && id && control.workbook.sheetArr[id]) {
    return control.workbook.sheetArr[id].sheet;
  }
  if (sheetOrIdOrName === undefined || sheetOrIdOrName === null) {
    const spreadsheet = getSpreadsheet();
    return spreadsheet ? spreadsheet.sheet : null;
  }
  return null;
}

// ─── Coordinates ────────────────────────────────────────────────────────────

const COORD_RE = /^\$?([A-Za-z]{1,2})\$?(\d+)$/;

/**
 * Converts a column number (1-based) to letters: 1 → "A", 28 → "AB".
 * @param {number} col
 * @returns {string}
 */
export function columnToLetters(col) {
  let n = Math.max(1, Math.floor(col));
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * Converts column letters to a 1-based number: "A" → 1, "AB" → 28.
 * @param {string} letters
 * @returns {number}
 */
export function lettersToColumn(letters) {
  return String(letters)
    .toUpperCase()
    .split("")
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
}

/**
 * Parses "B2" or "B2:D10" (in any corner order).
 * @param {string} range
 * @returns {{ top: number, bottom: number, left: number, right: number, topLeft: string, bottomRight: string, range: string, isSingleCell: boolean }}
 */
export function parseRange(range) {
  const parts = String(range || "").trim().split(":");
  if (parts.length < 1 || parts.length > 2) throw new Error(`Invalid range "${range}"`);
  const corners = parts.map((part) => {
    const match = part.trim().match(COORD_RE);
    if (!match) throw new Error(`Invalid cell reference "${part}" in "${range}"`);
    return { col: lettersToColumn(match[1]), row: parseInt(match[2], 10) };
  });
  const a = corners[0];
  const b = corners[1] || corners[0];
  const top = Math.min(a.row, b.row);
  const bottom = Math.max(a.row, b.row);
  const left = Math.min(a.col, b.col);
  const right = Math.max(a.col, b.col);
  const topLeft = columnToLetters(left) + top;
  const bottomRight = columnToLetters(right) + bottom;
  return {
    top,
    bottom,
    left,
    right,
    topLeft,
    bottomRight,
    range: topLeft === bottomRight ? topLeft : `${topLeft}:${bottomRight}`,
    isSingleCell: topLeft === bottomRight,
  };
}

/**
 * Calls fn(coord, col, row) for every cell in a range, row by row.
 * @param {string} range
 * @param {(coord: string, col: number, row: number) => void} fn
 */
export function forEachCellInRange(range, fn) {
  const r = parseRange(range);
  for (let row = r.top; row <= r.bottom; row++) {
    for (let col = r.left; col <= r.right; col++) {
      fn(columnToLetters(col) + row, col, row);
    }
  }
}

// ─── Value encoding and command builders ────────────────────────────────────

/**
 * Escapes text for use inside a SocialCalc command (":" → "\c", "\" → "\b", newline → "\n").
 * @param {string} text
 * @returns {string}
 */
export function encodeCommandText(text) {
  const sc = getSocialCalc();
  if (sc && typeof sc.encodeForSave === "function") return sc.encodeForSave(String(text));
  return String(text).replace(/\\/g, "\\b").replace(/:/g, "\\c").replace(/\n/g, "\\n");
}

const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const HTML_RE = /<[a-z][\s\S]*>/i;

/**
 * Builds the commands that store a raw value in a cell.
 * Numbers → value, "=..." → formula, HTML → text-html, "" / null → empty, anything else → text.
 * With detectTypes, typed constants like "$1,200", "12%", "1/2/2020" or "TRUE" are stored as
 * numbers with the matching sub-type, the same way the built-in cell editor does it.
 * @param {string} coord
 * @param {any} raw
 * @param {{ detectTypes?: boolean }} [options]
 * @returns {string[]}
 */
export function buildSetValueCommands(coord, raw, options = {}) {
  const { detectTypes = false } = options;
  if (raw === null || raw === undefined) return [`set ${coord} empty`];
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? [`set ${coord} value n ${raw}`] : [`set ${coord} empty`];
  }
  if (typeof raw === "boolean") {
    return [`set ${coord} constant nl ${raw ? 1 : 0} ${raw ? "TRUE" : "FALSE"}`];
  }
  const str = String(raw);
  if (str === "") return [`set ${coord} empty`];
  if (str.charAt(0) === "=" && str.length > 1 && str.indexOf("\n") === -1) {
    return [`set ${coord} formula ${str.substring(1)}`];
  }
  const trimmed = str.trim();
  if (trimmed !== "" && NUMBER_RE.test(trimmed)) {
    return [`set ${coord} value n ${Number(trimmed)}`];
  }
  if (HTML_RE.test(str)) {
    return [`set ${coord} text th ${encodeCommandText(str)}`, `set ${coord} textvalueformat text-html`];
  }
  if (detectTypes) {
    const sc = getSocialCalc();
    if (sc && typeof sc.DetermineValueType === "function") {
      const info = sc.DetermineValueType(str);
      if (info && info.type && info.type.charAt(0) === "n") {
        return [`set ${coord} constant ${info.type} ${info.value} ${encodeCommandText(str)}`];
      }
    }
  }
  return [`set ${coord} text t ${encodeCommandText(str)}`];
}

// ─── Fonts and colors ───────────────────────────────────────────────────────

/**
 * Parses a SocialCalc font value ("italic bold 12pt Arial", "* 14px *", "* * *").
 * Also repairs the malformed "* * 14px *" form written by older versions.
 * @param {string | null | undefined} value
 * @returns {{ style: string | null, weight: string | null, size: string | null, family: string | null }}
 */
export function parseFontValue(value) {
  const empty = { style: null, weight: null, size: null, family: null };
  const str = String(value || "").trim();
  if (!str) return empty;
  const star = (s) => (s === undefined || s === null || s === "*" ? null : s);
  let m = str.match(/^\* \* (\S+) (.+)$/);
  if (m && m[1] !== "*") return { style: null, weight: null, size: star(m[1]), family: star(m[2]) };
  m = str.match(/^(\*|\S+ \S+) (\S+) (.+)$/);
  if (!m) return empty;
  const look = m[1] === "*" ? [null, null] : m[1].split(" ");
  return { style: star(look[0]), weight: star(look[1]), size: star(m[2]), family: star(m[3]) };
}

/**
 * Builds a SocialCalc font value. Missing parts become "*" (use the default).
 * `bold` / `italic` are shortcuts for weight / style.
 * @param {{ style?: string | null, weight?: string | null, size?: string | null, family?: string | null, bold?: boolean, italic?: boolean }} font
 * @returns {string}
 */
export function buildFontValue(font = {}) {
  let style = font.style || null;
  let weight = font.weight || null;
  if (typeof font.italic === "boolean") style = font.italic ? "italic" : "normal";
  if (typeof font.bold === "boolean") weight = font.bold ? "bold" : "normal";
  const look = style || weight ? `${style || "normal"} ${weight || "normal"}` : "*";
  return `${look} ${font.size || "*"} ${font.family || "*"}`;
}

/**
 * Applies a partial font change on top of an existing font value.
 * @param {string | null | undefined} existing
 * @param {{ style?: string | null, weight?: string | null, size?: string | null, family?: string | null, bold?: boolean, italic?: boolean }} patch
 * @returns {string}
 */
export function mergeFontValue(existing, patch = {}) {
  const current = parseFontValue(existing);
  const next = { ...current };
  for (const key of ["style", "weight", "size", "family"]) {
    if (patch[key] !== undefined) next[key] = patch[key] || null;
  }
  if (typeof patch.italic === "boolean") next.style = patch.italic ? "italic" : "normal";
  if (typeof patch.bold === "boolean") next.weight = patch.bold ? "bold" : "normal";
  return buildFontValue(next);
}

const NAMED_COLORS = {
  black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], green: [0, 128, 0], blue: [0, 0, 255],
  yellow: [255, 255, 0], cyan: [0, 255, 255], aqua: [0, 255, 255], magenta: [255, 0, 255], fuchsia: [255, 0, 255],
  gray: [128, 128, 128], grey: [128, 128, 128], silver: [192, 192, 192], maroon: [128, 0, 0], olive: [128, 128, 0],
  lime: [0, 255, 0], navy: [0, 0, 128], purple: [128, 0, 128], teal: [0, 128, 128], orange: [255, 165, 0],
  pink: [255, 192, 203], brown: [165, 42, 42], lightgray: [211, 211, 211], lightgrey: [211, 211, 211],
  lightblue: [173, 216, 230], lightgreen: [144, 238, 144], lightyellow: [255, 255, 224], lightpink: [255, 182, 193],
  darkgray: [169, 169, 169], darkgrey: [169, 169, 169], darkblue: [0, 0, 139], darkgreen: [0, 100, 0], darkred: [139, 0, 0],
};

/**
 * Normalizes a CSS color to "rgb(r,g,b)" when possible (#rgb, #rrggbb, rgb(), common names).
 * Anything else (rgba(), hsl(), unknown names) is returned trimmed and unchanged. Empty input returns "".
 * @param {string | null | undefined} color
 * @returns {string}
 */
export function normalizeColor(color) {
  const str = String(color || "").trim();
  if (!str) return "";
  let m = str.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split("").map((h) => parseInt(h + h, 16));
    return `rgb(${r},${g},${b})`;
  }
  m = str.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
  }
  m = str.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (m) return `rgb(${+m[1]},${+m[2]},${+m[3]})`;
  const named = NAMED_COLORS[str.toLowerCase()];
  if (named) return `rgb(${named[0]},${named[1]},${named[2]})`;
  return str;
}

/**
 * Converts a CSS color to "#rrggbb" when possible, else returns it unchanged.
 * @param {string | null | undefined} color
 * @returns {string}
 */
export function colorToHex(color) {
  const rgb = normalizeColor(color);
  const m = rgb.match(/^rgb\((\d+),(\d+),(\d+)\)$/);
  if (!m) return rgb;
  return "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
}

// ─── Running commands ───────────────────────────────────────────────────────

let _runSeq = 0;

/**
 * Runs one or more sheet commands through the editor (so undo, recalc and rendering work)
 * and resolves when the spreadsheet is idle again.
 *
 * Commands for another sheet are sent to that sheet without switching tabs; formula results
 * there are refreshed the next time the sheet is shown.
 *
 * @param {string | string[]} commands - Command string(s); several commands form one undo step.
 * @param {{ sheet?: string, saveundo?: boolean, timeout?: number }} [options]
 * @returns {Promise<void>}
 */
export function runCommands(commands, options = {}) {
  const { sheet, saveundo = true, timeout = 10000 } = options;
  const cmdstr = (Array.isArray(commands) ? commands : [commands])
    .filter((c) => c !== null && c !== undefined && String(c).trim() !== "")
    .join("\n");
  if (!cmdstr) return Promise.resolve();

  let ctx;
  try {
    ctx = requireReady();
  } catch (e) {
    return Promise.reject(e);
  }
  const { control, editor } = ctx;
  const currentId = getCurrentSheetId();
  const targetId = sheet === undefined || sheet === null ? currentId : resolveSheetId(sheet);
  if (!targetId || !control.workbook.sheetArr[targetId]) {
    return Promise.reject(new Error(`Unknown sheet "${sheet}"`));
  }

  return new Promise((resolve, reject) => {
    let finished = false;
    let cleanup = () => {};
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };
    const timer = setTimeout(finish, timeout);

    if (targetId === currentId) {
      if (editor.state !== "start") {
        clearTimeout(timer);
        reject(new Error("Cannot run commands while a cell is being edited."));
        return;
      }
      const key = `scRunCommands${++_runSeq}`;
      let sawCommandEnd = false;
      editor.StatusCallback[key] = {
        func: (ed, status) => {
          if (status === "cmdend") sawCommandEnd = true;
          if (sawCommandEnd && status === "doneposcalc" && !ed.busy) finish();
        },
        params: null,
      };
      cleanup = () => {
        clearTimeout(timer);
        delete editor.StatusCallback[key];
      };
      try {
        editor.EditorScheduleSheetCommands(cmdstr, saveundo, false);
      } catch (e) {
        cleanup();
        finished = true;
        reject(e);
      }
    } else {
      const target = control.workbook.sheetArr[targetId].sheet;
      const previous = target.statuscallback;
      const hook = function (data, status) {
        if (previous) previous.apply(this, arguments);
        if (status === "cmdend") finish();
      };
      target.statuscallback = hook;
      cleanup = () => {
        clearTimeout(timer);
        if (target.statuscallback === hook) target.statuscallback = previous;
      };
      try {
        control.ExecuteWorkBookControlCommand({ cmdtype: "scmd", id: targetId, cmdstr, saveundo }, false);
      } catch (e) {
        cleanup();
        finished = true;
        reject(e);
      }
    }
  });
}
