// Cell and sheet formatting functions
import {
  getSocialCalc as getLiveSocialCalc,
  getWorkbookControl,
  getEditor,
  buildSetValueCommands,
  mergeFontValue,
  parseFontValue,
} from "./runtime.js";

function getSocialCalc() {
  return getLiveSocialCalc() || {};
}

function activeEditorOrWarn(fnName) {
  const editor = getEditor();
  if (!editor) {
    console.warn(`[SocialCalc] ${fnName}: spreadsheet is not initialized`);
  }
  return editor;
}

/**
 * Sets the sheet's default text color through the legacy editor action.
 * @param {string} name - Color name or CSS color.
 */
export function changeSheetColor(name) {
  const editor = activeEditorOrWarn("changeSheetColor");
  if (!editor) return;
  getSocialCalc().EditorChangeSheetcolor(editor, String(name).toLowerCase());
}

/**
 * Sets the sheet's default font color.
 * @param {string} colorName - CSS color, e.g. "rgb(0,0,0)" or "red".
 */
export function changeSheetFontColor(colorName) {
  const editor = activeEditorOrWarn("changeSheetFontColor");
  if (!editor) return;
  editor.EditorScheduleSheetCommands("set sheet defaultcolor " + colorName, true, false);
}

/**
 * Sets the sheet's default background color.
 * @param {string} colorName - CSS color, e.g. "rgb(255,255,255)" or "lightyellow".
 */
export function changeSheetBackgroundColor(colorName) {
  const editor = activeEditorOrWarn("changeSheetBackgroundColor");
  if (!editor) return;
  editor.EditorScheduleSheetCommands("set sheet defaultbgcolor " + colorName, true, false);
}

/**
 * Runs a sheet command (kept for backward compatibility; see executeCommand).
 * @param {string} cmdline
 */
export function changeFontSheet(cmdline) {
  executeCommand(cmdline);
}

/**
 * Runs one or more sheet commands on the active sheet through the editor (undoable).
 * @param {string} cmdline
 */
export function executeCommand(cmdline) {
  const editor = activeEditorOrWarn("executeCommand");
  if (!editor) return;
  editor.EditorScheduleSheetCommands(cmdline, true, false);
}

function currentFontValue(coord) {
  const editor = getEditor();
  const sheet = editor && editor.context && editor.context.sheetobj;
  const cell = sheet && sheet.cells[coord];
  return cell && cell.font ? sheet.fonts[cell.font] : "";
}

function colorValue(color) {
  return typeof color === "object" && color !== null ? color.value : color;
}

/**
 * Applies font size, font color and background color to a cell or range as one undo step.
 * @param {string} coord - Cell or range, e.g. "B2" or "B2:D4".
 * @param {{ fontSize?: string | null, fontColor?: string | null, bgColor?: string | null }} formatting
 */
export function applySelectedFormatting(coord, formatting) {
  const editor = activeEditorOrWarn("applySelectedFormatting");
  if (!editor || !formatting) return;

  const cmds = [];
  if (formatting.fontSize) {
    const topLeft = String(coord).split(":")[0];
    cmds.push(`set ${coord} font ${mergeFontValue(currentFontValue(topLeft), { size: formatting.fontSize })}`);
  }
  if (formatting.fontColor) {
    cmds.push(`set ${coord} color ${colorValue(formatting.fontColor)}`);
  }
  if (formatting.bgColor) {
    cmds.push(`set ${coord} bgcolor ${colorValue(formatting.bgColor)}`);
  }
  if (cmds.length) {
    editor.EditorScheduleSheetCommands(cmds.join("\n"), true, false);
  }
}

/**
 * Sets a cell's value and formatting in a single undoable step.
 * @param {string} coord
 * @param {any} val - Number, "=formula", HTML, text, "" (clears) or null/undefined (value unchanged).
 * @param {{ fontSize?: string, fontColor?: any, bgColor?: any, borders?: { top?: string, bottom?: string, left?: string, right?: string }, valueFormat?: string }} [formatting]
 */
