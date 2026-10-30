// User prompt and input functions
import { showFormattingButtons } from "./utils.js";

import { SocialCalcRef, getCellEditText } from "./runtime.js";
import { commitCellEdit } from "./listeners.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

// Constraint for the cursor cell, or undefined when no constraints are defined
function cursorConstraint(editor) {
  if (!editor || !editor.ecell) return undefined;
  var cellname = editor.workingvalues.currentsheet + "!" + editor.ecell.coord;
  var constraints = SocialCalc.EditableCells && SocialCalc.EditableCells.constraints;
  return constraints ? constraints[cellname] : undefined;
}

function activeEditor() {
  var control = SocialCalc.GetCurrentWorkBookControl ? SocialCalc.GetCurrentWorkBookControl() : null;
  return control && control.workbook ? control.workbook.spreadsheet.editor : null;
}

export function mustshowprompt(coord) {
  cursorConstraint(activeEditor());
  // for phone apps always show prompt
  return true;
}

export function getinputtype(coord) {
  cursorConstraint(activeEditor());
  return null;
}

export function prompttype(coord) {
  cursorConstraint(activeEditor());
  return null;
}

export function showprompt(coord) {
  // Use the enhanced prompt with formatting buttons
  return enhancedShowPrompt(coord);
}

export function enhancedShowPrompt(coord) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var editor = control.workbook.spreadsheet.editor;
  var constraint = cursorConstraint(editor);
  var highlights = editor.context.highlights;

  var wval = editor.workingvalues;
  if (!coord) coord = editor.ecell.coord;
  wval.ecoord = coord;
  // Raw editable text: "=formula", a constant's typed text ("$1,200"), or the plain value
  var text = getCellEditText(editor.context.sheetobj, coord);

  var cell = SocialCalc.GetEditorCellElement(
    editor,
    editor.ecell.row,
    editor.ecell.col
  );

  var okfn = function (val) {
    if (val === null || val === undefined) return;
    try {
      // Write to the cell this prompt was opened for (the cursor may have moved since), through
      // the before-commit hooks and the engine's command queue
      return commitCellEdit(coord, typeof val === "number" ? val : val.toString());
    } catch (e) {
      console.error("Error in cell edit callback:", e);
      return false;
    }
  };

  // highlight the cell
  delete highlights[editor.ecell.coord];
  highlights[editor.ecell.coord] = "cursor";
  editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);

  // Dispatch custom event for React modal to handle
  const cellEditEvent = new CustomEvent('socialcalc:cell-edit-request', {
    detail: {
      coord: coord,
      text: text,
      okfn: okfn,
      // Cleanup function for when modal closes
      cleanup: function () {
        wval.ecoord = null;
        delete highlights[editor.ecell.coord];
        editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
      }
    }
  });
  window.dispatchEvent(cellEditEvent);

  return true;
}
