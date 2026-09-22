/**
 * SocialCalc event bus
 *
 * One place to subscribe to spreadsheet activity. Every event is also dispatched on
 * `window` as a CustomEvent named `socialcalc:<name>`, so plain DOM listeners work too.
 *
 * Events:
 *   ready            {sheetId}                         workbook control initialized
 *   load             {sheetId, sheets}                 a workbook was loaded and activated
 *   command          {sheetId, cmdtype, cmdstr, saveundo, timestamp}
 *   cell-change      {coord, value, range, sheetId, kind, cmdstr, changes, source}
 *   selection-change {coord, range, sheetId}
 *   sheet-change     {sheetId, name, previousSheetId}
 *   recalc           {status: "start" | "finished", ms?}
 *   render           {status}
 *   (also used by plugins: validation-error, autosave, save-request, find-request,
 *    plus the existing cell-edit-request, row-header-click, plugin-change, horizontal-scroll)
 */

import { getSocialCalc, getEditor, getCurrentSheetId, getSheetIds, getSheetName } from "./runtime.js";

export const SOCIALCALC_EVENTS = [
  "ready",
  "load",
  "command",
  "cell-change",
  "selection-change",
  "sheet-change",
  "recalc",
  "render",
  "validation-error",
  "autosave",
  "save-request",
  "find-request",
  "cell-edit-request",
  "row-header-click",
  "plugin-change",
  "horizontal-scroll",
];

const _handlers = new Map(); // name -> Set<handler>
const _windowForwarders = new Map(); // name -> DOM listener
const BUS_MARK = "__socialcalcBus";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.addEventListener === "function";
}

function ensureWindowForwarder(name) {
  if (!hasWindow() || _windowForwarders.has(name)) return;
  const forwarder = (event) => {
    if (event && event[BUS_MARK]) return; // already delivered by emit()
    deliver(name, event ? event.detail : undefined);
  };
  window.addEventListener(`socialcalc:${name}`, forwarder);
  _windowForwarders.set(name, forwarder);
}

function deliver(name, detail) {
  const set = _handlers.get(name);
  if (!set) return;
  for (const handler of Array.from(set)) {
    try {
      handler(detail);
    } catch (err) {
      console.error(`[SocialCalc events] handler for "${name}" threw:`, err);
    }
  }
}

/**
 * Subscribe to an event. Also receives the same event when it is dispatched on window by other code.
 * @param {string} name
 * @param {(detail: any) => void} handler
 * @returns {() => void} unsubscribe
 */
export function on(name, handler) {
  installEventHooks();
  if (!_handlers.has(name)) _handlers.set(name, new Set());
  _handlers.get(name).add(handler);
  ensureWindowForwarder(name);
  return () => off(name, handler);
}

/**
 * Subscribe for a single occurrence.
 * @param {string} name
 * @param {(detail: any) => void} handler
 * @returns {() => void} unsubscribe
 */
export function once(name, handler) {
  const unsubscribe = on(name, (detail) => {
    unsubscribe();
    handler(detail);
  });
  return unsubscribe;
}

/**
 * Remove a handler added with on().
 * @param {string} name
 * @param {(detail: any) => void} handler
 */
export function off(name, handler) {
  const set = _handlers.get(name);
  if (set) set.delete(handler);
}

/**
 * Emit an event to bus subscribers and as `socialcalc:<name>` on window.
 * @param {string} name
 * @param {any} [detail]
 */
export function emit(name, detail) {
  deliver(name, detail);
  if (hasWindow() && typeof CustomEvent === "function") {
    const event = new CustomEvent(`socialcalc:${name}`, { detail });
    event[BUS_MARK] = true;
    window.dispatchEvent(event);
  }
}

// ─── Command parsing ────────────────────────────────────────────────────────

const RANGE_RE = /^\$?[A-Za-z]{1,2}\$?\d+(:\$?[A-Za-z]{1,2}\$?\d+)?$/;
const VALUE_ATTRIBS = { value: 1, text: 1, formula: 1, constant: 1, empty: 1, all: 1 };

