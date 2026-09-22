// User prompt and input functions
import { showFormattingButtons } from "./utils.js";

import { SocialCalcRef, buildSetValueCommands } from "./runtime.js";

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
  if (wval.eccord) {
    wval.ecoord = null;
    console.log("return due to ecoord");
    return;
  }
  wval.ecoord = coord;
  if (!coord) coord = editor.ecell.coord;
  var text = SocialCalc.GetCellContents(editor.context.sheetobj, coord);
  console.log("in enhanced prompt, coord = " + coord + " text=" + text);

  if (
    SocialCalc.Constants.SCNoQuoteInInputBox &&
    text.substring(0, 1) === "'"
  ) {
    text = text.substring(1);
  }

  var cell = SocialCalc.GetEditorCellElement(
    editor,
    editor.ecell.row,
    editor.ecell.col
  );

  var okfn = function (val) {
    if (val === null || val === undefined) return;

    var callbackfn = function () {
      console.log("callback val " + val);

      // Create command to set cell text/value (encoded, so ":", "\" and newlines survive)
      var cellRef = editor.ecell.coord;
      var cmd = buildSetValueCommands(cellRef, typeof val === "number" ? val : val.toString()).join("\n");

      if (editor.context && editor.context.sheetobj) {
        // Use ExecuteWorkBookControlCommand if available to handle undo/redo properly
        if (control && control.ExecuteWorkBookControlCommand) {
          var commandObj = {
            cmdtype: "scmd",
            id: control.currentSheetButton ? control.currentSheetButton.id : "sheet1",
            cmdstr: cmd,
            saveundo: true
          };
          control.ExecuteWorkBookControlCommand(commandObj, false);
        } else {
          // Fallback to simpler execution if control is not fully available (unlikely)
          editor.EditorScheduleSheetCommands(cmd, true, false);
        }
      }
    };
    // Execute callback synchronously to avoid race conditions with formatting application
    const safeCallbackfn = function () {
      try {
        callbackfn();
      } catch (e) {
        console.error("Error in cell edit callback:", e);
      }
    };
    safeCallbackfn();
  };

  // highlight the cell
  delete highlights[editor.ecell.coord];
  highlights[editor.ecell.coord] = "cursor";
  editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);

  var celltext = "Enter Value";
  var title = "Input";
  if (constraint) {
  } else {
    console.log("cell text is null");
  }

  var options = { title: title };
  options["message"] = celltext;
  console.log("text is " + text);
  options["textvalue"] = text;

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
