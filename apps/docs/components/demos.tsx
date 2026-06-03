"use client";

import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
import {
  type Compactor,
  GridLayout,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
  SnapGridGroup,
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridPlaceholder,
  useGridResizeHandle,
  useResponsiveLayout,
  verticalCompactor,
} from "@snapgridjs/react";
import { Heart } from "lucide-react";
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { DemoFrame, Pill, ROW, Tile } from "./DemoFrame";
import { EXAMPLE_CODE } from "./generated/example-code";
import { GridSkeleton } from "./showcase/GridSkeleton";

// containerPadding [0,0] so the first tile sits flush at the surface edge —
// aligning with the controls/labels that sit at that same edge. Outer breathing
// room comes from the stage/card padding, not the grid's own padding.
const GRID = {
  cols: 12,
  rowHeight: 52,
  margin: [10, 10] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

// The DemoFrame stage's measured width. Full-stage demos seed `initialWidth` with
// it so their first paint matches the measured size — no reflow when the
// ResizeObserver fires.
const STAGE_WIDTH = 798;

// Default tile content (label + size) shared by most demos.
function tileContent(item: LayoutItem, accentId?: string): ReactNode {
  return (
    <Tile
      label={item.i.toUpperCase()}
      meta={`${item.w}×${item.h}`}
      accent={item.i === accentId}
      isStatic={item.static}
    />
  );
}

// Options accepted by useGridContainer, minus the controlled state the helper threads.
type GridOpts = Omit<Parameters<typeof useGridContainer>[0], "layout" | "width" | "onLayoutChange">;

/**
 * The headless wiring every demo shares: a dnd-kit DragDropProvider, the
 * useGridContainer host, and a positioned tile per item (useGridItem) that floats
 * itself while dragging. `renderContent` draws a tile's inner content. This is
 * exactly the pattern the docs teach — demos just supply config + content. Pass
 * `containerRef`/measured `width` from the caller.
 *
 * The DragDropProvider is the OUTERMOST element: `useGridContainer` must run
 * inside it (it registers the grid's controller on the provider's dnd-kit
 * manager), so the host lives in a child component, not in this body.
 */
function HeadlessGrid(props: {
  layout: Layout;
  width: number;
  onLayoutChange: (next: Layout) => void;
  options?: GridOpts;
  renderContent?: (item: LayoutItem) => ReactNode;
  /** Render a bottom-right resize handle on each (resizable) tile. */
  resizable?: boolean;
}) {
  return (
    <DragDropProvider>
      <HeadlessGridHost {...props} />
    </DragDropProvider>
  );
}

// The grid host — rendered inside HeadlessGrid's provider so useGridContainer
// resolves the right manager. Renders the surface, tiles, and the placeholder.
function HeadlessGridHost({
  layout,
  width,
  onLayoutChange,
  options,
  renderContent = (item) => tileContent(item),
  resizable,
}: {
  layout: Layout;
  width: number;
  onLayoutChange: (next: Layout) => void;
  options?: GridOpts;
  renderContent?: (item: LayoutItem) => ReactNode;
  resizable?: boolean;
}) {
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    ...options,
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div {...containerProps} className="dg-grid">
      {layout.map((item) => (
        <GridTile key={item.i} id={item.i} group={group} resizable={resizable}>
          {renderContent(item)}
        </GridTile>
      ))}
      <Placeholder placeholder={placeholder} />
    </div>
  );
}

// A single positioned grid tile: spreads useGridItem's ref + style onto a
// wrapper that holds whatever content the demo rendered, plus a resize handle.
// `dg-cell` is the demo's own hook for styling/tests — headless tiles carry no
// class from the library.
function GridTile({
  id,
  group,
  resizable,
  children,
}: {
  id: string;
  group: string;
  resizable?: boolean;
  children: ReactNode;
}) {
  const { ref, style, item } = useGridItem(id, group);
  // Match the library's per-item gating: static or isResizable:false → no handle.
  const showHandle = resizable && !!item && !item.static && item.isResizable !== false;
  return (
    <div ref={ref} style={style} className="dg-cell">
      {children}
      {showHandle && <ResizeHandle id={id} group={group} />}
    </div>
  );
}

