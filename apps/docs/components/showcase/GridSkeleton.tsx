// A faint, pulsing ghost of a lab's *actual* grid. Fed the lab's real layout +
// grid config, it reproduces the same columns, gaps, row height, and tile
// positions as the live GridLayout — so when the client-only grid mounts, the
// tiles land in the exact same spots (no layout shift). It just fills in.
//
// CSS grid maps 1:1 to the grid engine here: `gap` = the grid's margin,
// `grid-auto-rows` = rowHeight, and a tile spanning h rows is
// h*rowHeight + (h-1)*gap tall — identical to the engine's cell math.
export type SkelItem = { i: string; x: number; y: number; w: number; h: number };

export function GridSkeleton({
  items,
  cols,
  gap,
  rowHeight,
  circle = false,
  radius = 14,
}: {
  items: readonly SkelItem[];
  cols: number;
  gap: number;
  rowHeight: number;
  circle?: boolean;
  radius?: number;
}) {
  return (
    <div
      className="sg-skel"
      aria-hidden="true"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
        gap,
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.i}
          className="sg-skel__tile"
          style={{
            gridColumn: `${it.x + 1} / span ${it.w}`,
            gridRow: `${it.y + 1} / span ${it.h}`,
            borderRadius: circle ? "50%" : radius,
            animationDelay: `${(i % 6) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}
