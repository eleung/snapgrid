"use client";

// React wrappers that mount each native @snapgridjs/vue demo as a client-side island
// (see VueDemo), inside the shared DemoFrame chrome so the /vue gallery matches /react
// and /svelte: titled card, dotted stage, and a Preview/Code toggle showing the real
// `.vue` source. The MDX pages import these with the SAME names as the React demos
// (@/components/demos), so the galleries stay parallel. StackBlitz is off here — that
// sandbox builder emits a React project.
import { DemoFrame } from "./DemoFrame";
import { VueDemo } from "./VueDemo";
import { VUE_EXAMPLE_CODE } from "./generated/vue-example-code";
import BasicGrid from "./vue/BasicGrid.vue";
import CompactorGrid from "./vue/CompactorGrid.vue";
import ComponentLayerGrid from "./vue/ComponentLayerGrid.vue";
import CrossGrid from "./vue/CrossGrid.vue";
import DragHandleGrid from "./vue/DragHandleGrid.vue";
import ExternalDropGrid from "./vue/ExternalDropGrid.vue";
import NestedDropZone from "./vue/NestedDropZone.vue";
import NestedGrid from "./vue/NestedGrid.vue";
import ResizeGrid from "./vue/ResizeGrid.vue";
import ResponsiveGrid from "./vue/ResponsiveGrid.vue";
import SnapGrid from "./vue/SnapGrid.vue";
import SortableGrid from "./vue/SortableGrid.vue";
import StaticItemGrid from "./vue/StaticItemGrid.vue";
import VueHeroGrid from "./vue/VueHeroGrid.vue";

/** The home-page hero grid, mounted as a Vue island (no DemoFrame — it sits in the hero
 *  section like the React `HeroGrid`). Rendered when Vue is the active framework. */
export const VueHeroDemo = () => <VueDemo component={VueHeroGrid} />;

export const BasicGridDemo = () => (
  <DemoFrame
    title="Drag & resize"
    hint="drag a tile · resize from the corner"
    code={VUE_EXAMPLE_CODE.basic}
    stackblitz={false}
  >
    <VueDemo component={BasicGrid} />
  </DemoFrame>
);

export const CompactorDemo = () => (
  <DemoFrame
    title="Compaction"
    hint="swap the packing algorithm, then drag"
    code={VUE_EXAMPLE_CODE.compaction}
    stackblitz={false}
  >
    <VueDemo component={CompactorGrid} />
  </DemoFrame>
);

export const ResizeDemo = () => (
  <DemoFrame
    title="Resize constraints"
    hint="drag the corner · min/max enforced"
    code={VUE_EXAMPLE_CODE.resize}
    stackblitz={false}
  >
    <VueDemo component={ResizeGrid} />
  </DemoFrame>
);

export const DragHandleDemo = () => (
  <DemoFrame
    title="Drag handle"
    hint="only the ⠿ grip starts a drag — the button stays clickable"
    code={VUE_EXAMPLE_CODE.dragHandle}
    stackblitz={false}
  >
    <VueDemo component={DragHandleGrid} />
  </DemoFrame>
);

export const SnapDemo = () => (
  <DemoFrame
    title="Snap to grid"
    hint="toggle whether the dragged tile snaps or glides"
    code={VUE_EXAMPLE_CODE.snap}
    stackblitz={false}
  >
    <VueDemo component={SnapGrid} />
  </DemoFrame>
);

export const StaticItemDemo = () => (
  <DemoFrame
    title="Static items"
    hint="toggle a tile between locked and pinned — others flow around it"
    code={VUE_EXAMPLE_CODE.static}
    stackblitz={false}
  >
    <VueDemo component={StaticItemGrid} />
  </DemoFrame>
);

export const ResponsiveDemo = () => (
  <DemoFrame
    title="Responsive"
    hint="drag the right edge — columns change at breakpoints"
    stageMinHeight={260}
    code={VUE_EXAMPLE_CODE.responsive}
    stackblitz={false}
  >
    <VueDemo component={ResponsiveGrid} />
  </DemoFrame>
);

export const CrossGridDemo = () => (
  <DemoFrame
    title="Cross-grid dragging"
    hint="drag a tile between the two grids"
    stageMinHeight={240}
    code={VUE_EXAMPLE_CODE.crossGrid}
    stackblitz={false}
  >
    <VueDemo component={CrossGrid} />
  </DemoFrame>
);

export const NestedDemo = () => (
  <DemoFrame
    title="Nested grids"
    hint="drag the panel by its header; drag tiles between the inner and outer grids"
    code={VUE_EXAMPLE_CODE.nested}
    stackblitz={false}
  >
    <VueDemo component={NestedGrid} />
  </DemoFrame>
);

export const NestedDropZoneDemo = () => (
  <DemoFrame
    title="Drop zone inside a grid"
    hint="drag a tile onto the Archive panel — the nested drop zone wins over the grid"
  >
    <VueDemo component={NestedDropZone} />
  </DemoFrame>
);

export const ExternalDropDemo = () => (
  <DemoFrame
    title="External drop"
    hint="drag a chip from the palette into the grid"
    stageMinHeight={240}
    code={VUE_EXAMPLE_CODE.externalDrop}
    stackblitz={false}
  >
    <VueDemo component={ExternalDropGrid} />
  </DemoFrame>
);

export const SortableGridDemo = () => (
  <DemoFrame
    title="Sortable ↔ grid"
    hint="drag a widget into the grid · drag a tile out to the tray · reorder the tray"
    code={VUE_EXAMPLE_CODE.sortableGrid}
    stackblitz={false}
  >
    <VueDemo component={SortableGrid} />
  </DemoFrame>
);

export const ComponentLayerDemo = () => (
  <DemoFrame
    title="Component layer"
    hint="the turnkey <GridLayout> — no composables, no dnd-kit wiring"
    code={VUE_EXAMPLE_CODE.componentLayer}
    stackblitz={false}
  >
    <VueDemo component={ComponentLayerGrid} />
  </DemoFrame>
);
