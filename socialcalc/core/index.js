/* eslint-disable */
// SocialCalc Core Index - Imports all core modules
// This replaces the monolithic SocialCalc.js file
// See README.md in this folder for what each module provides.

// Import all core modules in dependency order.
// Every file extends the same global SocialCalc object, so this list is the load order:
// later files use (and environment.js overrides) what earlier files define.
import "./constants.js";           // Must be first - SocialCalc.Constants (strings, styles, defaults)
import "./sheet.js";               // Cell, Sheet, save format, commands, recalc, undo, clipboard
import "./render.js";              // RenderContext, coordinate/DOM helpers, value display
import "./touch.js";               // Touch detection and gestures
import "./format-number.js";       // Number and date formatting
import "./formula.js";             // Formula tokenizer, parser, evaluator, function registry
import "./formula-functions.js";   // Built-in spreadsheet functions, sheet cache
import "./popup.js";               // Popup List and ColorChooser widgets
import "./table-editor.js";        // TableEditor grid, mouse, navigation, InputBox
import "./editor-widgets.js";      // CellHandles, TableControl, drag/tooltip/button/wheel, keyboard
import "./spreadsheet-control.js"; // SpreadsheetControl: tabs, formula bar, settings controls
import "./workbook.js";            // WorkBook, WorkBookControl, SheetBar (multi-sheet)
import "./environment.js";         // Must be last - JSON polyfill, app overrides, server/worker shims

// The modules above all contribute to the global SocialCalc object
// which is available as window.SocialCalc or global.SocialCalc

// Export the global SocialCalc for ES module compatibility
let SocialCalc;
if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  console.error("SocialCalc not found after loading core modules");
  SocialCalc = {}; // Fallback
}

export default SocialCalc;
export { SocialCalc };
