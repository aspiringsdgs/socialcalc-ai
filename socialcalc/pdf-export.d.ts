/** Options for the offline PDF export plugin ("socialcalc-ai/pdf-export"). */
export interface PdfExportOptions {
  /** File name without ".pdf". Defaults to "document" (single sheet) or "all_sheets". */
  filename?: string;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  /** Page margin in mm. Default 10. */
  margin?: number;
  /** html2canvas render scale. Default 4 for a single sheet, 2 for all sheets. */
  quality?: number;
  /** Text at the top-left of every page. null (default) prints the current date/time, "" hides it. */
  headerText?: string | null;
  /** Text at the bottom-left of every page. Default "". */
  footerText?: string;
  /** Print "Page X of Y" at the bottom-right. Default true. */
  showPageNumbers?: boolean;
  /** Id of the live editor element whose chart canvases are copied into the export. Default "tableeditor". */
  editorElementId?: string;
  /** Return the PDF as a Blob instead of downloading it. */
  returnBlob?: boolean;
  onProgress?: (message: string) => void;
}

export interface PdfSheetData {
  id: string;
  name: string;
  htmlContent: string;
  [key: string]: unknown;
}

export type PdfExportDefaults = Omit<PdfExportOptions, "filename" | "returnBlob" | "onProgress">;

export function exportHTMLAsPDF(htmlContent: string, options: PdfExportOptions & { returnBlob: true }): Promise<Blob>;
export function exportHTMLAsPDF(htmlContent: string, options?: PdfExportOptions): Promise<Blob | void>;

export function exportAllSheetsAsPDF(sheetsData: PdfSheetData[], options: PdfExportOptions & { returnBlob: true }): Promise<Blob>;
export function exportAllSheetsAsPDF(sheetsData: PdfSheetData[], options?: PdfExportOptions): Promise<Blob | void>;

export function exportCurrentSheetAsPDF(options: PdfExportOptions & { returnBlob: true }): Promise<Blob>;
export function exportCurrentSheetAsPDF(options?: PdfExportOptions): Promise<Blob | void>;

export function exportWorkbookAsPDF(options: PdfExportOptions & { returnBlob: true }): Promise<Blob>;
export function exportWorkbookAsPDF(options?: PdfExportOptions): Promise<Blob | void>;

/** Base64 of a Blob without the "data:...;base64," prefix (for Capacitor Filesystem.writeFile). */
export function pdfBlobToBase64(blob: Blob): Promise<string>;

export function enablePdfExport(options?: PdfExportDefaults): void;
export function disablePdfExport(): void;
export function isPdfExportEnabled(): boolean;
export function togglePdfExport(forceState?: boolean): boolean;
export function configurePdfExport(config: PdfExportDefaults): PdfExportDefaults;
export function getPdfExportConfig(): PdfExportDefaults;
