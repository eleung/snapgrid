"use client";

// React wrappers that mount each native @snapgridjs/svelte demo as a client-side
// island (see SvelteDemo), inside the shared DemoFrame chrome so the /svelte
// gallery matches /react: titled card, dotted stage, and a Preview/Code toggle
// showing the real `.svelte` source. The MDX pages import these with the SAME
// names as the React demos (@/components/demos), so the two galleries stay
// parallel. StackBlitz is off here — that sandbox builder emits a React project.
import { DemoFrame } from "./DemoFrame";
import { SvelteDemo } from "./SvelteDemo";
import { SVELTE_EXAMPLE_CODE } from "./generated/svelte-example-code";
import BasicGrid from "./svelte/BasicGrid.svelte";
import CompactorGrid from "./svelte/CompactorGrid.svelte";
import ComponentLayerGrid from "./svelte/ComponentLayerGrid.svelte";
import CrossGrid from "./svelte/CrossGrid.svelte";
import DragHandleGrid from "./svelte/DragHandleGrid.svelte";
import ExternalDropGrid from "./svelte/ExternalDropGrid.svelte";
import NestedDropZone from "./svelte/NestedDropZone.svelte";
import NestedGrid from "./svelte/NestedGrid.svelte";
import ResizeGrid from "./svelte/ResizeGrid.svelte";
import ResponsiveGrid from "./svelte/ResponsiveGrid.svelte";
import SnapGrid from "./svelte/SnapGrid.svelte";
import SortableGrid from "./svelte/SortableGrid.svelte";
import StaticItemGrid from "./svelte/StaticItemGrid.svelte";
import SvelteHeroGrid from "./svelte/SvelteHeroGrid.svelte";

/** The home-page hero grid, mounted as a Svelte island (no DemoFrame — it sits in the
 *  hero section like the React `HeroGrid`). Rendered when Svelte is the active framework. */
export const SvelteHeroDemo = () => <SvelteDemo component={SvelteHeroGrid} />;

export const BasicGridDemo = () => (
  <DemoFrame
    title="Drag & resize"
    hint="drag a tile · resize from the corner"
    code={SVELTE_EXAMPLE_CODE.basic}
    stackblitz={false}
  >
    <SvelteDemo component={BasicGrid} />
  </DemoFrame>
);

export const CompactorDemo = () => (
  <DemoFrame
    title="Compaction"
    hint="swap the packing algorithm, then drag"
    code={SVELTE_EXAMPLE_CODE.compaction}
    stackblitz={false}
  >
    <SvelteDemo component={CompactorGrid} />
  </DemoFrame>
);

export const ResizeDemo = () => (
  <DemoFrame
    title="Resize constraints"
    hint="drag the corner · min/max enforced"
    code={SVELTE_EXAMPLE_CODE.resize}
    stackblitz={false}
  >
    <SvelteDemo component={ResizeGrid} />
  </DemoFrame>
);

export const DragHandleDemo = () => (
  <DemoFrame
    title="Drag handle"
    hint="only the ⠿ grip starts a drag — the button stays clickable"
    code={SVELTE_EXAMPLE_CODE.dragHandle}
    stackblitz={false}
  >
    <SvelteDemo component={DragHandleGrid} />
  </DemoFrame>
);

export const SnapDemo = () => (
  <DemoFrame
    title="Snap to grid"
    hint="toggle whether the dragged tile snaps or glides"
    code={SVELTE_EXAMPLE_CODE.snap}
    stackblitz={false}
  >
    <SvelteDemo component={SnapGrid} />
  </DemoFrame>
);

export const StaticItemDemo = () => (
  <DemoFrame
    title="Static items"
    hint="toggle a tile between locked and pinned — others flow around it"
    code={SVELTE_EXAMPLE_CODE.static}
    stackblitz={false}
  >
    <SvelteDemo component={StaticItemGrid} />
  </DemoFrame>
);

export const ResponsiveDemo = () => (
  <DemoFrame
    title="Responsive"
    hint="drag the right edge — columns change at breakpoints"
    stageMinHeight={260}
    code={SVELTE_EXAMPLE_CODE.responsive}
    stackblitz={false}
  >
    <SvelteDemo component={ResponsiveGrid} />
  </DemoFrame>
);

export const CrossGridDemo = () => (
  <DemoFrame
    title="Cross-grid dragging"
    hint="drag a tile between the two grids"
    stageMinHeight={240}
    code={SVELTE_EXAMPLE_CODE.crossGrid}
    stackblitz={false}
  >
    <SvelteDemo component={CrossGrid} />
  </DemoFrame>
);

export const NestedDemo = () => (
  <DemoFrame
    title="Nested grids"
    hint="drag the panel by its header; drag tiles between the inner and outer grids"
    code={SVELTE_EXAMPLE_CODE.nested}
    stackblitz={false}
  >
    <SvelteDemo component={NestedGrid} />
  </DemoFrame>
);

export const NestedDropZoneDemo = () => (
  <DemoFrame
    title="Drop zone inside a grid"
    hint="drag a tile onto the Archive panel — the nested drop zone wins over the grid"
  >
    <SvelteDemo component={NestedDropZone} />
  </DemoFrame>
);

export const ExternalDropDemo = () => (
  <DemoFrame
    title="External drop"
    hint="drag a chip from the palette into the grid"
    stageMinHeight={240}
    code={SVELTE_EXAMPLE_CODE.externalDrop}
    stackblitz={false}
  >
    <SvelteDemo component={ExternalDropGrid} />
  </DemoFrame>
);

export const SortableGridDemo = () => (
  <DemoFrame
    title="Sortable ↔ grid"
    hint="drag a widget into the grid · drag a tile out to the tray · reorder the tray"
    code={SVELTE_EXAMPLE_CODE.sortableGrid}
    stackblitz={false}
  >
    <SvelteDemo component={SortableGrid} />
  </DemoFrame>
);

export const ComponentLayerDemo = () => (
  <DemoFrame
    title="Component layer"
    hint="the turnkey <GridLayout> — no factories, no dnd-kit wiring"
    code={SVELTE_EXAMPLE_CODE.componentLayer}
    stackblitz={false}
  >
    <SvelteDemo component={ComponentLayerGrid} />
  </DemoFrame>
);
