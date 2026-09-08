/**
 * Grid Lines Plugin for SocialCalc
 * 
 * Dynamically toggles spreadsheet cell grid lines on/off.
 */

import { getActiveEditor, getActiveSpreadsheet, registerPlugin } from "./plugin-manager.js";

let SocialCalc;

if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  SocialCalc = {};
}

let _gridLinesEnabled = false;
const DEFAULT_GRID_CSS = "1px solid #e2e8f0;";

/**
 * Re-render the active editor
 */
function refreshEditor() {
  const editor = getActiveEditor();
  const spreadsheet = getActiveSpreadsheet();

  if (editor) {
    if (editor.FitToEditTable) editor.FitToEditTable();
    if (editor.ScheduleRender) editor.ScheduleRender();
  }
  if (spreadsheet && spreadsheet.ExecuteCommand) {
    try {
      spreadsheet.ExecuteCommand("redisplay", "");
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Enable spreadsheet grid lines
 * @param {string} [gridCss]
 */
export function enableGridLines(gridCss = DEFAULT_GRID_CSS) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.Constants) return;

  _gridLinesEnabled = true;
  SocialCalc.Constants.defaultGridCSS = gridCss;

  const editor = getActiveEditor();
  if (editor && editor.context) {
    editor.context.showGrid = true;
    editor.context.gridCSS = gridCss;
  }

  const spreadsheet = getActiveSpreadsheet();
  if (spreadsheet && spreadsheet.context) {
    spreadsheet.context.showGrid = true;
    spreadsheet.context.gridCSS = gridCss;
  }

  refreshEditor();
}

export const initGridLines = enableGridLines;

/**
 * Disable spreadsheet grid lines
 */
export function disableGridLines() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc) return;

  _gridLinesEnabled = false;

  const editor = getActiveEditor();
  if (editor && editor.context) {
    editor.context.showGrid = false;
  }

  const spreadsheet = getActiveSpreadsheet();
  if (spreadsheet && spreadsheet.context) {
    spreadsheet.context.showGrid = false;
  }

  refreshEditor();
}

/**
 * Toggle spreadsheet grid lines
 * @param {boolean} [show]
 */
export function toggleGridLines(show) {
  const next = typeof show === "boolean" ? show : !_gridLinesEnabled;
  if (next) {
    enableGridLines();
  } else {
    disableGridLines();
  }
  return _gridLinesEnabled;
}

/**
 * Check if grid lines are enabled
 */
export function isGridLinesEnabled() {
  return _gridLinesEnabled;
}

// Register as a plugin in the plugin manager
registerPlugin("gridLines", {
  metadata: {
    displayName: "Grid Lines",
    description: "Toggles spreadsheet cell border grid lines"
  },
  enable: enableGridLines,
  disable: disableGridLines,
  isEnabled: isGridLinesEnabled,
  toggle: toggleGridLines
});
