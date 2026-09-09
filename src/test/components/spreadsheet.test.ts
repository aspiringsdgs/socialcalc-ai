import { describe, it, expect, vi } from "vitest";
import * as AppGeneral from "socialcalc";
import template100001 from "../../data/100001.json";

describe("SocialCalc App & Standard MSC JSONs", () => {
  it("should have valid standard MSC JSON structure from public/data", () => {
    expect(template100001.msc).toBeDefined();
    expect(template100001.msc.sheetArr.sheet1).toBeDefined();
    expect(template100001.footers.length).toBeGreaterThan(0);
    expect(template100001.appMapping).toBeDefined();
  });

  it("should have SocialCalc core and required modules available", () => {
    expect(AppGeneral.SocialCalc).toBeDefined();
    expect(typeof AppGeneral.initializeApp).toBe("function");
    expect(typeof AppGeneral.viewFile).toBe("function");
    expect(typeof AppGeneral.activateFooterButton).toBe("function");
  });

  it("should create and position column resize corner handle on column selection", () => {
    expect(typeof AppGeneral.showColumnResizeHandle).toBe("function");
    expect(typeof AppGeneral.hideColumnResizeHandle).toBe("function");
    expect(typeof AppGeneral.selectColumn).toBe("function");

    // Enable headers
    AppGeneral.enableRowColHeaders();

    // Mock active editor for headless test
    (AppGeneral.SocialCalc as any)._activeEditor = {
      colpositions: [0, 30, 110, 190],
      colwidth: [0, 80, 80, 80],
      headposition: { top: 40, left: 30 },
      gridposition: { top: 40, left: 30 },
      fullgrid: document.createElement("div")
    };

    // Trigger showColumnResizeHandle for Col 2 ('B')
    AppGeneral.showColumnResizeHandle(2);

    const handle = document.getElementById("sc-col-resize-corner-handle");
    expect(handle).not.toBeNull();
    expect(handle?.className).toContain("sc-col-resize-corner-handle");
    expect(handle?.style.display).toBe("flex");
    expect(handle?.style.position).toBe("fixed");
    expect(handle?.style.zIndex).toBe("99999");

    // Hide handle
    AppGeneral.hideColumnResizeHandle();
    expect(document.getElementById("sc-col-resize-corner-handle")).toBeNull();
  });
});
