import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { bootEngine } from "../../../src/test/engine";

// jsdom has no canvas: fake the two rendering libraries and record what the PDF receives
const pdfCalls: any[] = [];
vi.mock("jspdf", () => ({
  jsPDF: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    constructor(options: any) {
      pdfCalls.push(["new", options]);
    }
    addPage() {
      pdfCalls.push(["addPage"]);
    }
    addImage() {
      pdfCalls.push(["addImage"]);
    }
    setPage() {}
    setFontSize() {}
    setTextColor() {}
    text(text: string) {
      pdfCalls.push(["text", text]);
    }
    getTextWidth() {
      return 10;
    }
    output() {
      return new Blob(["%PDF-1.4"], { type: "application/pdf" });
    }
    save(name: string) {
      pdfCalls.push(["save", name]);
    }
  },
}));
vi.mock("html2canvas", () => ({ default: async () => ({ width: 1000, height: 3000 }) }));

let exporters: typeof import("../exporters.js");
let pdf: typeof import("../pdf-export.js");
let share: typeof import("../share.js");
let pluginManager: typeof import("../plugin-manager.js");
const downloads: string[] = [];

// jsdom Blobs have no .text()
const readText = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

beforeAll(async () => {
  await bootEngine();
  HTMLCanvasElement.prototype.getContext = (() => ({ drawImage() {} })) as any;
  HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,x";
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });

  exporters = await import("../exporters.js");
  pdf = await import("../pdf-export.js");
  share = await import("../share.js");
  pluginManager = await import("../plugin-manager.js");
}, 20000);

beforeEach(() => {
  downloads.length = 0;
  pdfCalls.length = 0;
});

describe("CSV export", () => {
  it("cleans and quotes CSV", () => {
    expect(exporters.cleanCSV("a,b\n\n  c,d  \n")).toBe("a,b\nc,d");
    expect(exporters.convertToCSV([["x", 'say "hi"', "a,b", null]])).toBe('x,"say ""hi""","a,b",');
  });

  it("adds a BOM and downloads the active sheet", async () => {
    const blob = (await exporters.exportCurrentSheetAsCSV({ returnBlob: true })) as Blob;
    const bytes = await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blob);
    });
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
    expect((await readText(blob)).length).toBeGreaterThan(0);

    await exporters.exportCurrentSheetAsCSV({ filename: "sheet" });
    expect(downloads).toEqual(["sheet.csv"]);
  });
});

describe("MSC export", () => {
  it("exports raw workbook data that parses back", async () => {
    const blob = (await exporters.exportMSC({ returnBlob: true })) as Blob;
    const parsed = exporters.parseMSCFile(await readText(blob));
    expect(Object.keys(parsed.msc.sheetArr).length).toBeGreaterThan(0);
  });

  it("exports the template format with mappings", async () => {
    await exporters.exportMSC({ filename: "book", extension: "json", includeAppMapping: true });
    expect(downloads).toEqual(["book.json"]);
    const blob = (await exporters.exportMSC({ includeAppMapping: true, returnBlob: true })) as Blob;
    const data = JSON.parse(await readText(blob));
    expect(data).toHaveProperty("msc.sheetArr");
    expect(data).toHaveProperty("appMapping");
    expect(() => exporters.parseMSCFile('{"nope":1}')).toThrow();
  });
});

describe("PDF export plugin", () => {
  it("registers and exports the current sheet and the workbook", async () => {
    expect(pluginManager.getPlugin("pdfExport")?.api).toBeTruthy();
    pdf.configurePdfExport({ footerText: "Invoice" });

    const blob = await pdf.exportCurrentSheetAsPDF({ returnBlob: true });
    expect(blob).toBeInstanceOf(Blob);
    expect(pdfCalls.some((c) => c[0] === "text" && c[1] === "Invoice")).toBe(true);
    expect(pdfCalls.filter((c) => c[0] === "addImage").length).toBeGreaterThan(1);

    pdfCalls.length = 0;
    await pdf.exportWorkbookAsPDF({ filename: "all" });
    expect(pdfCalls.some((c) => c[0] === "save" && c[1] === "all.pdf")).toBe(true);
  });

  it("rejects while disabled", async () => {
    pluginManager.disablePlugin("pdfExport");
    await expect(pdf.exportHTMLAsPDF("<p>x</p>")).rejects.toThrow(/disabled/);
    pluginManager.enablePlugin("pdfExport");
  });
});

