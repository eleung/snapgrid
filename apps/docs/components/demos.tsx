"use client";

import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, DragOverlay, useDraggable } from "@dnd-kit/react";
import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
import {
  type Compactor,
  GridLayout,
  type Layout,
  ResponsiveGridLayout,
  type ResponsiveLayouts,
  SnapGridGroup,
  horizontalCompactor,
  noCompactor,
  useContainerWidth,
  useGridContainer,
  useGridItem,
  useGridPlaceholder,
  verticalCompactor,
} from "@snapgridjs/react";
import { Heart } from "lucide-react";
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { DemoFrame, Pill, ROW, Tile } from "./DemoFrame";
import { EXAMPLE_CODE } from "./generated/example-code";

// containerPadding [0,0] so the first tile sits flush at the surface edge —
// aligning with the controls/labels that sit at that same edge. Outer breathing
// room comes from the stage/card padding, not the grid's own padding.
const GRID = {
  cols: 12,
  rowHeight: 52,
  margin: [10, 10] as [number, number],
  containerPadding: [0, 0] as [number, number],
};

function tiles(layout: Layout, accentId?: string) {
  return layout.map((it) => (
    <Tile
      key={it.i}
      label={it.i.toUpperCase()}
      meta={`${it.w}×${it.h}`}
      accent={it.i === accentId}
      isStatic={it.static}
    />
  ));
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
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(BASIC);
  return (
    <DemoFrame
      title="Drag & resize"
      hint="drag a tile · resize from the corner"
      code={EXAMPLE_CODE.basic}
    >
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          resizeConfig={{ handles: ["se", "e", "s"] }}
        >
          {tiles(layout)}
        </GridLayout>
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
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
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
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          compactor={PACKERS[packer]}
        >
          {tiles(layout)}
        </GridLayout>
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
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(RESIZE);
  return (
    <DemoFrame
      title="Resize constraints"
      hint="every edge & corner · min/max enforced"
      code={EXAMPLE_CODE.resize}
    >
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          resizeConfig={{ handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] }}
        >
          {layout.map((it) => (
            <Tile key={it.i} label={it.i} meta={`${it.w}×${it.h}`} />
          ))}
        </GridLayout>
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
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(HANDLE);
  const [likes, setLikes] = useState<Record<string, number>>({});
  return (
    <DemoFrame
      title="Drag handle"
      hint="only the ⠿ grip starts a drag — the button stays clickable"
      code={EXAMPLE_CODE.dragHandle}
    >
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          dragConfig={{ handle: ".dg-grip" }}
          isResizable={false}
        >
          {layout.map((it) => {
            const n = likes[it.i] ?? 0;
            return (
              <div key={it.i} className="dg-tile dg-tile--barred">
                <span className="dg-grip dg-grip--bar">⠿ {it.i.toUpperCase()}</span>
                <button
                  type="button"
                  className="dg-likebtn"
                  data-liked={n > 0 || undefined}
                  onClick={() => setLikes((l) => ({ ...l, [it.i]: (l[it.i] ?? 0) + 1 }))}
                >
                  <Heart size={13} fill={n > 0 ? "currentColor" : "none"} />
                  {n > 0 ? n : "Like"}
                </button>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </DemoFrame>
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
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(STATIC);
  return (
    <DemoFrame
      title="Static items"
      hint="the hatched tile is pinned — others flow around it"
      code={EXAMPLE_CODE.static}
    >
      <div ref={containerRef}>
        <GridLayout layout={layout} width={width} onLayoutChange={setLayout} gridConfig={GRID}>
          {tiles(layout, undefined)}
        </GridLayout>
      </div>
    </DemoFrame>
  );
}

/* ── Snap-to-grid ───────────────────────────────────────────────────────── */
export function SnapDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
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
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          dragConfig={{ snapToGrid: snap }}
        >
          {tiles(layout)}
        </GridLayout>
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
const RESP_IDS = ["r1", "r2", "r3", "r4", "r5"];
const RESP_MIN = 240;

export function ResponsiveDemo() {
  // Measure the available stage width; the preview never exceeds it (no clipping).
  const { width: avail, containerRef } = useContainerWidth({ initialWidth: 560 });
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(RESP);
  // Infinity = "as wide as the stage allows" (clamped to `max` below), so the demo
  // opens truly Large/full-width instead of a fixed 520px that looks small in a
  // wider stage. Dragging or Small/Medium replaces it with a concrete width.
  const [requested, setRequested] = useState(Number.POSITIVE_INFINITY);
  const [info, setInfo] = useState({ breakpoint: "full", cols: 12 });
  const drag = useRef<{ x: number; w: number } | null>(null);

  const max = Math.max(RESP_MIN, Math.round(avail));
  const previewW = Math.min(Math.max(requested, RESP_MIN), max);

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
      hint={`${info.cols} columns · ${Math.round(previewW)}px — drag the right edge to resize`}
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
          <ResponsiveGridLayout
            width={previewW}
            layouts={layouts}
            breakpoints={RESP_BREAKPOINTS}
            cols={RESP_COLS}
            onLayoutChange={(_l, all) => setLayouts(all)}
            onBreakpointChange={(breakpoint, cols) => setInfo({ breakpoint, cols })}
            rowHeight={48}
            margin={[10, 10]}
            // Unlike the other demos, this grid sits in a padding-less framed box
            // (.dg-resize), so it keeps inner containerPadding to keep tiles off
            // the frame border. The pills align to the box edge as the anchor.
            containerPadding={[10, 10]}
          >
            {RESP_IDS.map((id) => (
              <Tile key={id} label={id.toUpperCase()} />
            ))}
          </ResponsiveGridLayout>
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
// fits exactly and can't overflow the card.
function CrossSubGrid({
  label,
  layout,
  onLayoutChange,
}: {
  label: string;
  layout: Layout;
  onLayoutChange: (next: Layout) => void;
}) {
  const { width, containerRef } = useContainerWidth({ initialWidth: 280 });
  return (
    <div className="dg-subgrid">
      <span className="dg-subgrid__label">{label}</span>
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={onLayoutChange}
          gridConfig={CROSS}
        >
          {tiles(layout)}
        </GridLayout>
      </div>
    </div>
  );
}

/* ── External drop ──────────────────────────────────────────────────────── */
const PALETTE_CLONE = [Feedback.configure({ feedback: "clone" })];

function PaletteChip({ id, label, w, h }: { id: string; label: string; w: number; h: number }) {
  const { ref } = useDraggable({ id, data: { snapGridDrop: { w, h } }, plugins: PALETTE_CLONE });
  return (
    <div ref={ref} className="dg-chip">
      {label}
      <small>
        {w}×{h}
      </small>
    </div>
  );
}

export function ExternalDropDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 480 });
  const [layout, setLayout] = useState<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);
  const dropCount = useRef(0);
  return (
    <DemoFrame
      title="External drop"
      hint="drag a chip from the palette into the grid"
      stageMinHeight={240}
      code={EXAMPLE_CODE.externalDrop}
    >
      <SnapGridGroup>
        <div className="dg-gridrow">
          <div className="dg-subgrid dg-subgrid--auto">
            <span className="dg-subgrid__label">Palette</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <PaletteChip id="pal-sm" label="small" w={2} h={1} />
              <PaletteChip id="pal-wide" label="wide" w={4} h={1} />
              <PaletteChip id="pal-tall" label="tall" w={2} h={3} />
            </div>
          </div>
          <div className="dg-subgrid">
            <span className="dg-subgrid__label">Grid (drop here)</span>
            <div ref={containerRef}>
              <GridLayout
                layout={layout}
                width={Math.max(180, width)}
                onLayoutChange={setLayout}
                onDrop={(next, item) => {
                  // The library mints a collision-safe but ugly id
                  // (`<gridId>-dropped-N`); relabel the dropped tile with a short one.
                  dropCount.current += 1;
                  const shortId = `t${dropCount.current}`;
                  setLayout(next.map((it) => (it.i === item.i ? { ...it, i: shortId } : it)));
                }}
                dropConfig={{ enabled: true, defaultItem: { w: 2, h: 2 } }}
                gridConfig={{ cols: 8, rowHeight: 44, margin: [8, 8], containerPadding: [0, 0] }}
              >
                {tiles(layout)}
              </GridLayout>
            </div>
          </div>
        </div>
      </SnapGridGroup>
    </DemoFrame>
  );
}

/* ── Headless (hooks + custom markup) ───────────────────────────────────── */
export function HeadlessDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(BASIC.slice(0, 4));
  return (
    <DemoFrame title="Headless" hint="your own markup via the hooks" code={EXAMPLE_CODE.headless}>
      <div ref={containerRef}>
        <DragDropProvider>
          <HeadlessSurface items={layout} width={width} onLayoutChange={setLayout} />
        </DragDropProvider>
      </div>
    </DemoFrame>
  );
}

function HeadlessSurface({
  items,
  width,
  onLayoutChange,
}: { items: Layout; width: number; onLayoutChange: (l: Layout) => void }) {
  const { containerProps, group } = useGridContainer({
    layout: items,
    width,
    onLayoutChange,
    gridConfig: GRID,
    dragConfig: { handle: ".dg-grip" },
  });
  const placeholder = useGridPlaceholder(group);
  return (
    <div {...containerProps}>
      {items.map((it) => (
        <HeadlessTile key={it.i} id={it.i} group={group} />
      ))}
      {placeholder ? (
        <div
          style={{
            ...placeholder.style,
            border: "1px dashed var(--dg-accent)",
            borderRadius: 9,
            background: "var(--dg-accent-soft)",
          }}
        />
      ) : null}
      <DragOverlay>
        {(source) =>
          source ? (
            <div className="dg-tile dg-tile--accent" style={{ width: "100%", height: "100%" }}>
              <span className="dg-grip">⠿ {String(source.id).toUpperCase()}</span>
            </div>
          ) : null
        }
      </DragOverlay>
    </div>
  );
}

function HeadlessTile({ id, group }: { id: string; group: string }) {
  const { ref, style, isDragging } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className={`dg-tile${isDragging ? " dg-tile--accent" : ""}`}>
      <span className="dg-grip" style={{ cursor: "grab" }}>
        ⠿ {id.toUpperCase()}
      </span>
    </div>
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

export function HeroGrid() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 760 });
  const [layout, setLayout] = useState<Layout>(HERO);
  return (
    // Outer card carries the padding/border/dotted background; the INNER div is
    // what useContainerWidth measures (no padding/border), so the grid surface is
    // sized to the real available width and can't overflow the card and feed back
    // into an ever-growing measurement.
    <div className="dg-hero-grid">
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={{ cols: 12, rowHeight: 56, margin: [12, 12] }}
          resizeConfig={{ handles: ["se"] }}
        >
          {layout.map((it, idx) => (
            <Tile key={it.i} label={it.i} accent={idx % 2 === 1} />
          ))}
        </GridLayout>
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

export function NestedDemo() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 680 });
  const [layout, setLayout] = useState<Layout>(NESTED_OUTER);
  return (
    <DemoFrame
      title="Nested grids"
      hint="drag the panel by its header; drag the inner tiles freely"
      code={EXAMPLE_CODE.nested}
    >
      <div ref={containerRef}>
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={setLayout}
          gridConfig={GRID}
          // The outer tile drags only from its header, which sits OUTSIDE the
          // inner grid — so a pointer-down on an inner tile never arms the outer.
          dragConfig={{ handle: ".dg-nest__head" }}
          isResizable={false}
        >
          {layout.map((it) =>
            it.i === "panel" ? (
              <div key={it.i} className="dg-nest">
                <div className="dg-nest__head">
                  <span className="dg-grip">⠿</span> Nested board
                </div>
                <div className="dg-nest__body">
                  <NestedInner />
                </div>
              </div>
            ) : (
              <Tile key={it.i} label={it.i.toUpperCase()} accent={it.i === "b"} />
            ),
          )}
        </GridLayout>
      </div>
    </DemoFrame>
  );
}

/** The inner grid — its own standalone provider, so its drags stay isolated. */
function NestedInner() {
  const { width, containerRef } = useContainerWidth({ initialWidth: 280 });
  const [layout, setLayout] = useState<Layout>(NESTED_INNER);
  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout}
        width={width}
        onLayoutChange={setLayout}
        gridConfig={{ cols: 4, rowHeight: 36, margin: [6, 6], containerPadding: [0, 0] }}
        isResizable={false}
      >
        {layout.map((it) => (
          <div key={it.i} className="dg-nest__tile">
            {it.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
