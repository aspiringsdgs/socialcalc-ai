/**
 * Editable Cells Only Plugin for SocialCalc
 * 
 * Restricts the Cell Edit Modal to trigger only on cells that are
 * explicitly defined as editable in the template (via SocialCalc.EditableCells).
 */

import { registerPlugin, getActiveEditor } from "./plugin-manager.js";

import { SocialCalcRef } from "./runtime.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

function getSocialCalc() {
  if (typeof window !== "undefined" && window.SocialCalc) return window.SocialCalc;
  if (typeof global !== "undefined" && global.SocialCalc) return global.SocialCalc;
  return SocialCalc || {};
}

let _editableCellsOnlyEnabled = false;

/**
 * Enable Editable Cells Only mode
 */
export function enableEditableCellsOnly() {
  _editableCellsOnlyEnabled = true;
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isEditableCellsOnlyEnabled = () => true;
  }
}

/**
 * Disable Editable Cells Only mode (allows editing any cell)
 */
export function disableEditableCellsOnly() {
  _editableCellsOnlyEnabled = false;
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isEditableCellsOnlyEnabled = () => false;
  }
}

/**
 * Check if Editable Cells Only mode is enabled
 */
export function isEditableCellsOnlyEnabled() {
  return _editableCellsOnlyEnabled;
}

/**
 * Toggle Editable Cells Only mode
 * @param {boolean} [show]
 */
export function toggleEditableCellsOnly(show) {
  _editableCellsOnlyEnabled = typeof show === "boolean" ? show : !_editableCellsOnlyEnabled;
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isEditableCellsOnlyEnabled = () => _editableCellsOnlyEnabled;
  }
  return _editableCellsOnlyEnabled;
}

/**
 * Check whether a specific cell / editor coordinate is editable
 * @param {object} editor 
 * @param {string} [coord]
 * @returns {boolean}
 */
export function isCellEditable(editor, coord) {
  const sc = getSocialCalc();
  if (!editor) {
    const activeEd = sc.GetCurrentWorkBookControl
      ? sc.GetCurrentWorkBookControl()?.workbook?.spreadsheet?.editor
      : null;
    editor = activeEd;
  }
  if (!editor) return true;

  const currentSheet =
    (editor.workingvalues && editor.workingvalues.currentsheet) || "sheet1";
  const rawCoord = coord || (editor.ecell && editor.ecell.coord);
  if (!rawCoord) return true;
  const cellCoord = String(rawCoord).toUpperCase().trim();

  // 1. Direct check on EditableCells
  if (sc.EditableCells) {
    if (!sc.EditableCells.allow) {
      return true; // allow = false means all cells are editable
    }
    const cells = sc.EditableCells.cells || {};
    if (
      cells[`${currentSheet}!${cellCoord}`] ||
      cells[`${currentSheet.toLowerCase()}!${cellCoord}`] ||
      cells[`sheet1!${cellCoord}`] ||
      cells[cellCoord]
    ) {
      return true;
    }
    return false;
  }

  // 2. Fallback to native SocialCalc callback if available
  if (sc.Callbacks && typeof sc.Callbacks.IsCellEditable === "function") {
    try {
      return Boolean(sc.Callbacks.IsCellEditable(editor));
    } catch (e) {
      // Ignore error
    }
  }

  return true;
}

/**
 * Helper function to generate editable cells object from appMapping definition
 * @param {object} appMapping
 * @param {string} [sheetName]
 * @returns {{ allow: boolean; cells: { [key: string]: boolean }; constraints: object }}
 */
export function generateEditableCells(appMapping, sheetName = "sheet1") {
  const cells = {};

  const registerCell = (rawCell, currentSheet) => {
    if (!rawCell) return;
    const c = String(rawCell).toUpperCase().trim();
    cells[`${currentSheet}!${c}`] = true;
    cells[`${currentSheet.toLowerCase()}!${c}`] = true;
    cells[`sheet1!${c}`] = true;
    if (sheetName) {
      cells[`${sheetName}!${c}`] = true;
      cells[`${sheetName.toLowerCase()}!${c}`] = true;
    }
    cells[c] = true;
  };

  const processItem = (item, currentSheet) => {
    if (!item || typeof item !== "object") return;

    // Handle direct cell items (text, image, etc.)
    if (item.editable && item.cell) {
      registerCell(item.cell, currentSheet);
    }

    // Handle form types with nested formContent (check child fields even if parent form omitted editable)
    if (item.formContent && typeof item.formContent === "object") {
      for (const [, fieldItem] of Object.entries(item.formContent)) {
        const f = fieldItem;
        if (f && f.editable && f.cell) {
          registerCell(f.cell, currentSheet);
        }
      }
    }

    // Handle table rows
    if (item.type === "table" && item.rows && item.col) {
      for (const [, colItem] of Object.entries(item.col)) {
        const col = colItem;
        if (col && col.editable && col.cell) {
          const cellRef = String(col.cell).toUpperCase().trim();
          const colLetter = cellRef.replace(/[0-9]/g, "");
          for (let row = item.rows.start; row <= item.rows.end; row++) {
            registerCell(`${colLetter}${row}`, currentSheet);
          }
        }
      }
    }
  };

  // Process all sheets in appMapping
  for (const [sheet, mappings] of Object.entries(appMapping || {})) {
    for (const [, item] of Object.entries(mappings || {})) {
      processItem(item, sheet);
      if (sheetName && sheet !== sheetName) {
        processItem(item, sheetName);
      }
    }
  }

  return { allow: true, cells, constraints: {} };
}

let _currentAppMapping = {};

/**
 * Set active app mapping and populate SocialCalc.EditableCells
 * @param {object} appMapping
 */
export function setAppMapping(appMapping) {
  _currentAppMapping = appMapping || {};
  const sc = getSocialCalc();
  if (sc) {
    sc.EditableCells = generateEditableCells(_currentAppMapping);
  }
}

/**
 * Get the current app mapping
 * @returns {object}
 */
export function getAppMapping() {
  return _currentAppMapping;
}

// Register as a SocialCalc plugin
registerPlugin("editableCellsOnly", {
  metadata: {
    displayName: "Editable Cells Only",
    description: "Restricts cell edit modal to trigger only on editable cells"
  },
  enable: enableEditableCellsOnly,
  disable: disableEditableCellsOnly,
  isEnabled: isEditableCellsOnlyEnabled,
  toggle: toggleEditableCellsOnly
});

if (typeof window !== "undefined") {
  window.SocialCalc = window.SocialCalc || {};
  window.SocialCalc.isEditableCellsOnlyEnabled = isEditableCellsOnlyEnabled;
  window.SocialCalc.enableEditableCellsOnly = enableEditableCellsOnly;
  window.SocialCalc.disableEditableCellsOnly = disableEditableCellsOnly;
  window.SocialCalc.isCellEditable = isCellEditable;
  window.SocialCalc.generateEditableCells = generateEditableCells;
}
