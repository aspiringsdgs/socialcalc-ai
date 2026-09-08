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
});
