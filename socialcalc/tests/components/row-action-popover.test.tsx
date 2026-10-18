/**
 * <RowActionPopover>: a stateless menu driven by socialcalc:row-header-click.
 */
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup as unmountAll } from "@testing-library/react";
import { RowActionPopover } from "../../components/RowActionPopover/RowActionPopover";

afterEach(() => unmountAll());

function setup(overrides: any = {}) {
  const props = {
    isOpen: true,
    rowNum: 6,
    position: { x: 100, y: 200 },
    onClose: vi.fn(),
    onInsertAbove: vi.fn(),
    onInsertBelow: vi.fn(),
    onDeleteRow: vi.fn(),
    ...overrides,
  };
  return { props, view: render(<RowActionPopover {...props} />) };
}

describe("RowActionPopover", () => {
  it("renders nothing when closed, without a row or without a position", () => {
    for (const o of [{ isOpen: false }, { rowNum: null }, { position: null }]) {
      const { view } = setup(o);
      expect(view.container.innerHTML).toBe("");
      unmountAll();
    }
  });

  it("shows the row and runs each action with the row number, then closes", () => {
    const { props, view } = setup();
    expect(view.getByText("Row 6")).toBeTruthy();
    fireEvent.click(view.getByText("Insert above"));
    fireEvent.click(view.getByText("Insert below"));
    fireEvent.click(view.getByText("Delete row"));
    expect(props.onInsertAbove).toHaveBeenCalledWith(6);
    expect(props.onInsertBelow).toHaveBeenCalledWith(6);
    expect(props.onDeleteRow).toHaveBeenCalledWith(6);
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });

  it("closes on a backdrop click without running an action", () => {
    const { props, view } = setup();
    fireEvent.click(view.container.querySelector(".sc-row-popover-backdrop") as Element);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onDeleteRow).not.toHaveBeenCalled();
  });

  it("stays inside the viewport near the right and bottom edges", () => {
    const { view } = setup({ position: { x: window.innerWidth, y: window.innerHeight } });
    const menu = view.container.querySelector(".sc-row-popover-menu") as HTMLElement;
    expect(parseFloat(menu.style.left)).toBeLessThanOrEqual(window.innerWidth - 200);
    expect(parseFloat(menu.style.top)).toBeLessThanOrEqual(window.innerHeight - 180);
  });
});
