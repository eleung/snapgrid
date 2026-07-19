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

export interface ResponsiveLayoutHandle {
  /** The active breakpoint name. */
  readonly breakpoint: string;
  /** Column count for the active breakpoint. */
  readonly cols: number;
  /** The resolved layout for the active breakpoint (generated if absent). */
  readonly layout: Layout;
  /** Pass to the grid's `onLayoutChange`; updates the active breakpoint's layout. */
  onLayoutChange: (layout: Layout) => void;
}

/**
 * Headless responsive layout engine: resolves the active breakpoint and its column
 * count/layout from the container width, generating a layout for the active
 * breakpoint from the nearest one when missing. `getOptions` is a getter so the
 * result tracks the consumer's live width/layouts.
 *
 * Must be called during component initialization.
 */
export function createResponsiveLayout(
  getOptions: () => UseResponsiveLayoutOptions,
): ResponsiveLayoutHandle {
  // Resolve everything in one derived so the pieces stay consistent and there are no
  // cross-`$derived` references. The fallback source for generating a missing
  // breakpoint is the widest provided layout, so generation is a pure function of
  // inputs (independent of visit order).
  const resolved = $derived.by(() => {
    const o = getOptions();
    const breakpoints = o.breakpoints ?? DEFAULT_BREAKPOINTS;
    const compactor = o.compactor ?? verticalCompactor;
    const breakpoint = getBreakpointFromWidth(breakpoints, o.width);
    const cols = getColsFromBreakpoint(breakpoint, o.cols ?? DEFAULT_BREAKPOINT_COLS);
    let source = breakpoint;
    let sourceWidth = Number.NEGATIVE_INFINITY;
    for (const [bp, minWidth] of Object.entries(breakpoints)) {
      if (o.layouts[bp] && minWidth > sourceWidth) {
        sourceWidth = minWidth;
        source = bp;
      }
    }
    const layout = findOrGenerateResponsiveLayout(
      o.layouts,
      breakpoints,
      breakpoint,
      source,
      cols,
      compactor,
    );
    return { breakpoint, cols, layout };
  });

  // Fire onBreakpointChange when the active breakpoint actually changes — but not on
  // mount (the first run just records the initial breakpoint).
  let firedBreakpoint: string | undefined;
  $effect(() => {
    const bp = resolved.breakpoint;
    if (firedBreakpoint === undefined) {
      firedBreakpoint = bp;
      return;
    }
    if (firedBreakpoint !== bp) {
      firedBreakpoint = bp;
      getOptions().onBreakpointChange?.(bp, resolved.cols);
    }
  });

  const onLayoutChange = (next: Layout): void => {
    const o = getOptions();
    o.onLayoutChange?.(next, { ...o.layouts, [resolved.breakpoint]: next });
  };

  return {
    get breakpoint() {
      return resolved.breakpoint;
    },
    get cols() {
      return resolved.cols;
    },
    get layout() {
      return resolved.layout;
    },
    onLayoutChange,
  };
}