export function updateCellValueAndFormat(coord, val, formatting) {
  const control = getWorkbookControl();
  if (!control) return;
  const editor = control.workbook.spreadsheet.editor;

  const cmds = [];

  if (val !== null && val !== undefined) {
    cmds.push(...buildSetValueCommands(coord, typeof val === "number" ? val : val.toString()));
  }

  if (formatting) {
    if (formatting.fontSize !== undefined) {
      cmds.push(`set ${coord} font ${mergeFontValue(currentFontValue(coord), { size: formatting.fontSize || null })}`);
    }
    if (formatting.fontColor !== undefined) {
      const fColor = colorValue(formatting.fontColor);
      if (fColor !== undefined) cmds.push("set " + coord + " color " + (fColor || ""));
    }
    if (formatting.bgColor !== undefined) {
      const bColor = colorValue(formatting.bgColor);
      if (bColor !== undefined) cmds.push("set " + coord + " bgcolor " + (bColor || ""));
    }
    if (formatting.borders) {
      const sides = { top: "bt", bottom: "bb", left: "bl", right: "br" };
      for (const side of Object.keys(sides)) {
        if (formatting.borders[side] !== undefined) {
          cmds.push(`set ${coord} ${sides[side]} ${formatting.borders[side] || ""}`);
        }
      }
    }
    if (formatting.valueFormat !== undefined) {
      const vf = formatting.valueFormat;
      cmds.push("set " + coord + " nontextvalueformat " + (!vf || vf === "default" ? "" : vf));
    }
  }

  if (cmds.length === 0) return;

  const cmdstr = cmds.join("\n");
  if (control.ExecuteWorkBookControlCommand) {
    control.ExecuteWorkBookControlCommand(
      {
        cmdtype: "scmd",
        id: control.currentSheetButton ? control.currentSheetButton.id : "sheet1",
        cmdstr,
        saveundo: true,
      },
      false
    );
  } else {
    editor.EditorScheduleSheetCommands(cmdstr, true, false);
  }
}

/**
 * Removes font, colors and borders from a cell or range as one undo step.
 * @param {string} coord
 */
export function resetCellFormatting(coord) {
  const editor = activeEditorOrWarn("resetCellFormatting");
  if (!editor) return;
  editor.EditorScheduleSheetCommands(
    [
      `set ${coord} font * * *`,
      `set ${coord} color `,
      `set ${coord} bgcolor `,
      `set ${coord} bt `,
      `set ${coord} bb `,
      `set ${coord} bl `,
      `set ${coord} br `,
    ].join("\n"),
    true,
    false
  );
}

/**
 * Reads a cell's formatting with style numbers resolved to their values.
 * @param {string} [coord] - Defaults to the cursor cell.
 * @returns {null | {
 *   coord: string, font: number | null, fontValue: string | null, fontSize: string | null,
 *   fontFamily: string | null, bold: boolean, italic: boolean, color: string | null,
 *   bgcolor: string | null, align: string | null, valueFormat: string | null,
 *   textFormat: string | null, borders: { top: string | null, bottom: string | null, left: string | null, right: string | null }
 * }}
 */
export function getCellFormatting(coord) {
  const control = getWorkbookControl();
  if (!control || !control.workbook || !control.workbook.spreadsheet) {
    return null;
  }

  const editor = control.workbook.spreadsheet.editor;
  const sheetobj = editor.context.sheetobj;

  if (!coord) {
    coord = editor.ecell.coord;
  }

  const cell = sheetobj.cells[coord];
  if (!cell) {
    return null;
  }

  const lookup = (list, index) => (index ? list[index] || null : null);
  const fontValue = lookup(sheetobj.fonts, cell.font);
  const font = parseFontValue(fontValue);

  return {
    font: cell.font || null,
    fontValue,
    fontSize: font.size,
    fontFamily: font.family,
    bold: font.weight === "bold",
    italic: font.style === "italic",
    color: lookup(sheetobj.colors, cell.color),
    bgcolor: lookup(sheetobj.colors, cell.bgcolor),
    align: lookup(sheetobj.cellformats, cell.cellformat),
    valueFormat:
      cell.nontextvalueformat !== undefined && cell.nontextvalueformat !== null
        ? sheetobj.valueformats[cell.nontextvalueformat - 0] || null
        : null,
    textFormat: lookup(sheetobj.valueformats, cell.textvalueformat),
    borders: {
      top: lookup(sheetobj.borderstyles, cell.bt),
      bottom: lookup(sheetobj.borderstyles, cell.bb),
      left: lookup(sheetobj.borderstyles, cell.bl),
      right: lookup(sheetobj.borderstyles, cell.br),
    },
    coord: coord,
  };
}
