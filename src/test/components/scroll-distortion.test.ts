import { describe, it, expect, beforeEach } from "vitest";
import * as SocialCalcModule from "socialcalc";

describe("SocialCalc Scroll & Span Stability Tests", () => {
  let SocialCalc: any;

  beforeEach(() => {
    SocialCalc = SocialCalcModule.SocialCalc;
  });

  it("should have updated ScrollTableUpOneRow and ScrollTableDownOneRow methods", () => {
    expect(typeof SocialCalc.ScrollTableUpOneRow).toBe("function");
    expect(typeof SocialCalc.ScrollTableDownOneRow).toBe("function");
    expect(typeof SocialCalc.ScrollRelativeBoth).toBe("function");
  });

  it("should render sizing row and colgroup with explicit CSS pixel widths", () => {
    const sheet = new SocialCalc.Sheet();
    sheet.ParseSheetSave("version:1.5\ncell:A1:v:10\ncol:A:w:100\ncol:B:w:150\nsheet:c:5:r:10\n");
    
    const context = new SocialCalc.RenderContext(sheet);
    context.showRCHeaders = true;
    context.colpanes = [{ first: 1, last: 5 }];
    context.rowpanes = [{ first: 1, last: 10 }];
    context.CalculateColWidthData();

    const colgroup = context.RenderColGroup();
    expect(colgroup).toBeDefined();
    const cols = colgroup.querySelectorAll("col");
    // With rowname col (index 0) + Col A (index 1) + Col B (index 2)
    expect(cols.length).toBe(6);
    expect(cols[0].style.width).toBe(context.rownamewidth + "px");
    expect(cols[1].style.width).toBe("100px");
    expect(cols[2].style.width).toBe("150px");

    const sizingRow = context.RenderSizingRow();
    expect(sizingRow).toBeDefined();
    const cells = sizingRow.querySelectorAll("td");
    expect(cells.length).toBe(6);
    expect(cells[0].style.width).toBe(context.rownamewidth + "px");
    expect(cells[1].style.width).toBe("100px");
    expect(cells[1].style.minWidth).toBe("100px");
    expect(cells[1].style.maxWidth).toBe("100px");
    expect(cells[2].style.width).toBe("150px");
  });

  it("should render spanned continuation cells properly on vertical scrolling without missing cells", () => {
    const sheet = new SocialCalc.Sheet();
    // F4 has rowspan: 4 (rows 4, 5, 6, 7) and colspan: 2 (cols F, G: 6, 7)
    sheet.ParseSheetSave(
      "version:1.5\n" +
      "cell:A4:t:Row4\n" +
      "cell:F4:t:Logo:colspan:2:rowspan:4\n" +
      "cell:A5:t:Row5\n" +
      "cell:A6:t:Row6\n" +
      "cell:A7:t:Row7\n" +
      "sheet:c:10:r:10\n"
    );

    const context = new SocialCalc.RenderContext(sheet);
    context.colpanes = [{ first: 1, last: 10 }];
    context.rowpanes = [{ first: 5, last: 8 }]; // scrolled so row 5 is top visible row
    context.CalculateCellSkipData();
    context.CalculateColWidthData();

    // Render row 5 (which is the first visible continuation row of the span)
    const row5 = context.RenderRow(5, 0);
    expect(row5).toBeDefined();

    // Find the cell for the span continuation (which starts at col F=6)
    // Row 5 should contain a cell for F5 with spanColSpan: 2, spanRowSpan: 3
    const cells5 = Array.from(row5.querySelectorAll("td"));
    const spanTd = cells5.find((td: any) => td.colSpan === 2 || td.rowSpan === 3) as HTMLTableCellElement | undefined;
    expect(spanTd).toBeDefined();
    expect(spanTd?.colSpan).toBe(2);
    expect(spanTd?.rowSpan).toBe(3);

    // Render row 6 (the continuation row covered by row 5's td)
    const row6 = context.RenderRow(6, 0);
    expect(row6).toBeDefined();
    const cells6 = Array.from(row6.querySelectorAll("td"));
    // Row 6 should NOT create a duplicate TD for F6/G6 since row 5's rowSpan=3 covers them
    const duplicateSpanTd = cells6.find((td: any) => td.id && td.id.includes("F6"));
    expect(duplicateSpanTd).toBeUndefined();
  });

  it("should execute ScrollTableUpOneRow and ScrollTableDownOneRow synchronously with span re-rendering", () => {
    const sheet = new SocialCalc.Sheet();
    sheet.ParseSheetSave(
      "version:1.5\n" +
      "cell:A4:t:Row4\n" +
      "cell:F4:t:Logo:colspan:2:rowspan:4\n" +
      "cell:A5:t:Row5\n" +
      "cell:A6:t:Row6\n" +
      "cell:A7:t:Row7\n" +
      "sheet:c:10:r:20\n"
    );

    const context = new SocialCalc.RenderContext(sheet);
    context.showRCHeaders = true;
    context.colpanes = [{ first: 1, last: 10 }];
    context.rowpanes = [{ first: 4, last: 12 }];
    context.CalculateCellSkipData();
    context.CalculateColWidthData();

    // Setup dummy table DOM structure
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    // Header row + data rows
    tbody.appendChild(document.createElement("tr")); // header 1
    tbody.appendChild(document.createElement("tr")); // header 2
    for (let r = 4; r <= 12; r++) {
      tbody.appendChild(context.RenderRow(r, 0));
    }

    const editor = {
      context,
      fullgrid: table,
      FitToEditTable: () => {},
      SchedulePositionCalculations: () => {},
      ScheduleRender: () => {},
      ecell: null,
    };

    // Scroll up one row (row 4 scrolled off, row 5 becomes top)
    SocialCalc.ScrollTableUpOneRow(editor);
    expect(context.rowpanes[0].first).toBe(5);
    expect(context.rowpanes[0].last).toBe(13);

    // Scroll up another row (row 5 scrolled off, row 6 becomes top)
    SocialCalc.ScrollTableUpOneRow(editor);
    expect(context.rowpanes[0].first).toBe(6);
    expect(context.rowpanes[0].last).toBe(14);

    // Scroll down one row (row 5 returns as top)
    SocialCalc.ScrollTableDownOneRow(editor);
    expect(context.rowpanes[0].first).toBe(5);
    expect(context.rowpanes[0].last).toBe(13);
  });
});

