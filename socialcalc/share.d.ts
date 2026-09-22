/** Types for the Share, Email & Print plugin ("socialcalc-ai/share"). */

export type SharePlatform = "ios" | "android" | "web";

/** Capacitor plugins the app passes in. Only needed on iOS / Android. */
export interface ShareAdapters {
  /** From "@capacitor/filesystem" */
  Filesystem?: any;
  Directory?: any;
  Encoding?: any;
  /** From "@capacitor/share" */
  Share?: any;
  /** From "capacitor-email-composer" (used on Android) */
  EmailComposer?: any;
  /** From "@bcyesil/capacitor-plugin-printer" */
  Printer?: any;
  /** From "@capacitor/core"; defaults to window.Capacitor */
  Capacitor?: any;
}

export interface ShareConfig extends ShareAdapters {
  /** Delete temporary cache files this many ms after sharing. 0 keeps them. Default 60000. */
  cleanupAfterMs?: number;
}

export interface ShareCapabilities {
  platform: SharePlatform;
  native: boolean;
  /** True when "socialcalc-ai/pdf-export" is imported and enabled. */
  pdfAvailable: boolean;
  saveMethod: "share-sheet" | "download";
  emailMethod: "email-composer" | "share-sheet" | "web-share-or-mailto" | "mailto";
  printMethod: "native-printer" | "browser-print";
  adapters: string[];
  missingAdapters: string[];
}

export interface ShareFileOptions {
  blob?: Blob;
  /** File contents as text (used when blob is not given). */
  text?: string;
  /** Full file name including extension. */
  filename: string;
  mimeType?: string;
  title?: string;
  message?: string;
  dialogTitle?: string;
}

export interface ShareResult {
  method: "download" | "share-sheet" | "web-share" | "email-composer" | "mailto" | "cancelled" | "native-pdf" | "native-html" | "browser-print";
  platform: SharePlatform;
}

export interface EmailOptions {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  isHtml?: boolean;
  attachment?: { blob?: Blob; text?: string; filename: string; mimeType?: string };
}

export interface EmailSheetOptions extends Omit<EmailOptions, "attachment"> {
  /** Attachment file name without extension. Default "Sheet". */
  filename?: string;
  /** Default: "html" on Android, "pdf" elsewhere (falls back to "html" without the pdf-export plugin). */
  attachmentFormat?: "pdf" | "html" | "none";
  pdfOptions?: Record<string, unknown>;
}

export interface PrintOptions {
  name?: string;
  orientation?: "portrait" | "landscape";
  /** On iOS/Android, print a PDF made by the pdf-export plugin when available. Default true. */
  usePdf?: boolean;
  pdfOptions?: Record<string, unknown>;
}

export function getPlatform(): SharePlatform;
export function isNativePlatform(): boolean;
export function getShareCapabilities(): ShareCapabilities;

export function saveFile(options: ShareFileOptions): Promise<ShareResult>;
export function shareFile(options: ShareFileOptions): Promise<ShareResult>;
export function sendEmail(options?: EmailOptions): Promise<ShareResult>;
export function emailCurrentSheet(options?: EmailSheetOptions): Promise<ShareResult>;
export function printHTML(html: string, options?: PrintOptions): Promise<ShareResult>;
export function printCurrentSheet(options?: PrintOptions): Promise<ShareResult>;

export function configureShare(config: ShareConfig): ShareCapabilities;
export function enableShare(config?: ShareConfig): void;
export function disableShare(): void;
export function isShareEnabled(): boolean;
export function toggleShare(forceState?: boolean): boolean;
