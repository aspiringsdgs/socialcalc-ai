// Cell and sheet formatting functions
let SocialCalc;

// Ensure SocialCalc is loaded from the global scope dynamically
function getSocialCalc() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    return window.SocialCalc;
  }
  if (typeof global !== "undefined" && global.SocialCalc) {
    return global.SocialCalc;
  }
  return SocialCalc || {};
}

export function changeSheetColor(name) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var editor = control.workbook.spreadsheet.editor;

  name = name.toLowerCase();
  SocialCalc.EditorChangeSheetcolor(editor, name);
}

export function changeSheetFontColor(colorName) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var editor = control.workbook.spreadsheet.editor;

  // Create command to set sheet default font color
  var cmdline = "set sheet defaultcolor " + colorName;
  editor.EditorScheduleSheetCommands(cmdline, true, false);
}

export function changeSheetBackgroundColor(colorName) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  var editor = control.workbook.spreadsheet.editor;

  // Create command to set sheet default background color
  var cmdline = "set sheet defaultbgcolor " + colorName;
  editor.EditorScheduleSheetCommands(cmdline, true, false);
}

export function changeFontSheet(cmdline) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  //alert('control are'+control);
  var editor = control.workbook.spreadsheet.editor;
  editor.EditorScheduleSheetCommands(cmdline, true, false);
}

export function executeCommand(cmdline) {
  var control = SocialCalc.GetCurrentWorkBookControl();
  //alert('control are'+control);
  var editor = control.workbook.spreadsheet.editor;
  editor.EditorScheduleSheetCommands(cmdline, true, false);
}

export function applySelectedFormatting(coord, formatting) {

  const control = SocialCalc.GetCurrentWorkBookControl();
  const editor = control.workbook.spreadsheet.editor;

  if (formatting.fontSize) {
    // Font command format: set coord font style weight size family
    // valid sizes: * or size value
    // We'll preserve existing style/weight/family by using *
    const cmd = `set ${coord} font * * ${formatting.fontSize} *`;
    editor.EditorScheduleSheetCommands(cmd, true, false);
  }

  if (formatting.fontColor) {
    // Color command format: set coord color colorname
    const cmd = `set ${coord} color ${formatting.fontColor}`;
    editor.EditorScheduleSheetCommands(cmd, true, false);
  }

  if (formatting.bgColor) {
    // BgColor command format: set coord bgcolor colorname
    const cmd = `set ${coord} bgcolor ${formatting.bgColor}`;
    editor.EditorScheduleSheetCommands(cmd, true, false);
  }

  // Redisplay to show changes
  editor.context.sheetobj.ScheduleSheetCommands("redisplay", false, false);
}

