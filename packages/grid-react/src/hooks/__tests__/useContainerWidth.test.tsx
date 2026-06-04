import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type UseContainerWidthResult, useContainerWidth } from "../useContainerWidth.js";

// jsdom has neither ResizeObserver nor real layout, so we stub both: a fake
// observer whose callback we can fire, and a controllable getBoundingClientRect.
let rectWidth = 0;
const observerCallbacks: ResizeObserverCallback[] = [];

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    observerCallbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

let result: UseContainerWidthResult;
function Probe({ initialWidth }: { initialWidth?: number }) {
  result = useContainerWidth(initialWidth === undefined ? {} : { initialWidth });
  return <div ref={result.containerRef} />;
}

beforeEach(() => {
  rectWidth = 0;
  observerCallbacks.length = 0;
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        width: rectWidth,
        height: 0,
        top: 0,
        left: 0,
        right: rectWidth,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useContainerWidth", () => {
  it("returns initialWidth and mounted=false until a non-zero measurement", () => {
    // rectWidth stays 0 → measure() hits the `> 0` guard and no-ops, so the hook
    // keeps its initial value and never flips mounted (SSR-safe first paint).
    render(<Probe />);
    expect(result.width).toBe(1280); // default
    expect(result.mounted).toBe(false);
  });

  it("respects a custom initialWidth before measurement", () => {
    render(<Probe initialWidth={1024} />);
    expect(result.width).toBe(1024);
    expect(result.mounted).toBe(false);
  });

  it("measures the element on mount and flips mounted", () => {
    rectWidth = 800;
    render(<Probe />);
    expect(result.width).toBe(800);
    expect(result.mounted).toBe(true);
  });

  it("updates width when the ResizeObserver fires", () => {
    rectWidth = 800;
    render(<Probe />);
    expect(result.width).toBe(800);
    rectWidth = 500;
    act(() => {
      for (const cb of observerCallbacks) cb([], {} as ResizeObserver);
    });
    expect(result.width).toBe(500);
  });
});