function decodeText(text) {
  const sc = getSocialCalc();
  return sc && typeof sc.decodeFromSave === "function" ? sc.decodeFromSave(text) : text;
}

function topLeft(range) {
  return String(range).split(":")[0].replace(/\$/g, "").toUpperCase();
}

/**
 * Describes which cells a command string touches.
 * @param {string} cmdstr
 * @returns {{ coord: string, range: string, kind: "value" | "format" | "structure", value?: string }[]}
 */
export function describeCommandChanges(cmdstr) {
  const changes = [];
  for (const line of String(cmdstr || "").split("\n")) {
    const parts = line.trim().split(" ");
    const cmd = parts[0];
    if (!cmd) continue;
    switch (cmd) {
      case "set": {
        const target = parts[1] || "";
        if (!RANGE_RE.test(target)) break; // sheet / column attributes
        const attrib = parts[2];
        const change = { coord: topLeft(target), range: target.toUpperCase(), kind: VALUE_ATTRIBS[attrib] ? "value" : "format" };
        if (attrib === "value") change.value = parts.slice(4).join(" ");
        else if (attrib === "text") change.value = decodeText(parts.slice(4).join(" "));
        else if (attrib === "formula") change.value = "=" + parts.slice(3).join(" ");
        else if (attrib === "constant") change.value = decodeText(parts.slice(5).join(" "));
        else if (attrib === "empty") change.value = "";
        changes.push(change);
        break;
      }
      case "erase":
      case "cut":
      case "paste":
      case "fillright":
      case "filldown":
      case "sort":
        if (RANGE_RE.test(parts[1] || "")) changes.push({ coord: topLeft(parts[1]), range: parts[1].toUpperCase(), kind: "value" });
        break;
      case "movepaste":
      case "moveinsert":
        if (RANGE_RE.test(parts[2] || "")) changes.push({ coord: topLeft(parts[2]), range: parts[2].toUpperCase(), kind: "value" });
        break;
      case "insertrow":
      case "insertcol":
      case "deleterow":
      case "deletecol":
      case "merge":
      case "unmerge":
        if (RANGE_RE.test(parts[1] || "")) changes.push({ coord: topLeft(parts[1]), range: parts[1].toUpperCase(), kind: "structure" });
        break;
      default:
        break;
    }
  }
  return changes;
}

// ─── Hooks into the engine ──────────────────────────────────────────────────

const _pendingChanges = [];
let _flushTimer = null;
let _lastSheetId = null;
const _hookedEditors = typeof WeakSet === "function" ? new WeakSet() : new Set();

function flushCellChanges(sheetId) {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  const batch = sheetId ? _pendingChanges.filter((p) => p.sheetId === sheetId) : _pendingChanges.slice();
  for (const item of batch) {
    const index = _pendingChanges.indexOf(item);
    if (index >= 0) _pendingChanges.splice(index, 1);
    const first = item.changes[0];
    emit("cell-change", {
      coord: first.coord,
      value: first.value,
      range: first.range,
      kind: first.kind,
      sheetId: item.sheetId,
      cmdstr: item.cmdstr,
      changes: item.changes,
      source: "command",
    });
  }
  if (_pendingChanges.length) scheduleFlush();
}

function scheduleFlush() {
  if (_flushTimer) clearTimeout(_flushTimer);
  // Fallback for commands on non-active sheets, whose completion is not reported to the editor.
  _flushTimer = setTimeout(() => flushCellChanges(null), 400);
}

function currentSelection(editor) {
  const coord = editor && editor.ecell ? editor.ecell.coord : null;
  let range = coord;
  const r = editor && editor.range;
  const sc = getSocialCalc();
  if (r && r.hasrange && sc && sc.crToCoord) {
    range = `${sc.crToCoord(r.left, r.top)}:${sc.crToCoord(r.right, r.bottom)}`;
  }
  return { coord, range, sheetId: getCurrentSheetId() };
}

/**
 * Current cell selection of the active editor.
 * @returns {{ coord: string | null, range: string | null, sheetId: string | null }}
 */
