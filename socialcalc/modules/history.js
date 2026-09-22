// Undo/Redo functionality
import { getEditor } from "./runtime.js";

function scheduleOnEditor(command) {
  var editor = getEditor();
  if (!editor) {
    console.warn("[SocialCalc] " + command + ": spreadsheet is not initialized");
    return;
  }
  // The editor re-renders afterwards and queues the step if a recalc is running
  editor.EditorScheduleSheetCommands(command, true, false);
}

/** Undo the last change on the active sheet. */
export function undo() {
  scheduleOnEditor("undo");
}

/** Redo the last undone change on the active sheet. */
export function redo() {
  scheduleOnEditor("redo");
}
