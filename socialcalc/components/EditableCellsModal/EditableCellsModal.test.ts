import { describe, it, expect } from "vitest";
import {
  parseAppMappingToItems,
  toggleCellEditable,
  deleteCellMapping,
  addCellMapping,
} from "./EditableCellsModal";
import { generateEditableCells } from "../../modules/editable-cells.js";

describe("EditableCellsModal helper logic", () => {
  const sampleMapping = {
    sheet1: {
      InvoiceTitle: {
        type: "text",
        cell: "B2",
        editable: true,
      },
      Logo: {
        type: "image",
        cell: "E5",
        editable: true,
      },
      BillTo: {
        type: "form",
        editable: true,
        formContent: {
          Name: { cell: "C5", editable: true, type: "text" },
          Address: { cell: "C6", editable: false, type: "text" },
        },
      },
      Total: {
        type: "text",
        cell: "F34",
        editable: false,
      },
    },
  };

  it("parses appMapping into flat item list with cells, titles, and types", () => {
    const items = parseAppMappingToItems(sampleMapping, "sheet1");
    expect(items.length).toBe(5);

    const titleItem = items.find((i) => i.cell === "B2");
    expect(titleItem).toBeDefined();
    expect(titleItem?.title).toBe("InvoiceTitle");
    expect(titleItem?.editable).toBe(true);

    const logoItem = items.find((i) => i.cell === "E5");
    expect(logoItem?.type).toBe("image");
    expect(logoItem?.editable).toBe(true);

    const nestedItem = items.find((i) => i.cell === "C6");
    expect(nestedItem?.title).toBe("BillTo → Address");
    expect(nestedItem?.editable).toBe(false);
  });

  it("toggles editable status dynamically and reflects in generateEditableCells", () => {
    const items = parseAppMappingToItems(sampleMapping, "sheet1");
    const addressItem = items.find((i) => i.cell === "C6")!;
    expect(addressItem.editable).toBe(false);

    // Toggle C6 to editable = true
    const updated = toggleCellEditable(sampleMapping, addressItem, true);
    const updatedItems = parseAppMappingToItems(updated, "sheet1");
    const updatedAddress = updatedItems.find((i) => i.cell === "C6")!;
    expect(updatedAddress.editable).toBe(true);

    // Verify generateEditableCells now includes sheet1!C6
    const result = generateEditableCells(updated, "sheet1");
    expect(result.cells["sheet1!C6"]).toBe(true);
  });

  it("deletes a cell mapping from appMapping", () => {
    const items = parseAppMappingToItems(sampleMapping, "sheet1");
    const titleItem = items.find((i) => i.cell === "B2")!;

    const updated = deleteCellMapping(sampleMapping, titleItem);
    const updatedItems = parseAppMappingToItems(updated, "sheet1");
    expect(updatedItems.find((i) => i.cell === "B2")).toBeUndefined();

    // Verify generateEditableCells no longer includes sheet1!B2
    const result = generateEditableCells(updated, "sheet1");
    expect(result.cells["sheet1!B2"]).toBeUndefined();
  });

  it("adds a new cell mapping and dynamically includes it in generateEditableCells", () => {
    const updated = addCellMapping(sampleMapping, "sheet1", {
      cell: "D15",
      title: "Discount",
      type: "text",
      editable: true,
    });

    const items = parseAppMappingToItems(updated, "sheet1");
    const newItem = items.find((i) => i.cell === "D15");
    expect(newItem).toBeDefined();
    expect(newItem?.title).toBe("Discount");
    expect(newItem?.editable).toBe(true);

    // Verify generateEditableCells immediately picks up the new cell!
    const result = generateEditableCells(updated, "sheet1");
    expect(result.cells["sheet1!D15"]).toBe(true);
  });

  it("only parses targetSheet items when isolated for a standalone template", () => {
    const multiMapping = {
      sheet1: {
        InvoiceTitle: { type: "text", cell: "B2", editable: true },
      },
      sheet2: {
        InvoiceNumber: { type: "text", cell: "D4", editable: true },
      },
    };

    // Target sheet1 only
    const sheet1Items = parseAppMappingToItems(multiMapping, "sheet1");
    expect(sheet1Items.length).toBe(1);
    expect(sheet1Items[0].cell).toBe("B2");
    expect(sheet1Items[0].sheet).toBe("sheet1");

    // Isolated single-sheet mapping
    const isolated = { sheet1: multiMapping.sheet1 };
    const isolatedItems = parseAppMappingToItems(isolated, "sheet1");
    expect(isolatedItems.length).toBe(1);
    expect(isolatedItems[0].cell).toBe("B2");
  });
});
