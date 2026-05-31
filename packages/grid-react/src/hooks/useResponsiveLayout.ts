import {
  type BreakpointCols,
  type Breakpoints,
  type Compactor,
  type Layout,
  type ResponsiveLayouts,
  findOrGenerateResponsiveLayout,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  verticalCompactor,
} from "@snapgridjs/core";
import { useCallback, useEffect, useMemo, useRef } from "react";

/** react-grid-layout's default breakpoints (px) and column counts. */
export const DEFAULT_BREAKPOINTS: Breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
export const DEFAULT_BREAKPOINT_COLS: BreakpointCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

export interface UseResponsiveLayoutOptions {
  /** Current container width in pixels. */
  width: number;
  /** Controlled per-breakpoint layouts. Missing breakpoints are generated from the nearest one. */
  layouts: ResponsiveLayouts;
  /** Breakpoint → min width (px). @default lg/md/sm/xs/xxs */
  breakpoints?: Breakpoints;
  /** Breakpoint → column count. @default 12/10/6/4/2 */
  cols?: BreakpointCols;
  /** Compaction strategy used when generating a missing breakpoint's layout. */
  compactor?: Compactor;
  /** Called when a layout commits: the active layout and the updated map. */
  onLayoutChange?: (layout: Layout, layouts: ResponsiveLayouts) => void;
  /** Called when the active breakpoint changes. */
  onBreakpointChange?: (breakpoint: string, cols: number) => void;
}

export interface UseResponsiveLayoutResult {
  /** The active breakpoint name. */
  breakpoint: string;
  /** Column count for the active breakpoint. */
  cols: number;
  /** The resolved layout for the active breakpoint (generated if absent). */
  layout: Layout;
  /** Pass to the grid's `onLayoutChange`; updates the active breakpoint's layout. */
  onLayoutChange: (layout: Layout) => void;
}

/**
 * Headless responsive layout engine: resolves the active breakpoint and its
 * column count/layout from the container width, generating a layout for the
 * active breakpoint from the nearest one when missing.
 */
export function useResponsiveLayout(
  options: UseResponsiveLayoutOptions,
): UseResponsiveLayoutResult {
  const {
    width,
    layouts,
    breakpoints = DEFAULT_BREAKPOINTS,
    cols = DEFAULT_BREAKPOINT_COLS,
    compactor = verticalCompactor,
    onLayoutChange,
    onBreakpointChange,
  } = options;

  const breakpoint = getBreakpointFromWidth(breakpoints, width);
  const colCount = getColsFromBreakpoint(breakpoint, cols);

  // Memoized so the clone + compact over every item only runs when an input
  // actually changes (not on every render/width tick). The fallback source for
  // generating a missing breakpoint — used by findOrGenerateResponsiveLayout
  // only when no provided breakpoint sits at/above the target — is the widest
  // provided layout. Derived purely from inputs (no ref mutated in an effect),
  // so generation is a pure function of render inputs (StrictMode/concurrent
  // safe) and no longer depends on the order breakpoints were visited.
  const layout = useMemo(() => {
    let source = breakpoint;
    let sourceWidth = Number.NEGATIVE_INFINITY;
    for (const [bp, minWidth] of Object.entries(breakpoints)) {
      if (layouts[bp] && minWidth > sourceWidth) {
        sourceWidth = minWidth;
        source = bp;
      }
    }
    return findOrGenerateResponsiveLayout(
      layouts,
      breakpoints,
      breakpoint,
      source,
      colCount,
      compactor,
    );
  }, [layouts, breakpoints, breakpoint, colCount, compactor]);

  // Fire onBreakpointChange when the active breakpoint actually changes. This ref
  // is written only inside the effect (never read during render), so render stays pure.
  const onBreakpointChangeRef = useRef(onBreakpointChange);
  onBreakpointChangeRef.current = onBreakpointChange;
  const firedBreakpointRef = useRef(breakpoint);
  useEffect(() => {
    if (firedBreakpointRef.current !== breakpoint) {
      firedBreakpointRef.current = breakpoint;
      onBreakpointChangeRef.current?.(breakpoint, colCount);
    }
  }, [breakpoint, colCount]);

  const handleLayoutChange = useCallback(
    (next: Layout) => {
      onLayoutChange?.(next, { ...layouts, [breakpoint]: next });
    },
    [onLayoutChange, layouts, breakpoint],
  );

  return { breakpoint, cols: colCount, layout, onLayoutChange: handleLayoutChange };
}
