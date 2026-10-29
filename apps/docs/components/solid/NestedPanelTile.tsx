/** @jsxImportSource solid-js */
import { type Layout, useContainerWidth, useGridItem } from "@snapgridjs/solid";
import { HeadlessGridHost } from "./HeadlessGrid";
import { NESTED_INNER_GRID } from "./demo-config";

// The outer "panel" tile, holding the inner grid. `handleRef` makes the panel drag only
// from its header — so grabbing an inner tile never drags the whole panel. The inner grid
// uses HeadlessGridHost (not HeadlessGrid) so it shares the outer grid's provider/manager
// — tiles can be dragged between the inner and outer grids; innermost-grid collision
// keeps an inner drag scoped to it. Mirrors React/Svelte/Vue.
export function NestedPanelTile(props: {
  id: string;
  group: string;
  inner: Layout;
  onInnerChange: (layout: Layout) => void;
}) {
  const tile = useGridItem({ id: props.id, group: props.group });
  const innerWidth = useContainerWidth({ initialWidth: 440 });

  return (
    <div ref={tile.ref} style={tile.style()} class="dg-cell">
      <div class="dg-nest">
        <div ref={tile.handleRef} class="dg-nest__head">
          <span class="dg-grip">⠿</span> Nested board
        </div>
        <div class="dg-nest__body">
          <div ref={innerWidth.ref}>
            <HeadlessGridHost
              layout={props.inner}
              width={innerWidth.width()}
              onLayoutChange={props.onInnerChange}
              options={{ gridConfig: NESTED_INNER_GRID, isResizable: false }}
              content={(item) => <div class="dg-nest__tile">{item().i}</div>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