// A bottom-right resize handle, modelled as its own draggable via
// useGridResizeHandle. `handleProps` keeps a pointer-down on it from starting an
// item drag; CSS (`.dg-rh`) places + styles it.
function ResizeHandle({ id, group }: { id: string; group: string }) {
  const { ref, handleProps } = useGridResizeHandle(id, "se", group);
  return <span ref={ref} {...handleProps} className="dg-rh dg-rh--se" />;
}

// The landing-cell marker shown while a tile is dragged — useGridPlaceholder
// returns its position (or null when idle). Headless grids render their own.
function Placeholder({ placeholder }: { placeholder: ReturnType<typeof useGridPlaceholder> }) {
  if (!placeholder) return null;
  return (
    <div
      className="dg-placeholder"
      style={{
        ...placeholder.style,
        border: "1px dashed var(--dg-accent)",
        borderRadius: 9,
        background: "var(--dg-accent-soft)",
        // Ease the slide/resize as the landing cell moves, matching the
        // component layer's <GridPlaceholder> (GridPlaceholder.tsx DEFAULT_LOOK).
        transition: "transform 150ms ease, width 150ms ease, height 150ms ease",
      }}
    />
  );
}

/* ── Basic grid ─────────────────────────────────────────────────────────── */
// Shared starter layout, also reused by the snap & headless demos below.
const BASIC: Layout = [
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 8, y: 0, w: 4, h: 3 },
  { i: "d", x: 0, y: 2, w: 6, h: 2 },
  { i: "e", x: 6, y: 2, w: 2, h: 2 },
];

export function BasicGridDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(BASIC);
  return (
    <DemoFrame
      title="Drag & resize"
      hint="drag a tile · resize from the corner"
      code={EXAMPLE_CODE.basic}
    >
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, resizeConfig: { handles: ["se"] } }}
          resizable
        />
      </div>
    </DemoFrame>
  );
}

/* ── Compaction switcher ────────────────────────────────────────────────── */
const PACKERS: Record<string, Compactor> = {
  vertical: verticalCompactor,
  horizontal: horizontalCompactor,
  masonry: masonryCompactor,
  gravity: gravityCompactor,
  shelf: shelfCompactor,
  none: noCompactor,
};
const PACK: Layout = [
  { i: "p1", x: 0, y: 0, w: 3, h: 2 },
  { i: "p2", x: 3, y: 0, w: 2, h: 3 },
  { i: "p3", x: 5, y: 0, w: 4, h: 1 },
  { i: "p4", x: 9, y: 0, w: 3, h: 2 },
  { i: "p5", x: 0, y: 2, w: 2, h: 1 },
  { i: "p6", x: 5, y: 1, w: 3, h: 2 },
];

export function CompactorDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [packer, setPacker] = useState("vertical");
  const [layout, setLayout] = useState<Layout>(PACK);
  return (
    <DemoFrame
      title="Compaction"
      hint="swap the packing algorithm, then drag"
      code={EXAMPLE_CODE.compaction}
    >
      <div style={ROW}>
        {Object.keys(PACKERS).map((name) => (
          <Pill
            key={name}
            active={packer === name}
            onClick={() => {
              setPacker(name);
              setLayout((prev) => PACKERS[name]?.compact(prev, GRID.cols) ?? prev);
            }}
          >
            {name}
          </Pill>
        ))}
      </div>
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, compactor: PACKERS[packer] }}
        />
      </div>
    </DemoFrame>
  );
}

/* ── Resizing with constraints ──────────────────────────────────────────── */
const RESIZE: Layout = [
  { i: "min 2×1", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
  { i: "max 6×3", x: 4, y: 0, w: 4, h: 2, maxW: 6, maxH: 3 },
  { i: "free", x: 8, y: 0, w: 4, h: 2 },
];

export function ResizeDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(RESIZE);
  return (
    <DemoFrame
      title="Resize constraints"
      hint="drag the corner · min/max enforced"
      code={EXAMPLE_CODE.resize}
    >
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, resizeConfig: { handles: ["se"] } }}
          resizable
          renderContent={(it) => <Tile label={it.i} meta={`${it.w}×${it.h}`} />}
        />
      </div>
    </DemoFrame>
  );
}

