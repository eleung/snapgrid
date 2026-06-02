"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  GridDragOverlay,
  type Layout,
  useContainerWidth,
  useGridContainer,
  useGridItem,
} from "@snapgridjs/react";
import { useState } from "react";

// The "404" is a snapgrid: the digits drag; the nav tiles are `static` (pinned),
// so they read as buttons and the digits flow around them.
const SITE = "https://snapgrid.dev";

type Cell = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
  label: string;
  accent?: boolean;
  href?: string;
  primary?: boolean;
};

const CELLS: Cell[] = [
  { i: "4a", x: 0, y: 0, w: 3, h: 3, label: "4" },
  { i: "0", x: 3, y: 0, w: 3, h: 3, label: "0", accent: true },
  { i: "4b", x: 6, y: 0, w: 3, h: 3, label: "4" },
  {
    i: "home",
    x: 9,
    y: 0,
    w: 3,
    h: 1,
    static: true,
    label: "Home",
    href: `${SITE}/`,
    primary: true,
  },
  {
    i: "docs",
    x: 9,
    y: 1,
    w: 3,
    h: 1,
    static: true,
    label: "Docs",
    href: `${SITE}/docs/getting-started`,
  },
  {
    i: "examples",
    x: 9,
    y: 2,
    w: 3,
    h: 1,
    static: true,
    label: "Examples",
    href: `${SITE}/examples`,
  },
];
const BY_ID = new Map(CELLS.map((c) => [c.i, c]));

export function NotFoundExample() {
  return (
    <DragDropProvider>
      <Board />
    </DragDropProvider>
  );
}

function Board() {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 560 });
  const [layout, setLayout] = useState<Layout>(CELLS);
  const { containerProps, group } = useGridContainer({
    layout,
    width,
    onLayoutChange: setLayout,
    gridConfig: { rowHeight: 52, containerPadding: [0, 0] },
    isResizable: false,
  });
  // Render only once measured, so the "404" doesn't reflow from full width on mount.
  return (
    <div ref={containerRef}>
      {mounted && (
        <>
          <div {...containerProps}>
            {layout.map((it) => (
              <Tile key={it.i} id={it.i} group={group} />
            ))}
          </div>
          <GridDragOverlay className="snapgrid-overlay">
            {({ item }) => {
              const cell = item && BY_ID.get(item.i);
              return cell ? (
                <div className={cell.accent ? "cell cell--accent" : "cell"}>{cell.label}</div>
              ) : null;
            }}
          </GridDragOverlay>
        </>
      )}
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem(id, group);
  const cell = BY_ID.get(id);
  if (cell?.href) {
    return (
      <a
        ref={ref}
        style={style}
        href={cell.href}
        className={cell.primary ? "btn btn--primary" : "btn"}
      >
        {cell.label}
      </a>
    );
  }
  return (
    <div ref={ref} style={style} className={cell?.accent ? "cell cell--accent" : "cell"}>
      {cell?.label}
    </div>
  );
}
