// Type-only check: compiled with `npm run test:types` under `strict`, the way an app consumes the
// package. Every function below is a runtime export of socialcalc-ai that index.d.ts must declare;
// without a declaration this file fails with TS2305 ("has no exported member").
import {
  initializeApp, viewFile, getDeviceType, getSpreadsheetContent, getCSVContent, getCurrentHTMLContent,
  getAllSheetsData, getWorkbookInfo, activateFooterButton, undo, redo, getCellFormatting,
  updateCellValueAndFormat, applySelectedFormatting, changeSheetBackgroundColor, changeSheetFontColor,
  addLogo, removeLogo, setupMouseListener, setupCellChangeListener, enableTouchScroll, disableTouchScroll,
  addInvoiceData, clearInvoiceData,
} from "socialcalc-ai";
import type { SheetSummary, WorkbookInfo, CellFormatting, DeviceType } from "socialcalc-ai";

initializeApp("");
viewFile("name", "msc");
const device: DeviceType = getDeviceType();
const msc: string = getSpreadsheetContent();
const csv: string = getCSVContent();
const html: string = getCurrentHTMLContent();
const sheets: SheetSummary[] = getAllSheetsData();
const info: WorkbookInfo = getWorkbookInfo();
activateFooterButton(0);
undo();
redo();
const fmt: CellFormatting | null = getCellFormatting("A1");
const changed: boolean = updateCellValueAndFormat("A1", 5, { fontSize: "12pt", borders: { top: "1px solid" } }, { detectTypes: true });
applySelectedFormatting("A1:B2", { fontSize: "10pt", fontColor: null, bgColor: "lightyellow" });
changeSheetBackgroundColor("lightyellow");
changeSheetFontColor("black");
addLogo({ sheet1: "A1" }, "data:image/png;base64,");
removeLogo("A1");
setupMouseListener();
const stop: () => void = setupCellChangeListener((coord: string, detail: any) => void [coord, detail]);
enableTouchScroll();
disableTouchScroll();
addInvoiceData({});
clearInvoiceData();
void [device, msc, csv, html, sheets, info, fmt, changed, stop];