export function getSelection() {
  return currentSelection(getEditor());
}

function attachEditorHooks(editor) {
  if (!editor || _hookedEditors.has(editor)) return;
  _hookedEditors.add(editor);
  if (editor.MoveECellCallback) {
    editor.MoveECellCallback.scEvents = (ed) => emit("selection-change", currentSelection(ed));
  }
  if (editor.RangeChangeCallback) {
    editor.RangeChangeCallback.scEvents = (ed) => emit("selection-change", currentSelection(ed));
  }
  if (editor.StatusCallback) {
    editor.StatusCallback.scEvents = {
      func: (ed, status, arg) => {
        switch (status) {
          case "cmdend":
            flushCellChanges(getCurrentSheetId());
            break;
          case "calcstart":
            emit("recalc", { status: "start" });
            break;
          case "calcfinished":
            emit("recalc", { status: "finished", ms: arg });
            break;
          case "renderdone":
          case "doneposcalc":
            emit("render", { status });
            break;
          default:
            break;
        }
      },
      params: null,
    };
  }
}

function wrapOnce(sc, name, after) {
  const original = sc[name];
  if (typeof original !== "function" || original.__socialcalcEvents) return;
  const wrapped = function () {
    const result = original.apply(this, arguments);
    try {
      after.apply(this, arguments);
    } catch (err) {
      console.error(`[SocialCalc events] hook after ${name} failed:`, err);
    }
    return result;
  };
  wrapped.__socialcalcEvents = true;
  wrapped.__original = original;
  sc[name] = wrapped;
}

/**
 * Connects the bus to the engine. Safe to call many times; it is called automatically.
 * @returns {boolean} true when the engine was found
 */
export function installEventHooks() {
  const sc = getSocialCalc();
  if (!sc || !sc.Callbacks) return false;

  const previousBroadcast = sc.Callbacks.broadcast;
  if (!previousBroadcast || !previousBroadcast.__socialcalcEvents) {
    const broadcast = function (type, data) {
      if (typeof previousBroadcast === "function") {
        try {
          previousBroadcast.apply(this, arguments);
        } catch (err) {
          console.error("[SocialCalc events] previous broadcast callback threw:", err);
        }
      }
      if (type !== "execute" || !data) return;
      const sheetId = data.cmdtype === "scmd" ? data.id || getCurrentSheetId() : null;
      emit("command", {
        sheetId,
        cmdtype: data.cmdtype,
        cmdstr: data.cmdstr,
        saveundo: !!data.saveundo,
        timestamp: Date.now(),
      });
      if (data.cmdtype === "scmd") {
        const changes = describeCommandChanges(data.cmdstr);
        if (changes.length) {
          _pendingChanges.push({ sheetId, cmdstr: data.cmdstr, changes });
          scheduleFlush();
        }
      }
    };
    broadcast.__socialcalcEvents = true;
    sc.Callbacks.broadcast = broadcast;
  }

  wrapOnce(sc, "InitializeWorkBookControl", function (control) {
    const editor = control && control.workbook && control.workbook.spreadsheet && control.workbook.spreadsheet.editor;
    attachEditorHooks(editor);
    _lastSheetId = getCurrentSheetId();
    emit("ready", { sheetId: _lastSheetId });
  });

  wrapOnce(sc, "ActivateWorkBookSheet", function (workbook, sheetId) {
    if (workbook && workbook.spreadsheet) attachEditorHooks(workbook.spreadsheet.editor);
    if (sheetId && sheetId !== _lastSheetId) {
      const previousSheetId = _lastSheetId;
      _lastSheetId = sheetId;
      emit("sheet-change", { sheetId, name: getSheetName(sheetId), previousSheetId });
    }
  });

  wrapOnce(sc, "WorkBookControlLoad", function () {
    setTimeout(() => {
      _lastSheetId = getCurrentSheetId();
      emit("load", { sheetId: _lastSheetId, sheets: getSheetIds() });
    }, 250);
  });

  attachEditorHooks(getEditor());
  return true;
}

installEventHooks();
