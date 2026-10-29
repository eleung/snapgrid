/** @jsxImportSource solid-js */
import { type Layout, useContainerWidth } from "@snapgridjs/solid";
import { HeadlessGridHost } from "./HeadlessGrid";
import { CROSS } from "./demo-config";

// One grid of the cross-grid pair, in its own bordered card so the two are visibly
// distinct. Width is measured from an inner div (no padding/border) so the surface fits
// exactly. No DragDropProvider here — the enclosing SnapGridGroup provides the shared one
// (and this component renders inside it, so the host's hooks resolve its manager),
// letting tiles cross between the two grids. Mirrors React/Svelte/Vue `CrossSubGrid`.
export function CrossSubGrid(props: {
  label: string;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}) {
  const { width, ref } = useContainerWidth({ initialWidth: 371 });

  return (
    <div class="dg-subgrid">
      <span class="dg-subgrid__label">{props.label}</span>
      <div ref={ref}>
        <HeadlessGridHost
          layout={props.layout}
          width={width()}
          onLayoutChange={props.onLayoutChange}
          options={{ gridConfig: CROSS }}
        />
      </div>
    </div>
  );
}