/* ── Drag handle ────────────────────────────────────────────────────────── */
const HANDLE: Layout = [
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 8, y: 0, w: 4, h: 2 },
];

export function DragHandleDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(HANDLE);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const like = (id: string) => setLikes((l) => ({ ...l, [id]: (l[id] ?? 0) + 1 }));
  return (
    <DemoFrame
      title="Drag handle"
      hint="only the ⠿ grip starts a drag — the button stays clickable"
      code={EXAMPLE_CODE.dragHandle}
    >
      <div ref={containerRef}>
        <DragDropProvider>
          <DragHandleSurface
            layout={layout}
            width={width}
            onLayoutChange={setLayout}
            likes={likes}
            onLike={like}
          />
        </DragDropProvider>
      </div>
    </DemoFrame>
  );
}

function DragHandleSurface({
  layout,
  width,
  onLayoutChange,
  likes,
  onLike,
}: {
  layout: Layout;
  width: number;
  onLayoutChange: (next: Layout) => void;
  likes: Record<string, number>;
  onLike: (id: string) => void;
}) {
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: GRID,
    isResizable: false,
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div {...containerProps} className="dg-grid">
      {layout.map((it) => (
        <DragHandleTile
          key={it.i}
          id={it.i}
          group={group}
          likes={likes[it.i] ?? 0}
          onLike={() => onLike(it.i)}
        />
      ))}
      <Placeholder placeholder={placeholder} />
    </div>
  );
}

// The grip carries `handleRef` — only a pointer-down there starts a drag, so the
// Like button stays clickable. No `dragConfig.handle` selector needed.
function DragHandleTile({
  id,
  group,
  likes,
  onLike,
}: {
  id: string;
  group: string;
  likes: number;
  onLike: () => void;
}) {
  const { ref, style, handleRef } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="dg-cell">
      <div className="dg-tile dg-tile--barred" style={{ width: "100%", height: "100%" }}>
        <span ref={handleRef} className="dg-grip dg-grip--bar">
          ⠿ {id.toUpperCase()}
        </span>
        <button
          type="button"
          className="dg-likebtn"
          data-liked={likes > 0 || undefined}
          onClick={onLike}
        >
          <Heart size={13} fill={likes > 0 ? "currentColor" : "none"} />
          {likes > 0 ? likes : "Like"}
        </button>
      </div>
    </div>
  );
}

/* ── Static item ────────────────────────────────────────────────────────── */
const STATIC: Layout = [
  { i: "a", x: 0, y: 0, w: 3, h: 2 },
  { i: "pinned", x: 3, y: 0, w: 3, h: 2, static: true },
  { i: "b", x: 6, y: 0, w: 3, h: 2 },
  { i: "c", x: 9, y: 0, w: 3, h: 2 },
];

export function StaticItemDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(STATIC);
  return (
    <DemoFrame
      title="Static items"
      hint="the hatched tile is pinned — others flow around it"
      code={EXAMPLE_CODE.static}
    >
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID }}
        />
      </div>
    </DemoFrame>
  );
}