export function updateCellValueAndFormat(coord, val, formatting) {
  var sc = getSocialCalc();
  var control = sc.GetCurrentWorkBookControl ? sc.GetCurrentWorkBookControl() : null;
  if (!control) return;
  var editor = control.workbook.spreadsheet.editor;

  var cmds = [];

  // 1. Handle Value
  if (val !== null && val !== undefined) {
    var rawStr = val.toString();
    if (rawStr === "") {
      cmds.push("set " + coord + " empty");
    } else if (rawStr.charAt(0) === "=" && rawStr.indexOf("\n") === -1) {
      cmds.push("set " + coord + " formula " + rawStr.substring(1));
    } else {
      var numVal = parseFloat(rawStr);
      if (!isNaN(numVal) && isFinite(rawStr) && rawStr.trim() === numVal.toString()) {
        cmds.push("set " + coord + " value n " + numVal);
      } else {
        var isHtml = /<[a-z][\s\S]*>/i.test(rawStr);
        // Use SocialCalc's native encoding if available, otherwise manual escape
        var strVal;
        if (sc.encodeForSave) {
          strVal = sc.encodeForSave(rawStr);
        } else {
          strVal = rawStr.replace(/\\/g, "\\b").replace(/:/g, "\\c").replace(/\n/g, "\\n");
        }

        if (isHtml) {
          cmds.push("set " + coord + " text th " + strVal);
          cmds.push("set " + coord + " textvalueformat text-html");
        } else {
          cmds.push("set " + coord + " text t " + strVal);
        }
      }
    }
  }

  // 2. Handle Formatting (only generate commands for properties explicitly passed in formatting)
  if (formatting) {
    if (formatting.fontSize !== undefined) {
      cmds.push("set " + coord + " font * * " + formatting.fontSize + " *");
    }
    if (formatting.fontColor !== undefined) {
      var fColor =
        typeof formatting.fontColor === "object" && formatting.fontColor !== null
          ? formatting.fontColor.value
          : formatting.fontColor;
      if (fColor !== undefined) {
        cmds.push("set " + coord + " color " + (fColor || ""));
      }
    }
    if (formatting.bgColor !== undefined) {
      var bColor =
        typeof formatting.bgColor === "object" && formatting.bgColor !== null
          ? formatting.bgColor.value
          : formatting.bgColor;
      if (bColor !== undefined) {
        cmds.push("set " + coord + " bgcolor " + (bColor || ""));
      }
    }
    if (formatting.borders) {
      if (formatting.borders.top !== undefined) {
        cmds.push("set " + coord + " bt " + (formatting.borders.top || ""));
      }
      if (formatting.borders.bottom !== undefined) {
        cmds.push("set " + coord + " bb " + (formatting.borders.bottom || ""));
      }
      if (formatting.borders.left !== undefined) {
        cmds.push("set " + coord + " bl " + (formatting.borders.left || ""));
      }
      if (formatting.borders.right !== undefined) {
        cmds.push("set " + coord + " br " + (formatting.borders.right || ""));
      }
    }
    if (formatting.valueFormat !== undefined) {
      if (!formatting.valueFormat || formatting.valueFormat === "default" || formatting.valueFormat === "") {
        cmds.push("set " + coord + " nontextvalueformat ");
      } else {
        cmds.push("set " + coord + " nontextvalueformat " + formatting.valueFormat);
      }
    }
  }

  if (cmds.length === 0) return;

  // Execute all as one transaction
  var cmdstr = cmds.join("\n");

  if (control.ExecuteWorkBookControlCommand) {
    var commandObj = {
      cmdtype: "scmd",
      id: control.currentSheetButton ? control.currentSheetButton.id : "sheet1",
      cmdstr: cmdstr,
      saveundo: true
    };
    control.ExecuteWorkBookControlCommand(commandObj, false);
  } else {
    editor.EditorScheduleSheetCommands(cmdstr, true, false);
  }
}

export function resetCellFormatting(coord) {

  const control = SocialCalc.GetCurrentWorkBookControl();
  const editor = control.workbook.spreadsheet.editor;

  // Reset font to default using SocialCalc command
  const fontCmd = `set ${coord} font * * *`;
  editor.EditorScheduleSheetCommands(fontCmd, true, false);

  // Reset color to default
  const colorCmd = `set ${coord} color *`;
  editor.EditorScheduleSheetCommands(colorCmd, true, false);

  // Reset background color to default
  const bgCmd = `set ${coord} bgcolor *`;
  editor.EditorScheduleSheetCommands(bgCmd, true, false);

  // Reset borders
  editor.EditorScheduleSheetCommands(`set ${coord} bt \nset ${coord} bb \nset ${coord} bl \nset ${coord} br `, true, false);

  // Redisplay to show changes
  editor.context.sheetobj.ScheduleSheetCommands("redisplay", false, false);
}

export function getCellFormatting(coord) {
  const sc = getSocialCalc();
  const control = sc.GetCurrentWorkBookControl ? sc.GetCurrentWorkBookControl() : null;
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

  // Resolve numeric color indices to actual color strings using sheetobj.colors[]
  const resolvedColor = cell.color ? (sheetobj.colors[cell.color] || null) : null;
  const resolvedBgColor = cell.bgcolor ? (sheetobj.colors[cell.bgcolor] || null) : null;

  const resolvedBt = cell.bt ? (sheetobj.borderstyles[cell.bt] || null) : null;
  const resolvedBb = cell.bb ? (sheetobj.borderstyles[cell.bb] || null) : null;
  const resolvedBl = cell.bl ? (sheetobj.borderstyles[cell.bl] || null) : null;
  const resolvedBr = cell.br ? (sheetobj.borderstyles[cell.br] || null) : null;

  // Resolve nontextvalueformat (number, currency, date, etc.)
  let resolvedValueFormat = null;
  if (cell.nontextvalueformat !== undefined && cell.nontextvalueformat !== null) {
    resolvedValueFormat = sheetobj.valueformats[cell.nontextvalueformat - 0] || null;
  }

  return {
    font: cell.font || null,
    color: resolvedColor,
    bgcolor: resolvedBgColor,
    valueFormat: resolvedValueFormat,
    borders: {
      top: resolvedBt,
      bottom: resolvedBb,
      left: resolvedBl,
      right: resolvedBr
    },
    coord: coord,
  };
}
