/**
 * Row and Column Headers Plugin for SocialCalc
 * 
 * Dynamically toggles spreadsheet row numbers (1, 2, 3, 4...) and
 * column letters (A, B, C, D...) with modern, crisp styling,
 * full row/column selection highlighting, smooth right-edge column resizing,
 * touch-friendly corner resize handle on selected column, and row insertion/deletion actions.
 */

import { getActiveEditor, getActiveSpreadsheet, registerPlugin } from "./plugin-manager.js";

import { SocialCalcRef } from "./runtime.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

let _headersEnabled = false;
let _selectedColNum = null;

const DEFAULT_HEADER_STYLES = {
  colname: "font-size:11px;font-weight:600;text-align:center;color:#475569;background-color:#f1f5f9;border:1px solid #cbd5e1;user-select:none;cursor:pointer;line-height:22px;",
  selectedColname: "font-size:11px;font-weight:700;text-align:center;color:#0f172a;background-color:#e2e8f0;border:1px solid #94a3b8;user-select:none;cursor:pointer;line-height:22px;",
  rowname: "font-size:11px;font-weight:600;text-align:center;color:#475569;background-color:#f1f5f9;border:1px solid #cbd5e1;user-select:none;padding:0 4px;line-height:20px;cursor:pointer;",
  selectedRowname: "font-size:11px;font-weight:700;text-align:center;color:#0f172a;background-color:#e2e8f0;border:1px solid #94a3b8;user-select:none;padding:0 4px;line-height:20px;cursor:pointer;",
  upperLeft: "font-size:11px;text-align:center;color:#64748b;background-color:#e2e8f0;border:1px solid #cbd5e1;"
};

const DISABLED_HEADER_STYLES = {
  colname: "",
  selectedColname: "",
  rowname: "",
  selectedRowname: "",
  upperLeft: ""
};

/**
 * Execute a SocialCalc sheet command synchronously and refresh the editor
 */
export function executeSheetCommand(cmd) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const editor = getActiveEditor();
  const spreadsheet = getActiveSpreadsheet();

  if (editor && editor.context && editor.context.sheetobj) {
    const sheet = editor.context.sheetobj;
    const parseObj = typeof cmd === "string" && SocialCalc.Parse ? new SocialCalc.Parse(cmd) : cmd;

    // 1. Direct synchronous execution on sheet
    if (SocialCalc.ExecuteSheetCommand) {
      SocialCalc.ExecuteSheetCommand(sheet, parseObj, true);
    }

    // 2. Re-render editor
    editor.state = "start";
    if (editor.SchedulePositionCalculations) editor.SchedulePositionCalculations();
    if (editor.FitToEditTable) editor.FitToEditTable();
    if (editor.EditorRenderSheet) editor.EditorRenderSheet();
    if (spreadsheet && spreadsheet.ExecuteCommand) {
      try {
        spreadsheet.ExecuteCommand("redisplay", "");
      } catch (e) {
        // ignore
      }
    }
  }
}

/**
 * Show Touch & Click Column Resize Corner Handle
 */
export function showColumnResizeHandle(colNum) {
  if (!_headersEnabled) {
    hideColumnResizeHandle();
    return;
  }
  _selectedColNum = colNum;
  updateColumnResizeHandlePosition();
}

/**
 * Hide Column Resize Corner Handle
 */
export function hideColumnResizeHandle() {
  _selectedColNum = null;
  const handle = document.getElementById("sc-col-resize-corner-handle");
  if (handle && handle.parentNode) {
    handle.parentNode.removeChild(handle);
  }
}

/**
 * Update Corner Handle position relative to active viewport
 */