/* ── Snap-to-grid ───────────────────────────────────────────────────────── */
export function SnapDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [snap, setSnap] = useState(false);
  const [layout, setLayout] = useState<Layout>(BASIC.slice(0, 4));
  return (
    <DemoFrame
      title="Snap to grid"
      hint="toggle whether the dragged tile snaps or glides"
      code={EXAMPLE_CODE.snap}
    >
      <div style={ROW}>
        <Pill active={!snap} onClick={() => setSnap(false)}>
          glide (default)
        </Pill>
        <Pill active={snap} onClick={() => setSnap(true)}>
          snapToGrid
        </Pill>
      </div>
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{ gridConfig: GRID, dragConfig: { snapToGrid: snap } }}
        />
      </div>
    </DemoFrame>
  );
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
// Breakpoints scaled to the demo's width range so the full range fits the docs
// column without forcing an over-wide (clipping) layout. The real lg/md/sm
// defaults are documented in the Responsive guide. Resize the preview to reflow.
const RESP_BREAKPOINTS = { full: 480, mid: 360, compact: 0 };
const RESP_COLS = { full: 12, mid: 8, compact: 4 };
const RESP: ResponsiveLayouts = {
  full: [
    { i: "r1", x: 0, y: 0, w: 4, h: 2 },
    { i: "r2", x: 4, y: 0, w: 4, h: 2 },
    { i: "r3", x: 8, y: 0, w: 4, h: 2 },
    { i: "r4", x: 0, y: 2, w: 6, h: 1 },
    { i: "r5", x: 6, y: 2, w: 6, h: 1 },
  ],
};
const RESP_MIN = 240;

export function ResponsiveDemo() {
  // Measure the available stage width; the preview never exceeds it (no clipping).
  const { width: avail, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(RESP);
  // Infinity = "as wide as the stage allows" (clamped to `max` below), so the demo
  // opens truly Large/full-width instead of a fixed 520px that looks small in a
  // wider stage. Dragging or Small/Medium replaces it with a concrete width.
  const [requested, setRequested] = useState(Number.POSITIVE_INFINITY);
  const drag = useRef<{ x: number; w: number } | null>(null);

  const max = Math.max(RESP_MIN, Math.round(avail));
  const previewW = Math.min(Math.max(requested, RESP_MIN), max);

  // Headless responsive: resolve the active breakpoint's columns + layout from the
  // preview width (the same hook the turnkey ResponsiveGridLayout uses internally),
  // then feed them into the shared HeadlessGrid below — like every other demo here.
  const { layout, cols, onLayoutChange } = useResponsiveLayout({
    width: previewW,
    layouts,
    breakpoints: RESP_BREAKPOINTS,
    cols: RESP_COLS,
    onLayoutChange: (_active, all) => setLayouts(all),
  });

  // A preset is hidden when its target width can't fit the stage (it would just
  // clamp to full and duplicate Large). The active preset is derived once so the
  // buckets stay mutually exclusive: Large is the catch-all and wins at full
  // width, so a folded/hidden range never leaves nothing — or two pills — lit.
  const showSmall = max >= 300;
  const showMedium = max >= 420;
  const atFull = previewW >= max;
  const active =
    !atFull && showSmall && previewW < 360
      ? "small"
      : !atFull && showMedium && previewW < 480
        ? "medium"
        : "large";

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    drag.current = { x: e.clientX, w: previewW };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Suppress text selection on the page while dragging (pointerdown's own
    // preventDefault doesn't stop the compatibility mousedown selection).
    document.body.style.userSelect = "none";
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current) setRequested(drag.current.w + (e.clientX - drag.current.x));
  };
  // Used for both pointerup and pointercancel (touch/pen/system interruptions
  // fire cancel, not up) so the page-wide selection lock is always released.
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    document.body.style.userSelect = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  // Restore the selection lock if we unmount mid-drag (e.g. SPA navigation).
  useEffect(
    () => () => {
      if (drag.current) document.body.style.userSelect = "";
    },
    [],
  );

  return (
    <DemoFrame
      title="Responsive"
      hint={`${cols} columns · ${Math.round(previewW)}px — drag the right edge to resize`}
      stageMinHeight={260}
      code={EXAMPLE_CODE.responsive}
    >
      <div style={ROW}>
        {showSmall && (
          <Pill active={active === "small"} onClick={() => setRequested(300)}>
            Small
          </Pill>
        )}
        {showMedium && (
          <Pill active={active === "medium"} onClick={() => setRequested(420)}>
            Medium
          </Pill>
        )}
        <Pill active={active === "large"} onClick={() => setRequested(Number.POSITIVE_INFINITY)}>
          Large
        </Pill>
      </div>
      <div ref={containerRef}>
        <div className="dg-resize" style={{ width: previewW }}>
          <HeadlessGrid
            layout={layout}
            width={previewW}
            onLayoutChange={onLayoutChange}
            // Unlike the other demos, this grid sits in a padding-less framed box
            // (.dg-resize), so it keeps inner containerPadding to keep tiles off
            // the frame border. The pills align to the box edge as the anchor.
            options={{
              gridConfig: { cols, rowHeight: 48, margin: [10, 10], containerPadding: [10, 10] },
            }}
            renderContent={(it) => <Tile label={it.i.toUpperCase()} />}
          />
          <div
            className="dg-resize__handle"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            title="Drag to resize"
            aria-hidden="true"
          />
        </div>
      </div>
    </DemoFrame>
  );
}

