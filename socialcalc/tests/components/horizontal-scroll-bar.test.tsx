/**
 * <HorizontalScrollBar> rendered against the real engine: it scrolls the grid, follows scrolling
 * done elsewhere, and reports changes through onColumnChange.
 */
import React, { useState } from "react";
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, fireEvent, act, cleanup as unmountAll } from "@testing-library/react";
import { bootEngine, idle } from "../helpers/engine";

let engine: Awaited<ReturnType<typeof bootEngine>>;
let api: any;

beforeAll(async () => {
  engine = await bootEngine();
  api = await import("../../react.js");
}, 20000);

afterEach(async () => {
  unmountAll();
  api.scrollToColumn(1);
  await idle(engine);
});

const slider = (c: HTMLElement) => c.querySelector(".sc-hscroll-slider") as HTMLInputElement;
const settle = async () => {
  await act(async () => {
    await idle(engine);
  });
};

describe("HorizontalScrollBar", () => {
  it("starts at column A with the left button disabled", () => {
    const { container, getByLabelText } = render(<api.HorizontalScrollBar />);
    expect(slider(container).value).toBe("1");
    expect(container.textContent).toContain("Col A");
    expect((getByLabelText("Scroll Left") as HTMLButtonElement).disabled).toBe(true);
  });

  it("arrow buttons scroll by `step` columns", async () => {
    const { container, getByLabelText } = render(<api.HorizontalScrollBar step={2} />);
    fireEvent.click(getByLabelText("Scroll Right"));
    await settle();
    expect(api.getHorizontalScrollInfo().currentFirstCol).toBe(3);
    expect(slider(container).value).toBe("3");
    expect(container.textContent).toContain("Col C");
  });

  it("the slider jumps to a column", async () => {
    const { container } = render(<api.HorizontalScrollBar />);
    fireEvent.change(slider(container), { target: { value: "6" } });
    await settle();
    expect(api.getHorizontalScrollInfo().currentFirstCol).toBe(6);
  });

  it("follows scrolling done outside the component", async () => {
    const { container } = render(<api.HorizontalScrollBar />);
    await act(async () => {
      engine.runtime.getEditor().ScrollRelativeBoth(0, 4);
      await idle(engine);
    });
    expect(slider(container).value).toBe(String(api.getHorizontalScrollInfo().currentFirstCol));
    expect(slider(container).value).not.toBe("1");
  });

  it("calls onColumnChange for changes, not on mount, and uses the latest callback", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, getByLabelText } = render(<api.HorizontalScrollBar onColumnChange={first} />);
    expect(first).not.toHaveBeenCalled();
    rerender(<api.HorizontalScrollBar onColumnChange={second} />); // a new inline callback
    fireEvent.click(getByLabelText("Scroll Right"));
    await settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ firstCol: 2, colName: "B" }));
  });

  it("a parent re-rendering with inline callbacks does not resubscribe each render", async () => {
    const calls: number[] = [];
    function Parent() {
      const [n, setN] = useState(0);
      return (
        <div>
          <button onClick={() => setN(n + 1)}>rerender</button>
          <api.HorizontalScrollBar onColumnChange={(info: any) => calls.push(info.firstCol)} />
        </div>
      );
    }
    const { getByText, getByLabelText } = render(<Parent />);
    for (let i = 0; i < 5; i++) fireEvent.click(getByText("rerender"));
    fireEvent.click(getByLabelText("Scroll Right"));
    await settle();
    expect(calls).toEqual([2]); // exactly one notification for one change
  });
});
