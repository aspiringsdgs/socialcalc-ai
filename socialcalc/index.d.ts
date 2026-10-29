export * from "./react";
export * from "./ionic";

// The engine modules again, one level up. They ship as plain .js without .d.ts files, and
// TypeScript only reads untyped .js inside node_modules one re-export deep: reached through
// ./react alone (index -> react -> module) their functions vanish from "socialcalc-ai".
export * from "./modules/device.js";
export * from "./modules/init.js";
export * from "./modules/sheets.js";
export * from "./modules/logos.js";
export * from "./modules/history.js";
export * from "./modules/formatting.js";
export * from "./modules/listeners.js";
export * from "./modules/exporters.js";
export * from "./modules/prompts.js";
export * from "./modules/utils.js";
export * from "./modules/weight.js";
export * from "./modules/touch-scroll.js";
export * from "./modules/plugin-manager.js";
export * from "./modules/row-col-headers.js";
export * from "./modules/horizontal-scroll.js";
export * from "./modules/grid-lines.js";
export * from "./modules/editable-cells.js";
export * from "./modules/invoice.js";
export * from "./modules/agent.js";

// Explicit declarations. The `export *` lines above add nothing for consumers: TypeScript does not
// read untyped .js inside node_modules (maxNodeModuleJsDepth 0), so these functions were missing
// from the typings. Signatures follow the JSDoc / bodies in modules/*.js.
export interface SheetSummary {
  id: string;
  name: string;
  title: string;
  htmlContent: string;
}
export interface WorkbookInfo {
  numsheets: number;
  sheets: string[];
}
export interface CellFormatting {
  font: string | null;
  fontValue: string | null;
  fontSize: string | null;
  fontFamily: string | null;
  bold: boolean;
  italic: boolean;
  color: string | null;
  bgcolor: string | null;
  align: string | null;
  valueFormat: string | null;
  textFormat: string | null;
  borders: { top: string | null; bottom: string | null; left: string | null; right: string | null };
  coord: string;
}
export interface CellFormattingInput {
  fontSize?: string | null;
  fontColor?: any;
  bgColor?: any;
  borders?: { top?: string; bottom?: string; left?: string; right?: string };
  valueFormat?: string;
}
export type DeviceType = "default" | "iPod" | "iPad" | "iPhone" | "Android";

export function initializeApp(data: string): void;
export function viewFile(filename: string, data: string): void;
export function getDeviceType(): DeviceType;
export function getSpreadsheetContent(): string;
export function getCSVContent(): string;
export function getCurrentHTMLContent(): string;
export function getAllSheetsData(): SheetSummary[];
export function getWorkbookInfo(): WorkbookInfo;
export function activateFooterButton(index: number): void;
export function undo(): void;
export function redo(): void;
export function getCellFormatting(coord?: string): CellFormatting | null;
export function updateCellValueAndFormat(
  coord: string,
  val: string | number | null | undefined,
  formatting?: CellFormattingInput,
  options?: { detectTypes?: boolean }
): boolean;
export function applySelectedFormatting(
  coord: string,
  formatting: { fontSize?: string | null; fontColor?: string | null; bgColor?: string | null }
): void;
export function changeSheetBackgroundColor(colorName: string): void;
export function changeSheetFontColor(colorName: string): void;
export function addLogo(coord: string | Record<string, string>, url: string): Promise<any>;
export function removeLogo(coord: string | Record<string, string>): Promise<any>;
/** Installs a global, idempotent editor mouse patch. Returns nothing (no cleanup handle). */
export function setupMouseListener(): void;
/** Returns a cleanup function that removes only this listener. */
export function setupCellChangeListener(callback: (coord: string, detail: any) => void): () => void;
export function enableTouchScroll(): void;
export function disableTouchScroll(): void;
export function addInvoiceData(invoiceData: any): Promise<any>;
export function clearInvoiceData(): Promise<any>;