/* ── Cross-grid dragging ────────────────────────────────────────────────── */
const LEFT: Layout = [
  { i: "L1", x: 0, y: 0, w: 3, h: 2 },
  { i: "L2", x: 3, y: 0, w: 3, h: 1 },
  { i: "L3", x: 0, y: 2, w: 4, h: 1 },
];
const RIGHT: Layout = [
  { i: "R1", x: 0, y: 0, w: 3, h: 1 },
  { i: "R2", x: 3, y: 0, w: 3, h: 2 },
];
const CROSS = {
  cols: 6,
  rowHeight: 48,
  margin: [8, 8] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

export function CrossGridDemo() {
  const [left, setLeft] = useState<Layout>(LEFT);
  const [right, setRight] = useState<Layout>(RIGHT);
  return (
    <DemoFrame
      title="Cross-grid dragging"
      hint="drag a tile between the two grids"
      stageMinHeight={240}
      code={EXAMPLE_CODE.crossGrid}
    >
      {/* SnapGridGroup supplies one shared DragDropProvider so tiles cross between
          the two grids. Each grid is a useGridContainer host; the dragged tile
          floats itself across both grids. */}
      <SnapGridGroup>
        <div className="dg-gridrow">
          <CrossSubGrid label="Grid A" layout={left} onLayoutChange={setLeft} />
          <CrossSubGrid label="Grid B" layout={right} onLayoutChange={setRight} />
        </div>
      </SnapGridGroup>
    </DemoFrame>
  );
}

// Each grid lives in its own bordered card so the two are visibly distinct. The
// width is measured from an inner div (no padding/border) so the grid surface
// fits exactly and can't overflow the card. No DragDropProvider here — the
// enclosing SnapGridGroup provides the shared one.
function CrossSubGrid({
  label,
  layout,
  onLayoutChange,
}: {
  label: string;
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth({ initialWidth: 371 });
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange,
    gridConfig: CROSS,
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div className="dg-subgrid">
      <span className="dg-subgrid__label">{label}</span>
      <div ref={containerRef}>
        <div {...containerProps} className="dg-grid">
          {layout.map((it) => (
            <GridTile key={it.i} id={it.i} group={group}>
              {tileContent(it)}
            </GridTile>
          ))}
          <Placeholder placeholder={placeholder} />
        </div>
      </div>
    </div>
  );
}

/* ── External drop ──────────────────────────────────────────────────────── */
const PALETTE_CLONE = [Feedback.configure({ feedback: "clone" })];

// One source for the palette: drives both the rendered chips and the overlay's
// chip preview (looked up by id).
const PALETTE = [
  { id: "pal-sm", label: "small", w: 2, h: 1 },
  { id: "pal-wide", label: "wide", w: 4, h: 1 },
  { id: "pal-tall", label: "tall", w: 2, h: 3 },
];
const PALETTE_BY_ID = new Map(PALETTE.map((c) => [c.id, c]));

function chipBody({ label, w, h }: { label: string; w: number; h: number }) {
  return (
    <>
      {label}
      <small>
        {w}×{h}
      </small>
    </>
  );
}

function PaletteChip({ id, label, w, h }: { id: string; label: string; w: number; h: number }) {
  const { ref } = useDraggable({ id, data: { snapGridDrop: { w, h } }, plugins: PALETTE_CLONE });
  return (
    <div ref={ref} className="dg-chip">
      {chipBody({ label, w, h })}
    </div>
  );
}

export function ExternalDropDemo() {
  const [layout, setLayout] = useState<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);
  return (
    <DemoFrame
      title="External drop"
      hint="drag a chip from the palette into the grid"
      stageMinHeight={240}
      code={EXAMPLE_CODE.externalDrop}
    >
      {/* SnapGridGroup gives the palette draggables and the grid one shared
          provider, so a chip can be dropped into the grid. */}
      <SnapGridGroup>
        <div className="dg-gridrow">
          <div className="dg-subgrid dg-subgrid--auto">
            <span className="dg-subgrid__label">Palette</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {PALETTE.map((c) => (
                <PaletteChip key={c.id} {...c} />
              ))}
            </div>
          </div>
          <DropTargetGrid layout={layout} onLayoutChange={setLayout} />
        </div>
      </SnapGridGroup>
    </DemoFrame>
  );
}

