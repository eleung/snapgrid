import type { Layout, ResponsiveLayouts } from "@snapgridjs/core";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout.js";

const LG: Layout = [
  { i: "a", x: 0, y: 0, w: 6, h: 2 },
  { i: "b", x: 6, y: 0, w: 6, h: 2 },
  { i: "c", x: 0, y: 2, w: 12, h: 1 },
];
const layouts: ResponsiveLayouts = { lg: LG };

describe("useResponsiveLayout", () => {
  it("resolves the breakpoint and column count from width", () => {
    expect(
      renderHook(() => useResponsiveLayout({ width: 1300, layouts })).result.current,
    ).toMatchObject({ breakpoint: "lg", cols: 12 });
    expect(
      renderHook(() => useResponsiveLayout({ width: 800, layouts })).result.current,
    ).toMatchObject({ breakpoint: "sm", cols: 6 });
    expect(
      renderHook(() => useResponsiveLayout({ width: 400, layouts })).result.current,
    ).toMatchObject({ breakpoint: "xxs", cols: 2 });
  });

  it("returns the provided layout at its own breakpoint", () => {
    const { result } = renderHook(() => useResponsiveLayout({ width: 1300, layouts }));
    expect(result.current.layout).toHaveLength(3);
    expect(result.current.layout.find((i) => i.i === "b")).toMatchObject({ x: 6, w: 6 });
  });

  it("generates a missing breakpoint's layout, fitting it within the new column count", () => {
    const { result } = renderHook(() => useResponsiveLayout({ width: 400, layouts }));
    expect(result.current.cols).toBe(2);
    expect(result.current.layout).toHaveLength(3);
    // every item must fit within the 2-column grid
    for (const it of result.current.layout) {
      expect(it.x + it.w).toBeLessThanOrEqual(2);
    }
  });

  it("commits to the active breakpoint and returns the updated map", () => {
    const calls: ResponsiveLayouts[] = [];
    const { result } = renderHook(() =>
      useResponsiveLayout({
        width: 800,
        layouts,
        onLayoutChange: (_layout, all) => calls.push(all),
      }),
    );
    const next: Layout = [{ i: "a", x: 0, y: 0, w: 1, h: 1 }];
    result.current.onLayoutChange(next);
    expect(calls[0]?.sm).toEqual(next); // active bp is sm at width 800
    expect(calls[0]?.lg).toEqual(LG); // other breakpoints preserved
  });
});
