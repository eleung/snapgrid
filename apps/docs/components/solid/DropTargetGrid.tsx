/** @jsxImportSource solid-js */
import { type Layout, type LayoutItem, useContainerWidth } from "@snapgridjs/solid";
import { HeadlessGridHost } from "./HeadlessGrid";
import { EXTERNAL_GRID } from "./demo-config";

// The drop target: a headless grid with dropConfig enabled. The engine synthesizes the
// dropped item; onDrop relabels its ugly minted id (`<gridId>-dropped-N`) to a short one.
// No own provider — the enclosing SnapGridGroup shares it with the palette, and this
// component renders inside it so the host resolves that manager.
export function DropTargetGrid(props: {
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}) {
  const { width, ref } = useContainerWidth({ initialWidth: 684 });

  let dropCount = 0;
  const onDrop = (next: Layout, item: LayoutItem) => {
    dropCount += 1;
    const shortId = `t${dropCount}`;
    props.onLayoutChange(next.map((it) => (it.i === item.i ? { ...it, i: shortId } : it)));
  };

  const options = {
    gridConfig: EXTERNAL_GRID,
    dropConfig: { enabled: true, defaultItem: { w: 2, h: 2 } },
    onDrop,
  };

  return (
    <div class="dg-subgrid">
      <span class="dg-subgrid__label">Grid (drop here)</span>
      <div ref={ref}>
        <HeadlessGridHost
          layout={props.layout}
          width={Math.max(180, width())}
          onLayoutChange={props.onLayoutChange}
          options={options}
        />
      </div>
    </div>
  );
}
