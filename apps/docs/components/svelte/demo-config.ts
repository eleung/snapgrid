import type { Layout, ResponsiveLayouts } from "@snapgridjs/svelte";

// Shared demo constants, mirroring the React gallery (components/demos.tsx) so the
// two galleries render the same structure, geometry, and layouts.

// containerPadding [0,0] so the first tile sits flush at the surface edge — aligning
// with the controls/labels at that same edge. Outer breathing room comes from the
// stage/card padding, not the grid's own padding.
export const GRID = {
  cols: 12,
  rowHeight: 52,
  margin: [10, 10] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

// The DemoFrame stage's measured width. Full-stage demos seed `initialWidth` with it
// so their first paint matches the measured size — no reflow when the RO fires.
export const STAGE_WIDTH = 798;

// Shared starter layout, also reused by the snap & component-layer demos.
export const BASIC: Layout = [
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 8, y: 0, w: 4, h: 3 },
  { i: "d", x: 0, y: 2, w: 6, h: 2 },
  { i: "e", x: 6, y: 2, w: 2, h: 2 },
];

// Home-page hero grid (mirrors the React `HERO`). Every other tile is accented.
export const HERO: Layout = [
  { i: "drag", x: 0, y: 0, w: 4, h: 2 },
  { i: "resize", x: 4, y: 0, w: 4, h: 2 },
  { i: "repack", x: 8, y: 0, w: 4, h: 2 },
  { i: "responsive", x: 0, y: 2, w: 6, h: 2 },
  { i: "cross-grid", x: 6, y: 2, w: 6, h: 2 },
];
export const HERO_ACCENT = HERO.filter((_, idx) => idx % 2 === 1).map((it) => it.i);

export const PACK: Layout = [
  { i: "p1", x: 0, y: 0, w: 3, h: 2 },
  { i: "p2", x: 3, y: 0, w: 2, h: 3 },
  { i: "p3", x: 5, y: 0, w: 4, h: 1 },
  { i: "p4", x: 9, y: 0, w: 3, h: 2 },
  { i: "p5", x: 0, y: 2, w: 2, h: 1 },
  { i: "p6", x: 5, y: 1, w: 3, h: 2 },
];

export const RESIZE: Layout = [
  { i: "min 2×1", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
  { i: "max 6×3", x: 4, y: 0, w: 4, h: 2, maxW: 6, maxH: 3 },
  { i: "free", x: 8, y: 0, w: 4, h: 2 },
];

export const HANDLE: Layout = [
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 8, y: 0, w: 4, h: 2 },
];

// The "anchor" tile is static; the demo toggles its `isDraggable` to contrast a
// LOCKED tile with a PINNED one (anchored against reflow, but still draggable).
export const STATIC: Layout = [
  { i: "a", x: 0, y: 0, w: 3, h: 2 },
  { i: "anchor", x: 3, y: 0, w: 4, h: 2, static: true },
  { i: "b", x: 7, y: 0, w: 2, h: 2 },
  { i: "c", x: 9, y: 0, w: 3, h: 2 },
];

// Cross-grid: two independent grids under one SnapGridGroup.
export const LEFT: Layout = [
  { i: "L1", x: 0, y: 0, w: 3, h: 2 },
  { i: "L2", x: 3, y: 0, w: 3, h: 1 },
  { i: "L3", x: 0, y: 2, w: 4, h: 1 },
];
export const RIGHT: Layout = [
  { i: "R1", x: 0, y: 0, w: 3, h: 1 },
  { i: "R2", x: 3, y: 0, w: 3, h: 2 },
];
export const CROSS = {
  cols: 6,
  rowHeight: 48,
  margin: [8, 8] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

// Responsive: breakpoints scaled to the demo's width range so the full range fits the
// docs column. The real lg/md/sm defaults are documented in the Responsive guide.
export const RESP_BREAKPOINTS = { full: 480, mid: 360, compact: 0 };
export const RESP_COLS = { full: 12, mid: 8, compact: 4 };
export const RESP: ResponsiveLayouts = {
  full: [
    { i: "r1", x: 0, y: 0, w: 4, h: 2 },
    { i: "r2", x: 4, y: 0, w: 4, h: 2 },
    { i: "r3", x: 8, y: 0, w: 4, h: 2 },
    { i: "r4", x: 0, y: 2, w: 6, h: 1 },
    { i: "r5", x: 6, y: 2, w: 6, h: 1 },
  ],
};
export const RESP_MIN = 240;

// Nested: an 8-column inner grid in an 8-column-wide panel, sharing the outer grid's
// rowHeight + margin so the inner cells line up with the outer grid's rhythm.
export const NESTED_OUTER: Layout = [
  { i: "panel", x: 0, y: 0, w: 8, h: 4 },
  { i: "a", x: 8, y: 0, w: 4, h: 2 },
  { i: "b", x: 8, y: 2, w: 4, h: 2 },
];
export const NESTED_INNER: Layout = [
  { i: "1", x: 0, y: 0, w: 2, h: 1 },
  { i: "2", x: 2, y: 0, w: 2, h: 1 },
  { i: "3", x: 4, y: 0, w: 2, h: 1 },
  { i: "4", x: 0, y: 1, w: 4, h: 1 },
];
export const NESTED_INNER_GRID = {
  cols: 8,
  rowHeight: 52,
  margin: [10, 10] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

// External drop: the palette (each chip carries a `snapGridDrop` size payload).
export const PALETTE = [
  { id: "pal-sm", label: "small", w: 2, h: 1 },
  { id: "pal-wide", label: "wide", w: 4, h: 1 },
  { id: "pal-tall", label: "tall", w: 2, h: 3 },
];
export const EXTERNAL_GRID = {
  cols: 8,
  rowHeight: 44,
  margin: [8, 8] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

// Nested drop zone: a grid whose right-hand "Archive" panel is a plain (non-grid)
// droppable that opts into snapgrid's depth ranking, so it outranks the grid it sits in.
export const DROPZONE_INIT: Layout = [
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 0, y: 2, w: 4, h: 2 },
  { i: "d", x: 4, y: 2, w: 4, h: 2 },
  // The panel that hosts the drop zone: static, so it never drags.
  { i: "archive", x: 8, y: 0, w: 4, h: 4, static: true },
];
export const ARCHIVE_ZONE_ID = "archive-zone";

// Sortable ↔ grid interop.
export const INTEROP_GRID = {
  cols: 6,
  rowHeight: 60,
  margin: [10, 10] as [number, number],
  containerPadding: [0, 0] as [number, number],
};
export const INTEROP_TRAY_W = 132;
export const INTEROP_GAP = 16;
export const INTEROP_GRID_INIT: Layout = [
  { i: "chart", x: 0, y: 0, w: 4, h: 2 },
  { i: "stats", x: 4, y: 0, w: 2, h: 2 },
  { i: "feed", x: 0, y: 2, w: 3, h: 2 },
];
export const INTEROP_TRAY_INIT = ["users", "sales", "tasks"];
