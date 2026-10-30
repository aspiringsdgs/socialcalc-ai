/**
 * <CellEditModal> rendered with React against the real engine: what the user sees, what Apply
 * writes, and what Cancel / Escape / the backdrop do.
 */
import React from "react";
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup as unmountAll } from "@testing-library/react";
import { bootEngine, idle, run, cell, clickCell, captureEditRequest } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let api: any;

beforeAll(async () => {
  engine = await bootEngine();
  api = await import("../../react.js");
  api.setupMouseListener();
  api.enableCellEditModal();
}, 20000);

afterEach(async () => {
  unmountAll();
  await idle(engine);
});

/** Opens the modal the way an app does: from the cell-edit-request a click produces. */
function openFor(coord: string) {
  const cellData = captureEditRequest(() => clickCell(engine, coord));
  const cleanupSpy = vi.spyOn(cellData, "cleanup");
  const onClose = vi.fn();
  const view = render(<api.CellEditModal isOpen cellData={cellData} onClose={onClose} />);
  const input = view.container.querySelector(".sc-cell-input") as HTMLInputElement;
  return { view, input, onClose, cleanupSpy, cellData };
}

function countCommands() {
  const cmds: string[] = [];
  const off = engine.events.on("command", (d: any) => cmds.push(d.cmdstr));
  return { cmds, off };
}

describe("rendering", () => {
  it("renders nothing while closed", () => {
    const { container } = render(<api.CellEditModal isOpen={false} cellData={null} onClose={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows the title, the coordinate and the cell's editable text", async () => {
    await run(engine, ["set R5 constant n$ 1200 $1,200"]);
    const { view, input } = openFor("R5");
    expect(view.getByText("Edit Cell")).toBeTruthy();
    expect(view.getByText("R5")).toBeTruthy();
    expect(input.value).toBe("$1,200");
  });

  it("accepts a custom title", () => {
    const cellData = { coord: "R6", text: "", okfn: () => true };
    const view = render(<api.CellEditModal isOpen cellData={cellData} onClose={() => {}} title="Payment" />);
    expect(view.getByText("Payment")).toBeTruthy();
  });
});

describe("Apply", () => {
  it("stores a typed amount like '1,200' as a number and closes", async () => {
    const { view, input, onClose, cleanupSpy } = openFor("R7");
    fireEvent.change(input, { target: { value: "1,200" } });
    fireEvent.click(view.getByText("Apply"));
    await idle(engine);
    expect(cell(engine, "R7").datavalue).toBe(1200);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(cleanupSpy).toHaveBeenCalled();
  });

  it("Enter applies too", async () => {
    const { input, onClose } = openFor("R8");
    fireEvent.change(input, { target: { value: "=6*7" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await idle(engine);
    expect(cell(engine, "R8").datavalue).toBe(42);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not rewrite an unchanged value (no command, no undo step)", async () => {
    await run(engine, ["set R9 constant n% 0.25 25%"]);
    const { view, onClose } = openFor("R9");
    const { cmds, off } = countCommands();
    fireEvent.click(view.getByText("Apply"));
    await idle(engine);
    off();
    expect(cmds).toEqual([]);
    expect(cell(engine, "R9").datatype).toBe("c");
    expect(onClose).toHaveBeenCalled();
  });

  it("stays open when a before-commit hook rejects the value", async () => {
    const remove = api.addBeforeCellCommitHook((_c: string, v: any) => !String(v).startsWith("-"));
    try {
      const { view, input, onClose } = openFor("R10");
      fireEvent.change(input, { target: { value: "-5" } });
      fireEvent.click(view.getByText("Apply"));
      await idle(engine);
      expect(onClose).not.toHaveBeenCalled();
      expect(cell(engine, "R10")).toBeUndefined();
    } finally {
      remove();
    }
  });

  it("applies a background color without touching the value", async () => {
    await run(engine, ["set R11 value n 3"]);
    const { view, onClose } = openFor("R11");
    fireEvent.click(view.getByText("Options"));
    const propertyButtons = view.container.querySelectorAll(".sc-property-btn");
    fireEvent.click(propertyButtons[1]); // background color
    fireEvent.click(view.container.querySelector('.sc-color-swatch[title="Light Blue"]') as Element);
    fireEvent.click(view.getByText("Apply"));
    await idle(engine);
    expect(api.getCellFormatting("R11")?.bgcolor).toBe("lightblue");
    expect(cell(engine, "R11").datavalue).toBe(3);
    expect(onClose).toHaveBeenCalled();
  });

  it("recognises the cell's existing color in the palette", async () => {
    await run(engine, ["set R12 text t x", "set R12 bgcolor rgb(173,216,230)"]); // lightblue as rgb()
    const { view } = openFor("R12");
    fireEvent.click(view.getByText("Options"));
    fireEvent.click(view.container.querySelectorAll(".sc-property-btn")[1]);
    const selected = view.container.querySelector(".sc-color-swatch.selected") as HTMLElement;
    expect(selected?.getAttribute("title")).toBe("Light Blue");
  });
});

describe("Cancel", () => {
  it("Cancel, Escape and the backdrop close without writing", async () => {
    for (const how of ["button", "escape", "backdrop"]) {
      const { view, input, onClose, cleanupSpy } = openFor("R13");
      fireEvent.change(input, { target: { value: "should not be saved" } });
      if (how === "button") fireEvent.click(view.container.querySelector(".sc-cell-btn-cancel") as Element);
      if (how === "escape") fireEvent.keyDown(input, { key: "Escape" });
      if (how === "backdrop") fireEvent.click(view.container.querySelector(".sc-cell-modal-backdrop") as Element);
      await idle(engine);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(cleanupSpy).toHaveBeenCalled();
      expect(cell(engine, "R13")).toBeUndefined();
      unmountAll();
    }
  });

  it("keys typed in the modal do not reach the grid", () => {
    const SC = engine.SocialCalc;
    const { input } = openFor("R14");
    const spy = vi.spyOn(SC, "ProcessKey");
    try {
      input.focus();
      SC.ProcessKeyDown(new KeyboardEvent("keydown", { keyCode: 40, which: 40 } as any));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
