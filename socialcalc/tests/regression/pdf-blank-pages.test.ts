/**
 * Regression: "Export All as PDF" added a blank page after a sheet whenever the sheet's empty
 * bottom rows spilled past the page break.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { bootEngine } from "../helpers/engine";

// jsdom has no canvas: fake the two rendering libraries and count the pages the PDF receives
let addedImages = 0;
vi.mock("jspdf", () => ({
  jsPDF: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    addPage() {}
    addImage() {
      addedImages++;
    }
    setPage() {}
    setFontSize() {}
    setTextColor() {}
    text() {}
    getTextWidth() {
      return 10;
    }
    output() {
      return new Blob(["%PDF-1.4"], { type: "application/pdf" });
    }
    save() {}
  },
}));
// A4 at this width gives ~1405px per page, so 1500px of content becomes a full page plus a ~94px strip
vi.mock("html2canvas", () => ({ default: async () => ({ width: 1000, height: 1500 }) }));

let pdf: typeof import("../../modules/pdf-export.js");
/** Which slices read back as pure white: none, only the short trailing strip, or all of them */
let white: "none" | "strip" | "all" = "none";

beforeAll(async () => {
  await bootEngine();
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    const canvas = this;
    return {
      drawImage() {},
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4).fill(white === "all" || (white === "strip" && canvas.height < 1000) ? 255 : 0),
      }),
    };
  } as any;
  HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,x";
  pdf = await import("../../modules/pdf-export.js");
}, 20000);

beforeEach(() => {
  addedImages = 0;
});

describe("PDF export pagination", () => {
  it("drops a trailing page that only holds blank rows", async () => {
    white = "strip";
    await pdf.exportAllSheetsAsPDF([{ id: "s1", name: "Sheet 1", htmlContent: "<table><tr><td>x</td></tr></table>" }], {
      returnBlob: true,
    });
    expect(addedImages).toBe(1);
  });

  it("keeps a trailing page that has content", async () => {
    white = "none";
    await pdf.exportHTMLAsPDF("<table><tr><td>x</td></tr></table>", { returnBlob: true });
    expect(addedImages).toBe(2);
  });

  it("never drops a sheet's only page, even when it is empty", async () => {
    white = "all";
    await pdf.exportAllSheetsAsPDF([{ id: "s1", name: "Sheet 1", htmlContent: "<table></table>" }], {
      returnBlob: true,
    });
    expect(addedImages).toBe(1);
  });
});
