// Sheet management and data functions
import { SocialCalcRef } from "./runtime.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

export function activateFooterButton(index) {
  if (index === SocialCalc.oldBtnActive) return;
  var control = SocialCalc.GetCurrentWorkBookControl();

  var sheets = [];
  for (var key in control.sheetButtonArr) {
    //console.log(key);
    sheets.push(key);
  }
  var spreadsheet = control.workbook.spreadsheet;
  var ele = document.getElementById(spreadsheet.formulabarDiv.id);
  if (ele) {
    SocialCalc.ToggleInputLineButtons(false);
    var input = ele.firstChild;
    input.style.display = "none";
    spreadsheet.editor.state = "start";
  }
  SocialCalc.WorkBookControlActivateSheet(sheets[index - 1]);

  SocialCalc.oldBtnActive = index;
}

export function viewFile(filename, data) {
  SocialCalc.WorkBookControlInsertWorkbook(data);

  SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor.state =
    "start";

  SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.ExecuteCommand(
    "redisplay",
    ""
  );

  window.setTimeout(function () {
    SocialCalc.ScrollRelativeBoth(
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor,
      1,
      0
    );
    SocialCalc.ScrollRelativeBoth(
      SocialCalc.GetCurrentWorkBookControl().workbook.spreadsheet.editor,
      -1,
      0
    );
  }, 1000);
}

export function loadWorkbookData(data) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.WorkBookControlLoad) return;
  SocialCalc.WorkBookControlLoad(data);
  const control = SocialCalc.GetCurrentWorkBookControl();
  if (control && control.workbook && control.workbook.spreadsheet) {
    control.workbook.spreadsheet.editor.state = "start";
    try {
      control.workbook.spreadsheet.ExecuteCommand("redisplay", "");
    } catch (e) {
      // ignore
    }
  }
}

export function getSpreadsheetContent() {
  return SocialCalc.WorkBookControlSaveSheet();
}

export function getCurrentHTMLContent() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  return control.workbook.spreadsheet.CreateSheetHTML();
}

export function getAllHTMLContent(sheetdata) {
  var appsheets = {};
  var control = SocialCalc.GetCurrentWorkBookControl();

  // Use the real sheet ids (they are not always sheet1..N, e.g. after a sheet was deleted)
  var ids =
    sheetdata && sheetdata.sheetArr
      ? Object.keys(sheetdata.sheetArr)
      : control && control.sheetButtonArr
        ? Object.keys(control.sheetButtonArr)
        : [];
  if (!ids.length && sheetdata && sheetdata.numsheets) {
    for (var i = 1; i <= sheetdata.numsheets; i++) ids.push("sheet" + i);
  }
  for (var j = 0; j < ids.length; j++) {
    appsheets[ids[j]] = ids[j];
  }

  return SocialCalc.WorkbookControlCreateSheetHTML(appsheets);
}

export function getCurrentSheet() {
  return SocialCalc.GetCurrentWorkBookControl().currentSheetButton.id;
}

export function getAllSheetsData() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  if (!control || !control.workbook || !control.sheetButtonArr) {
    return [];
  }

  var sheetsData = [];
  var currentSheetId = control.currentSheetButton
    ? control.currentSheetButton.id
    : null;

  // Get all sheet names
  for (var sheetId in control.sheetButtonArr) {
    // Temporarily switch to each sheet to get its HTML content
    SocialCalc.WorkBookControlActivateSheet(sheetId);

    var htmlContent = control.workbook.spreadsheet.CreateSheetHTML();

    sheetsData.push({
      id: sheetId,
      name: sheetId.replace("sheet", "Sheet "), // Convert 'sheet1' to 'Sheet 1'
      title: control.sheetButtonArr[sheetId].value, // the tab's real name
      htmlContent: htmlContent,
    });
  }

  // Switch back to the original sheet if it existed
  if (currentSheetId) {
    SocialCalc.WorkBookControlActivateSheet(currentSheetId);
  }

  return sheetsData;
}

export function getWorkbookInfo() {
  var control = SocialCalc.GetCurrentWorkBookControl();
  if (!control || !control.sheetButtonArr) {
    return { numsheets: 0, sheets: [] };
  }

  var sheets = [];
  for (var sheetId in control.sheetButtonArr) {
    sheets.push(sheetId);
  }

  return {
    numsheets: sheets.length,
    sheets: sheets,
  };
}