function DropTargetGrid({
  layout,
  onLayoutChange,
}: {
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth({ initialWidth: 684 });
  const dropCount = useRef(0);
  const { containerProps, group } = useGridContainer({
    layout,
    width: Math.max(180, width),
    onLayoutChange,
    onDrop: (next, item) => {
      // The library mints a collision-safe but ugly id (`<gridId>-dropped-N`);
      // relabel the dropped tile with a short one.
      dropCount.current += 1;
      const shortId = `t${dropCount.current}`;
      onLayoutChange(next.map((it) => (it.i === item.i ? { ...it, i: shortId } : it)));
    },
    dropConfig: { enabled: true, defaultItem: { w: 2, h: 2 } },
    gridConfig: { cols: 8, rowHeight: 44, margin: [8, 8], containerPadding: [0, 0] },
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div className="dg-subgrid">
      <span className="dg-subgrid__label">Grid (drop here)</span>
      <div ref={containerRef}>
        <div {...containerProps} className="dg-grid">
          {layout.map((it) => (
            <GridTile key={it.i} id={it.i} group={group}>
              {tileContent(it)}
            </GridTile>
          ))}
          <Placeholder placeholder={placeholder} />
        </div>
      </div>
    </div>
  );
}

/* ── Component layer (turnkey <GridLayout>) ─────────────────────────────── */
// The rest of the examples are headless (hooks + your own markup); this one
// shows the turnkey layer. <GridLayout> mints its own DragDropProvider and
// renders the tiles, resize handles, and placeholder — no dnd-kit wiring.
// Children are keyed by their layout item's `i`.
export function ComponentLayerDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(BASIC.slice(0, 4));
  return (
    <DemoFrame
      title="Component layer"
      hint="the turnkey <GridLayout> — no hooks, no dnd-kit wiring"
      code={EXAMPLE_CODE.componentLayer}
    >
      <div ref={containerRef} className="dg-cl">
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          resizeConfig={{ handles: ["se"] }}
        >
          {layout.map((it) => (
            <Tile key={it.i} label={it.i.toUpperCase()} meta={`${it.w}×${it.h}`} />
          ))}
        </GridLayout>
      </div>
    </DemoFrame>
  );
}

/* ── Hero grid (home page) ──────────────────────────────────────────────── */
const HERO: Layout = [
  { i: "drag", x: 0, y: 0, w: 4, h: 2 },
  { i: "resize", x: 4, y: 0, w: 4, h: 2 },
  { i: "repack", x: 8, y: 0, w: 4, h: 2 },
  { i: "responsive", x: 0, y: 2, w: 6, h: 2 },
  { i: "cross-grid", x: 6, y: 2, w: 6, h: 2 },
];

// Accent every other tile, by starting position — a Set keyed by id so the
// content renderer (which gets the item, not its index) can look it up.
const HERO_ACCENT = new Set(HERO.filter((_, idx) => idx % 2 === 1).map((it) => it.i));

export function HeroGrid() {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 563 });
  const [layout, setLayout] = useState<Layout>(HERO);
  return (
    // Outer card carries the padding/border/dotted background; the INNER div is
    // what useContainerWidth measures (no padding/border), so the grid surface is
    // sized to the real available width and can't overflow the card and feed back
    // into an ever-growing measurement.
    <div className="dg-hero-grid">
      <div ref={containerRef}>
        {mounted ? (
          <HeadlessGrid
            layout={layout}
            width={width}
            onLayoutChange={setLayout}
            options={{
              gridConfig: { cols: 12, rowHeight: 56, margin: [12, 12] },
              resizeConfig: { handles: ["se"] },
            }}
            renderContent={(it) => <Tile label={it.i} accent={HERO_ACCENT.has(it.i)} />}
          />
        ) : (
          // Render only once measured, so the grid appears at its real width
          // instead of reflowing from initialWidth. A skeleton ghosts the layout
          // meanwhile; the padding mirrors the grid's containerPadding (12) so the
          // tiles land in the same spots and the height matches — no shift.
          <div style={{ padding: 12 }}>
            <GridSkeleton items={HERO} cols={12} gap={12} rowHeight={56} radius={9} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Nested grids (a grid inside an outer tile) ─────────────────────────── */
const NESTED_OUTER: Layout = [
  { i: "panel", x: 0, y: 0, w: 7, h: 4 },
  { i: "a", x: 7, y: 0, w: 5, h: 2 },
  { i: "b", x: 7, y: 2, w: 5, h: 2 },
];
const NESTED_INNER: Layout = [
  { i: "1", x: 0, y: 0, w: 1, h: 1 },
  { i: "2", x: 1, y: 0, w: 1, h: 1 },
  { i: "3", x: 2, y: 0, w: 1, h: 1 },
  { i: "4", x: 0, y: 1, w: 2, h: 1 },
];
const NESTED_INNER_GRID = {
  cols: 4,
  rowHeight: 36,
  margin: [6, 6] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

export function NestedDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: STAGE_WIDTH });
  const [layout, setLayout] = useState<Layout>(NESTED_OUTER);
  // Inner-grid state is lifted here so BOTH the live panel tile and its drag
  // overlay read the same current layout — otherwise the overlay would mount a
  // fresh inner grid stuck at its initial arrangement.
  const [inner, setInner] = useState<Layout>(NESTED_INNER);
  // The panel chrome, shared by the in-grid tile and the overlay clone. The
  // overlay gets a STATIC preview of the inner board (no second provider/grid),
  // so it shows the inner tiles where they actually are right now.
  const panel = (body: ReactNode) => (
    <div className="dg-nest">
      <div className="dg-nest__head">
        <span className="dg-grip">⠿</span> Nested board
      </div>
      <div className="dg-nest__body">{body}</div>
    </div>
  );
  return (
    <DemoFrame
      title="Nested grids"
      hint="drag the panel by its header; drag the inner tiles freely"
      code={EXAMPLE_CODE.nested}
    >
      <div ref={containerRef}>
        <HeadlessGrid
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          options={{
            gridConfig: GRID,
            // The outer tile drags only from its header, which sits OUTSIDE the
            // inner grid — so a pointer-down on an inner tile never arms the outer.
            dragConfig: { handle: ".dg-nest__head" },
            isResizable: false,
          }}
          renderContent={(it) =>
            it.i === "panel" ? (
              panel(<NestedInner layout={inner} onLayoutChange={setInner} />)
            ) : (
              <Tile label={it.i.toUpperCase()} accent={it.i === "b"} />
            )
          }
        />
      </div>
    </DemoFrame>
  );
}

/** The inner grid — its own standalone provider (HeadlessGrid supplies one), so
 * its drags stay isolated from the outer grid. Controlled by NestedDemo so the
 * overlay preview can mirror its current layout. */
function NestedInner({
  layout,
  onLayoutChange,
}: {
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth({ initialWidth: 440 });
  return (
    <div ref={containerRef}>
      <HeadlessGrid
        layout={layout}
        width={width}
        onLayoutChange={onLayoutChange}
        options={{ gridConfig: NESTED_INNER_GRID, isResizable: false }}
        renderContent={(it) => <div className="dg-nest__tile">{it.i}</div>}
      />
    </div>
  );
}