export function updateColumnResizeHandlePosition() {
  if (!_headersEnabled || !_selectedColNum) {
    hideColumnResizeHandle();
    return;
  }
  const editor = getActiveEditor();
  if (!editor || !editor.colpositions || !editor.colwidth) return;

  const colNum = _selectedColNum;
  const colLetter = SocialCalc && SocialCalc.rcColname ? SocialCalc.rcColname(colNum) : String.fromCharCode(64 + colNum);

  let colRight = null;
  let headerBottom = null;

  // 1. Try finding exact header cell from DOM for pixel-perfect coordinates
  if (editor.fullgrid) {
    const cells = editor.fullgrid.querySelectorAll("td, th");
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const txt = c.textContent ? c.textContent.trim() : "";
      if (txt === colLetter) {
        const rect = c.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          colRight = Math.round(rect.right);
          headerBottom = Math.round(rect.bottom);
          break;
        }
      }
    }
  }

  // 2. Fallback to SocialCalc coordinate calculations
  if (colRight === null || headerBottom === null) {
    if (editor.colpositions && editor.colpositions[colNum] !== undefined && editor.colwidth && editor.colwidth[colNum] !== undefined) {
      colRight = editor.colpositions[colNum] + editor.colwidth[colNum];
    }
    if (editor.headposition) {
      headerBottom = editor.headposition.top;
    } else if (editor.gridposition) {
      headerBottom = editor.gridposition.top + 22;
    } else {
      headerBottom = 22;
    }
  }

  if (colRight === null || headerBottom === null) {
    hideColumnResizeHandle();
    return;
  }

  // Ensure handle element exists
  let handle = document.getElementById("sc-col-resize-corner-handle");
  if (!handle) {
    handle = document.createElement("div");
    handle.id = "sc-col-resize-corner-handle";
    handle.className = "sc-col-resize-corner-handle";
    handle.style.position = "fixed";
    handle.style.zIndex = "99999";
    handle.style.width = "24px";
    handle.style.height = "24px";
    handle.style.backgroundColor = "#2563eb";
    handle.style.color = "#ffffff";
    handle.style.borderRadius = "50%";
    handle.style.border = "2px solid #ffffff";
    handle.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
    handle.style.display = "flex";
    handle.style.alignItems = "center";
    handle.style.justifyContent = "center";
    handle.style.cursor = "col-resize";
    handle.style.touchAction = "none";
    handle.style.transform = "translate(-50%, -50%)";
    handle.style.pointerEvents = "auto";
    handle.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="8 4 4 8 8 12"></polyline>
        <polyline points="16 4 20 8 16 12"></polyline>
        <line x1="4" y1="8" x2="20" y2="8"></line>
      </svg>
    `;
    handle.title = "Drag to resize column";
    document.body.appendChild(handle);

    // Attach drag handlers (both Touch and Mouse)
    const onStart = (startEvent) => {
      startEvent.stopPropagation();
      if (startEvent.cancelable) startEvent.preventDefault();
      startCornerColumnResize(startEvent, editor, _selectedColNum);
    };

    handle.addEventListener("touchstart", onStart, { passive: false });
    handle.addEventListener("mousedown", onStart);
  }

  handle.style.left = `${colRight}px`;
  handle.style.top = `${headerBottom}px`;
  handle.style.display = "flex";
}

/**
 * Handle Drag Resizing started from corner handle or border
 */
export function startCornerColumnResize(startEvent, editor, colNum) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const isTouch = startEvent.touches && startEvent.touches.length > 0;
  const startX = isTouch ? startEvent.touches[0].clientX : startEvent.clientX;
  const startY = isTouch ? startEvent.touches[0].clientY : startEvent.clientY;
  const initialWidth =
    (editor.colwidth && editor.colwidth[colNum]) ||
    (editor.context && editor.context.colwidth && editor.context.colwidth[colNum]) ||
    50;
  const colLetter = SocialCalc.rcColname ? SocialCalc.rcColname(colNum) : String.fromCharCode(64 + colNum);

  // Remove any previous guide or tooltip
  const existing = document.querySelectorAll(".sc-col-resize-guide, .sc-col-resize-tooltip");
  existing.forEach((el) => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  // Vertical guideline
  const guide = document.createElement("div");
  guide.className = "sc-col-resize-guide";
  guide.style.position = "fixed";
  guide.style.top = "0";
  guide.style.bottom = "0";
  guide.style.width = "1px";
  guide.style.backgroundColor = "#94a3b8";
  guide.style.zIndex = "99999";
  guide.style.pointerEvents = "none";
  guide.style.left = `${startX}px`;
  document.body.appendChild(guide);

  // Floating width tooltip
  const tooltip = document.createElement("div");
  tooltip.className = "sc-col-resize-tooltip";
  tooltip.style.position = "fixed";
  tooltip.style.top = `${Math.max(10, startY - 34)}px`;
  tooltip.style.left = `${startX + 10}px`;
  tooltip.style.backgroundColor = "#334155";
  tooltip.style.color = "#ffffff";
  tooltip.style.padding = "3px 8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "11px";
  tooltip.style.fontWeight = "600";
  tooltip.style.zIndex = "100000";
  tooltip.style.pointerEvents = "none";
  tooltip.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  tooltip.textContent = `${colLetter}: ${initialWidth}px`;
  document.body.appendChild(tooltip);

  let currentWidth = initialWidth;

  const onMove = (moveEvent) => {
    const clientX = moveEvent.touches && moveEvent.touches.length > 0
      ? moveEvent.touches[0].clientX
      : moveEvent.clientX;
    const clientY = moveEvent.touches && moveEvent.touches.length > 0
      ? moveEvent.touches[0].clientY
      : moveEvent.clientY;

    const delta = clientX - startX;
    const minWidth = (SocialCalc && SocialCalc.Constants && SocialCalc.Constants.defaultMinimumColWidth) || 10;
    currentWidth = Math.max(minWidth, Math.round(initialWidth + delta));

    guide.style.left = `${clientX}px`;
    tooltip.style.left = `${clientX + 10}px`;
    tooltip.style.top = `${Math.max(10, clientY - 34)}px`;
    tooltip.textContent = `${colLetter}: ${currentWidth}px`;

    const handle = document.getElementById("sc-col-resize-corner-handle");
    if (handle) {
      handle.style.left = `${clientX}px`;
    }

    if (moveEvent.cancelable) moveEvent.preventDefault();
  };

  const onEnd = (endEvent) => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onEnd, true);
    document.removeEventListener("touchmove", onMove, true);
    document.removeEventListener("touchend", onEnd, true);
    document.removeEventListener("touchcancel", onEnd, true);

    if (guide.parentNode) guide.parentNode.removeChild(guide);
    if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);

    // Apply the column width update
    setColumnWidth(colNum, currentWidth);
    setTimeout(() => {
      showColumnResizeHandle(colNum);
    }, 60);

    if (endEvent.cancelable) endEvent.preventDefault();
  };

  document.addEventListener("mousemove", onMove, { capture: true, passive: false });
  document.addEventListener("mouseup", onEnd, { capture: true, passive: false });
  document.addEventListener("touchmove", onMove, { capture: true, passive: false });
  document.addEventListener("touchend", onEnd, { capture: true, passive: false });
  document.addEventListener("touchcancel", onEnd, { capture: true, passive: false });
}

/**
 * Select and highlight an entire column
 * @param {number} colNum 1-based column number
 */
export function selectColumn(colNum) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const editor = getActiveEditor();
  if (!editor || !editor.context || !editor.context.sheetobj) return;

  const colLetter = SocialCalc.rcColname ? SocialCalc.rcColname(colNum) : String.fromCharCode(64 + colNum);
  const lastRow = editor.context.sheetobj.attribs?.lastrow || 50;

  editor.MoveECell(colLetter + "1");
  if (editor.range && editor.range.hasrange) {
    editor.RangeRemove();
  }
  editor.RangeAnchor(colLetter + "1");
  editor.RangeExtend(colLetter + lastRow);
  editor.SchedulePositionCalculations();
  editor.ScheduleRender();

  // Show corner resize handle
  setTimeout(() => {
    showColumnResizeHandle(colNum);
  }, 30);
}

/**
 * Select and highlight an entire row
 * @param {number} rowNum 1-based row number
 */
export function selectRow(rowNum) {
  hideColumnResizeHandle();
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const editor = getActiveEditor();
  if (!editor || !editor.context || !editor.context.sheetobj) return;

  const lastCol = editor.context.sheetobj.attribs?.lastcol || 26;
  const lastColLetter = SocialCalc.rcColname ? SocialCalc.rcColname(lastCol) : String.fromCharCode(64 + lastCol);

  editor.MoveECell("A" + rowNum);
  if (editor.range && editor.range.hasrange) {
    editor.RangeRemove();
  }
  editor.RangeAnchor("A" + rowNum);
  editor.RangeExtend(lastColLetter + rowNum);
  editor.SchedulePositionCalculations();
  editor.ScheduleRender();
}

/**
 * Insert row above a specific row
 * @param {number} rowNum 1-based row number
 */
export function insertRowAbove(rowNum) {
  executeSheetCommand("insertrow A" + rowNum);
  selectRow(rowNum);
}

/**
 * Insert row below a specific row
 * @param {number} rowNum 1-based row number
 */
export function insertRowBelow(rowNum) {
  executeSheetCommand("insertrow A" + (rowNum + 1));
  selectRow(rowNum + 1);
}

/**
 * Delete a specific row
 * @param {number} rowNum 1-based row number
 */
export function deleteRowAt(rowNum) {
  executeSheetCommand("deleterow A" + rowNum);
  hideColumnResizeHandle();
}

/**
 * Set column width
 * @param {number} colNum 1-based column number
 * @param {number} width Width in pixels
 */
export function setColumnWidth(colNum, width) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const colLetter = SocialCalc.rcColname ? SocialCalc.rcColname(colNum) : String.fromCharCode(64 + colNum);
  const minWidth = (SocialCalc && SocialCalc.Constants && SocialCalc.Constants.defaultMinimumColWidth) || 10;
  const clampedWidth = Math.max(minWidth, Math.round(width));
  executeSheetCommand("set " + colLetter + " width " + clampedWidth);
}

/**
 * Apply header styling to SocialCalc constants and active context
 */
function applyHeaderStyles(editor, styles = DEFAULT_HEADER_STYLES) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.Constants) return;

  SocialCalc.Constants.defaultColnameStyle = styles.colname;
  SocialCalc.Constants.defaultSelectedColnameStyle = styles.selectedColname;
  SocialCalc.Constants.defaultRownameStyle = styles.rowname;
  SocialCalc.Constants.defaultSelectedRownameStyle = styles.selectedRowname;
  SocialCalc.Constants.defaultUpperLeftStyle = styles.upperLeft;

  if (editor && editor.context && editor.context.explicitStyles) {
    editor.context.explicitStyles.colname = styles.colname;
    editor.context.explicitStyles.selectedcolname = styles.selectedColname;
    editor.context.explicitStyles.rowname = styles.rowname;
    editor.context.explicitStyles.selectedrowname = styles.selectedRowname;
    editor.context.explicitStyles.upperleft = styles.upperLeft;
    editor.context.showRCHeaders = true;
  }
}

/**
 * Re-render the active editor
 */
export function refreshEditor() {
  const editor = getActiveEditor();
  const spreadsheet = getActiveSpreadsheet();

  if (editor) {
    if (editor.SchedulePositionCalculations) editor.SchedulePositionCalculations();
    if (editor.FitToEditTable) editor.FitToEditTable();
    if (editor.EditorRenderSheet) editor.EditorRenderSheet();
    if (editor.ScheduleRender) editor.ScheduleRender();
  }
  if (spreadsheet && spreadsheet.ExecuteCommand) {
    try {
      spreadsheet.ExecuteCommand("redisplay", "");
    } catch (e) {
      // ignore
    }
  }
  updateColumnResizeHandlePosition();
}

/**
 * Enable Row and Column Headers (123 / ABCD)
 * @param {object} [customStyles]
 */
export function enableRowColHeaders(customStyles) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.Constants) return;

  _headersEnabled = true;
  SocialCalc.Constants.SCNoColNames = false;
  SocialCalc.Constants.SCNoRowName = false;
  SocialCalc.Constants.defaultRowNameWidth = "30";

  const editor = getActiveEditor();
  if (editor && editor.context) {
    editor.context.rownamewidth = "30";
  }
  applyHeaderStyles(editor, customStyles ? { ...DEFAULT_HEADER_STYLES, ...customStyles } : DEFAULT_HEADER_STYLES);
  refreshEditor();
}

/**
 * Disable Row and Column Headers
 */
export function disableRowColHeaders() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.Constants) return;

  _headersEnabled = false;
  SocialCalc.Constants.SCNoColNames = true;
  SocialCalc.Constants.SCNoRowName = true;
  SocialCalc.Constants.defaultRowNameWidth = "30";

  const editor = getActiveEditor();
  if (editor && editor.context) {
    editor.context.rownamewidth = "30";
  }
  applyHeaderStyles(editor, DISABLED_HEADER_STYLES);

  hideColumnResizeHandle();
  refreshEditor();
}

/**
 * Toggle Row and Column Headers
 * @param {boolean} [show]
 */
export function toggleRowColHeaders(show) {
  const next = typeof show === "boolean" ? show : !_headersEnabled;
  if (next) {
    enableRowColHeaders();
  } else {
    disableRowColHeaders();
  }
  return _headersEnabled;
}

/**
 * Check if Row and Column Headers are enabled
 */
export function isRowColHeadersEnabled() {
  return _headersEnabled;
}

// Window scroll and resize listeners to reposition the handle
if (typeof window !== "undefined") {
  SocialCalc = window.SocialCalc = window.SocialCalc || {};
  SocialCalc.selectColumn = selectColumn;
  SocialCalc.selectRow = selectRow;
  SocialCalc.showColumnResizeHandle = showColumnResizeHandle;
  SocialCalc.hideColumnResizeHandle = hideColumnResizeHandle;
  SocialCalc.updateColumnResizeHandlePosition = updateColumnResizeHandlePosition;

  window.addEventListener("resize", updateColumnResizeHandlePosition);
  window.addEventListener("socialcalc:horizontal-scroll", updateColumnResizeHandlePosition);
  window.addEventListener("socialcalc:scroll", updateColumnResizeHandlePosition);
}

// Register as a plugin in the plugin manager
registerPlugin("rowColHeaders", {
  metadata: {
    displayName: "Row & Column Headers",
    description: "Displays spreadsheet 123 row and ABCD column headers"
  },
  enable: enableRowColHeaders,
  disable: disableRowColHeaders,
  isEnabled: isRowColHeadersEnabled,
  toggle: toggleRowColHeaders
});
