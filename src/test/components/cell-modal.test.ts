import { describe, it, expect, vi } from "vitest";
import * as AppGeneral from "socialcalc";

describe("Cell Edit Modal Plugin & Listeners", () => {
  it("should export cell modal control functions", () => {
    expect(typeof AppGeneral.enableCellEditModal).toBe("function");
    expect(typeof AppGeneral.disableCellEditModal).toBe("function");
    expect(typeof AppGeneral.toggleCellEditModal).toBe("function");
    expect(typeof AppGeneral.isCellEditModalEnabled).toBe("function");
    expect(typeof AppGeneral.setupMouseListener).toBe("function");
  });

  it("should toggle cell edit modal state properly", () => {
    AppGeneral.enableCellEditModal();
    expect(AppGeneral.isCellEditModalEnabled()).toBe(true);

    AppGeneral.disableCellEditModal();
    expect(AppGeneral.isCellEditModalEnabled()).toBe(false);

    const toggled = AppGeneral.toggleCellEditModal();
    expect(toggled).toBe(true);
    expect(AppGeneral.isCellEditModalEnabled()).toBe(true);

    const toggledOff = AppGeneral.toggleCellEditModal(false);
    expect(toggledOff).toBe(false);
    expect(AppGeneral.isCellEditModalEnabled()).toBe(false);

    // Re-enable for subsequent tests
    AppGeneral.enableCellEditModal();
    expect(AppGeneral.isCellEditModalEnabled()).toBe(true);
  });

  it("should dispatch socialcalc:cell-edit-request when clicking a cell with modal enabled", () => {
    AppGeneral.enableCellEditModal();

    // Mock SocialCalc environment with an active editor
    const mockCell = { datavalue: 42, datatype: "v", valuetype: "n" };
    const mockSheet = {
      cells: { B2: mockCell } as Record<string, any>,
      GetAssuredCell: vi.fn(() => mockCell),
      attribs: { lastcol: 26, lastrow: 50 },
    };
    const mockEditor = {
      ecell: { coord: "B2" },
      range: { hasrange: false },
      context: { sheetobj: mockSheet },
      MoveECell: vi.fn((coord) => coord),
      EditorMouseRange: vi.fn(),
      EditorScheduleSheetCommands: vi.fn(),
      ScheduleRender: vi.fn(),
    };

    const mockDiv = document.createElement("div");
    (window as any).SocialCalc = (window as any).SocialCalc || {};
    (window as any).SocialCalc.EditorMouseInfo = {
      registeredElements: [{ element: mockDiv, editor: mockEditor }],
      ignore: false,
    };
    (window as any).SocialCalc.LookupElement = vi.fn(() => ({ editor: mockEditor }));
    (window as any).SocialCalc.GridMousePosition = vi.fn(() => ({ coord: "B2", row: 2, col: 2 }));

    AppGeneral.setupMouseListener();

    let receivedDetail: any = null;
    const listener = (e: any) => {
      receivedDetail = e.detail;
    };
    window.addEventListener("socialcalc:cell-edit-request", listener);

    // Trigger mousedown event
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: mockDiv });
    (window as any).SocialCalc.ProcessEditorMouseDown(event);

    expect(receivedDetail).not.toBeNull();
    expect(receivedDetail.coord).toBe("B2");
    expect(receivedDetail.text).toBe("42");
    expect(typeof receivedDetail.okfn).toBe("function");
    // Reading the cell must not create it
    expect(mockSheet.GetAssuredCell).not.toHaveBeenCalled();

    // okfn schedules the encoded command; "socialcalc:cell-change" is emitted by the event bus
    // once the engine has actually run it (covered in the engine tests)
    receivedDetail.okfn("100");
    expect(mockEditor.EditorScheduleSheetCommands).toHaveBeenCalledWith("set B2 value n 100", true, false);

    // Test formula handling in okfn
    receivedDetail.okfn("=SUM(A1:A5)");
    expect(mockEditor.EditorScheduleSheetCommands).toHaveBeenCalledWith("set B2 formula SUM(A1:A5)", true, false);

    window.removeEventListener("socialcalc:cell-edit-request", listener);
  });
});
