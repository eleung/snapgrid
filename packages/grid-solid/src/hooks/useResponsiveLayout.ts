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
import { type Accessor, createEffect, createMemo, on, untrack } from "solid-js";

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
  breakpoint: Accessor<string>;
  /** Column count for the active breakpoint. */
  cols: Accessor<number>;
  /** The resolved layout for the active breakpoint (generated if absent). */
  layout: Accessor<Layout>;
  /** Pass to the grid's `onLayoutChange`; updates the active breakpoint's layout. */
  onLayoutChange: (layout: Layout) => void;
}

/**
 * Headless responsive layout engine: resolves the active breakpoint and its column
 * count/layout from the container width, generating a layout for the active breakpoint
 * from the nearest one when missing. `getOptions` is a getter so the result tracks the
 * consumer's live width/layouts.
 */
export function useResponsiveLayout(
  getOptions: () => UseResponsiveLayoutOptions,
): ResponsiveLayoutHandle {
  // Split by input, so a width change re-generates the layout only when it crosses a
  // breakpoint: generation clones the layout, and a fresh clone per pixel of a window
  // resize would republish the grid and hand every tile a new entry. The per-field memos
  // re-evaluate whenever the getter's sources change but only notify when their value does.
  const width = createMemo(() => getOptions().width);
  const layouts = createMemo(() => getOptions().layouts);
  const breakpoints = createMemo(() => getOptions().breakpoints ?? DEFAULT_BREAKPOINTS);
  const colsByBreakpoint = createMemo(() => getOptions().cols ?? DEFAULT_BREAKPOINT_COLS);
  const compactor = createMemo(() => getOptions().compactor ?? verticalCompactor);

  const breakpoint = createMemo(() => getBreakpointFromWidth(breakpoints(), width()));
  const cols = createMemo(() => getColsFromBreakpoint(breakpoint(), colsByBreakpoint()));

  // The fallback source for generating a missing breakpoint is the widest provided
  // layout, so generation is a pure function of inputs (independent of visit order).
  const layout = createMemo(() => {
    const bp = breakpoint();
    const all = layouts();
    let source = bp;
    let sourceWidth = Number.NEGATIVE_INFINITY;
    for (const [name, minWidth] of Object.entries(breakpoints())) {
      if (all[name] && minWidth > sourceWidth) {
        sourceWidth = minWidth;
        source = name;
      }
    }
    return findOrGenerateResponsiveLayout(all, breakpoints(), bp, source, cols(), compactor());
  });

  // Fire onBreakpointChange when the active breakpoint actually changes. `defer` skips the
  // initial run, giving the "not on mount" rule for free (`on` runs the body untracked).
  createEffect(
    on(breakpoint, (bp) => getOptions().onBreakpointChange?.(bp, cols()), { defer: true }),
  );

  const onLayoutChange = (next: Layout): void => {
    const o = untrack(getOptions);
    o.onLayoutChange?.(next, { ...o.layouts, [untrack(breakpoint)]: next });
  };

  return { breakpoint, cols, layout, onLayoutChange };
}