describe("Share, Email & Print plugin", () => {
  const fakes = () => ({
    Filesystem: {
      writeFile: vi.fn(async ({ path }: any) => ({ uri: `file:///cache/${path}` })),
      deleteFile: vi.fn(async () => {}),
    },
    Share: { share: vi.fn(async () => {}) },
    EmailComposer: { open: vi.fn(async (..._args: any[]) => {}) },
    Printer: { print: vi.fn(async (..._args: any[]) => {}) },
  });
  const onPlatform = (platform: string, adapters: any) =>
    share.configureShare({ ...adapters, Capacitor: { getPlatform: () => platform }, cleanupAfterMs: 0 });

  it("web: downloads files and prints through an iframe", async () => {
    onPlatform("web", {});
    expect(share.getShareCapabilities()).toMatchObject({ platform: "web", saveMethod: "download", pdfAvailable: true });

    const res = await share.saveFile({ text: "a,b", filename: "x.csv" });
    expect(res.method).toBe("download");
    expect(downloads).toEqual(["x.csv"]);

    const printed: string[] = [];
    const appendChild = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation(<T extends Node>(node: T): T => {
      appendChild(node);
      if (node instanceof HTMLIFrameElement) {
        node.contentWindow!.print = () => printed.push(node.contentWindow!.document.title);
      }
      return node;
    });
    expect((await share.printCurrentSheet({ name: "Inv" })).method).toBe("browser-print");
    expect(printed).toEqual(["Inv"]);
    vi.mocked(document.body.appendChild).mockRestore();
  });

  it("web: email opens mailto and downloads the attachment", async () => {
    onPlatform("web", {});
    const hrefs: string[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { set href(v: string) { hrefs.push(v); } } });
    try {
      const res = await share.emailCurrentSheet({ filename: "Inv", subject: "Hi there", to: ["a@b.c"] });
      expect(res.method).toBe("mailto");
      expect(hrefs[0]).toBe("mailto:a%40b.c?subject=Hi%20there");
      expect(downloads).toEqual(["Inv.pdf"]);
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("iOS: saves via the share sheet, emails a PDF via the share sheet, prints a PDF", async () => {
    const f = fakes();
    onPlatform("ios", f);

    expect((await share.saveFile({ text: "a", filename: "x.csv" })).method).toBe("share-sheet");
    expect(f.Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: "x.csv", directory: "CACHE", encoding: "utf8" }));
    expect(f.Share.share).toHaveBeenCalledWith(expect.objectContaining({ url: "file:///cache/x.csv" }));

    expect((await share.emailCurrentSheet({ filename: "Inv" })).method).toBe("share-sheet");
    expect(f.Filesystem.writeFile).toHaveBeenLastCalledWith(expect.objectContaining({ path: "Inv.pdf" }));
    expect(f.EmailComposer.open).not.toHaveBeenCalled();

    expect((await share.printCurrentSheet({ name: "Inv" })).method).toBe("native-pdf");
    expect((f.Printer.print as any).mock.calls[0]?.[0]?.content).toMatch(/^base64:data:application\/pdf;base64,/);
  });

  it("Android: emails HTML through EmailComposer, prints HTML when PDF is off", async () => {
    const f = fakes();
    onPlatform("android", f);

    expect((await share.emailCurrentSheet({ filename: "Inv", subject: "S" })).method).toBe("email-composer");
    const opened = (f.EmailComposer.open as any).mock.calls[0]?.[0];
    expect(opened?.subject).toBe("S");
    expect(opened?.attachments).toEqual([{ type: "absolute", path: "/cache/Inv.html", name: "Inv.html" }]);

    expect((await share.printCurrentSheet({ usePdf: false })).method).toBe("native-html");
  });

  it("native: explains a missing adapter", async () => {
    share.configureShare({ Capacitor: { getPlatform: () => "ios" }, Printer: undefined });
    await expect(share.printHTML("<p>x</p>")).rejects.toThrow(/Printer adapter is missing/);
  });
});
