/**
 * Data writers on the real engine: invoice helpers, logos and the weight tracker.
 * They resolve before the engine has run the commands, so each test waits for idle.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { bootEngine, idle, run, cell } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let invoice: typeof import("../../modules/invoice.js");
let logos: typeof import("../../modules/logos.js");
let weight: typeof import("../../modules/weight.js");

beforeAll(async () => {
  engine = await bootEngine();
  invoice = await import("../../modules/invoice.js");
  logos = await import("../../modules/logos.js");
  weight = await import("../../modules/weight.js");
  // These modules log every step; keep the test output readable
  vi.spyOn(console, "log").mockImplementation(() => {});
}, 20000);

describe("dynamic invoice data", () => {
  it("writes numbers, text and HTML, and erases on empty strings", async () => {
    await run(engine, ["set P5 text t old"]);
    await invoice.addDynamicInvoiceData({ P2: 125.5, P3: "Acme: Ltd", P4: "<b>Paid</b>", P5: "", P6: "007" });
    await idle(engine);
    expect(cell(engine, "P2").datavalue).toBe(125.5);
    expect(cell(engine, "P3").datavalue).toBe("Acme: Ltd");
    expect(cell(engine, "P4").datavalue).toBe("<b>Paid</b>");
    expect(cell(engine, "P5")?.datavalue ?? "").toBe("");
    expect(cell(engine, "P6").datavalue).toBe("007"); // leading zeros stay text
  });

  it("reads values back and clears the given cells", async () => {
    await run(engine, ["set P7 formula P2*2"]);
    const data: any = await invoice.getDynamicInvoiceData(["P2", "P3", "P7", "P99"]);
    expect(data).toMatchObject({ P2: 125.5, P3: "Acme: Ltd", P7: 251, P99: "" });
    await invoice.clearDynamicInvoiceData({ P2: true, P3: true });
    await idle(engine);
    expect(cell(engine, "P2")?.datavalue ?? "").toBe("");
    expect(cell(engine, "P3")?.datavalue ?? "").toBe("");
  });

  it("resolves without writing anything for an empty object", async () => {
    await expect(invoice.addDynamicInvoiceData({})).resolves.toBe(true);
  });
});

describe("fixed-layout invoice data", () => {
  it("fills bill-to, from, invoice and items, keeping special characters", async () => {
    const coords = invoice.getInvoiceCoordinates();
    const address = "12 Main St\nSuite 4 \\ Rear";
    await invoice.addInvoiceData({
      billTo: { name: "Dr. A: Smith", streetAddress: address },
      invoice: { number: "INV-7" },
      items: [
        { description: "Consult", amount: "100" },
        { description: "Lab", amount: 50.25 },
      ],
    });
    await idle(engine);
    expect(cell(engine, coords.billTo.name).datavalue).toBe("Dr. A: Smith");
    expect(cell(engine, coords.billTo.streetAddress).datavalue).toBe(address);
    expect(cell(engine, coords.invoice.number).datavalue).toBe("INV-7");
    const firstRow = coords.items.startRow;
    expect(cell(engine, coords.items.descriptionColumn + firstRow).datavalue).toBe("Consult");
    expect(cell(engine, coords.items.amountColumn + (firstRow + 1)).datavalue).toBe(50.25);
    expect(cell(engine, coords.total.sum).datavalue).toBe(150.25);
  });

  it("clearInvoiceData empties the invoice fields", async () => {
    const coords = invoice.getInvoiceCoordinates();
    await invoice.clearInvoiceData();
    await idle(engine);
    expect(cell(engine, coords.billTo.name)?.datavalue ?? "").toBe("");
  });
});

describe("logos", () => {
  it("adds an image to the mapped cell of the active sheet and removes it", async () => {
    const url = "data:image/png;base64,AAAA";
    await logos.addLogo({ sheet1: "P20", sheet2: "Z1" }, url);
    await idle(engine);
    const c = cell(engine, "P20");
    expect(c.datavalue).toContain(`<img src="${url}"`);
    expect(engine.runtime.getSheet().valueformats[c.textvalueformat]).toBe("text-html");
    expect(engine.runtime.getSheet("sheet2").cells.Z1).toBeUndefined();
    await logos.removeLogo({ sheet1: "P20" });
    await idle(engine);
    expect(cell(engine, "P20")?.datavalue ?? "").toBe("");
  });
});

describe("weight tracker", () => {
  it("writes a day's row, computes the distance to goal, reads it back and clears it", async () => {
    const day = weight.getDayCoordinates()[2];
    await weight.addWeight(2, "Mon", 72.5, 70);
    await idle(engine);
    expect(cell(engine, day.date).datavalue).toBe("Mon");
    expect(cell(engine, day.weight).datavalue).toBe(72.5);
    expect(cell(engine, day.fromGoal).datavalue).toBe(2.5);
    const read: any = weight.getWeightData(2);
    expect(read).toBeTruthy();
    await weight.clearWeight(2);
    await idle(engine);
    expect(cell(engine, day.weight)?.datavalue ?? "").toBe("");
  });

  it("rejects day numbers outside 1-7", async () => {
    await expect(weight.addWeight(9, "x", 1, 1)).rejects.toThrow();
  });
});
