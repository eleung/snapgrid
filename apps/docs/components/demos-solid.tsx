"use client";

// React wrappers that mount each native @snapgridjs/solid demo as a client-side island
// (see SolidDemo), inside the shared DemoFrame chrome so the /solid gallery matches the
// others: titled card, dotted stage, and a Preview/Code toggle showing the real `.tsx`
// source. The MDX pages import these with the SAME names as the React demos
// (@/components/demos), so the galleries stay parallel. StackBlitz is off here — that
// sandbox builder emits a React project.
//
// Demo modules are LOADED, never imported statically: Solid's compiled DOM output runs
// browser-only code at module load, so it must stay out of the static prerender. The
// loaders are module-level so their identity is stable across renders.
import { DemoFrame } from "./DemoFrame";
import { SolidDemo } from "./SolidDemo";
import { SOLID_EXAMPLE_CODE } from "./generated/solid-example-code";

/** The home-page hero grid, mounted as a Solid island (no DemoFrame — it sits in the hero
 *  section like the React `HeroGrid`). Rendered when Solid is the active framework. */
const loadHero = () => import("./solid/SolidHeroGrid");
export const SolidHeroDemo = () => <SolidDemo load={loadHero} />;

const loadBasicGrid = () => import("./solid/BasicGrid");
export const BasicGridDemo = () => (
  <DemoFrame
    title="Drag & resize"
    hint="drag a tile · resize from the corner"
    code={SOLID_EXAMPLE_CODE.basic}
    stackblitz={false}
  >
    <SolidDemo load={loadBasicGrid} />
  </DemoFrame>
);

const loadCompactorGrid = () => import("./solid/CompactorGrid");
export const CompactorDemo = () => (
  <DemoFrame
    title="Compaction"
    hint="swap the packing algorithm, then drag"
    code={SOLID_EXAMPLE_CODE.compaction}
    stackblitz={false}
  >
    <SolidDemo load={loadCompactorGrid} />
  </DemoFrame>
);

const loadResizeGrid = () => import("./solid/ResizeGrid");
export const ResizeDemo = () => (
  <DemoFrame
    title="Resize constraints"
    hint="drag the corner · min/max enforced"
    code={SOLID_EXAMPLE_CODE.resize}
    stackblitz={false}
  >
    <SolidDemo load={loadResizeGrid} />
  </DemoFrame>
);

const loadDragHandleGrid = () => import("./solid/DragHandleGrid");
export const DragHandleDemo = () => (
  <DemoFrame
    title="Drag handle"
    hint="only the ⠿ grip starts a drag — the button stays clickable"
    code={SOLID_EXAMPLE_CODE.dragHandle}
    stackblitz={false}
  >
    <SolidDemo load={loadDragHandleGrid} />
  </DemoFrame>
);

const loadSnapGrid = () => import("./solid/SnapGrid");
export const SnapDemo = () => (
  <DemoFrame
    title="Snap to grid"
    hint="toggle whether the dragged tile snaps or glides"
    code={SOLID_EXAMPLE_CODE.snap}
    stackblitz={false}
  >
    <SolidDemo load={loadSnapGrid} />
  </DemoFrame>
);

const loadStaticItemGrid = () => import("./solid/StaticItemGrid");
export const StaticItemDemo = () => (
  <DemoFrame
    title="Static items"
    hint="toggle a tile between locked and pinned — others flow around it"
    code={SOLID_EXAMPLE_CODE.static}
    stackblitz={false}
  >
    <SolidDemo load={loadStaticItemGrid} />
  </DemoFrame>
);

const loadResponsiveGrid = () => import("./solid/ResponsiveGrid");
export const ResponsiveDemo = () => (
  <DemoFrame
    title="Responsive"
    hint="drag the right edge — columns change at breakpoints"
    stageMinHeight={260}
    code={SOLID_EXAMPLE_CODE.responsive}
    stackblitz={false}
  >
    <SolidDemo load={loadResponsiveGrid} />
  </DemoFrame>
);

const loadCrossGrid = () => import("./solid/CrossGrid");
export const CrossGridDemo = () => (
  <DemoFrame
    title="Cross-grid dragging"
    hint="drag a tile between the two grids"
    stageMinHeight={240}
    code={SOLID_EXAMPLE_CODE.crossGrid}
    stackblitz={false}
  >
    <SolidDemo load={loadCrossGrid} />
  </DemoFrame>
);

const loadNestedGrid = () => import("./solid/NestedGrid");
export const NestedDemo = () => (
  <DemoFrame
    title="Nested grids"
    hint="drag the panel by its header; drag tiles between the inner and outer grids"
    code={SOLID_EXAMPLE_CODE.nested}
    stackblitz={false}
  >
    <SolidDemo load={loadNestedGrid} />
  </DemoFrame>
);

const loadNestedDropZone = () => import("./solid/NestedDropZone");
export const NestedDropZoneDemo = () => (
  <DemoFrame
    title="Drop zone inside a grid"
    hint="drag a tile onto the Archive panel — the nested drop zone wins over the grid"
  >
    <SolidDemo load={loadNestedDropZone} />
  </DemoFrame>
);

const loadExternalDropGrid = () => import("./solid/ExternalDropGrid");
export const ExternalDropDemo = () => (
  <DemoFrame
    title="External drop"
    hint="drag a chip from the palette into the grid"
    stageMinHeight={240}
    code={SOLID_EXAMPLE_CODE.externalDrop}
    stackblitz={false}
  >
    <SolidDemo load={loadExternalDropGrid} />
  </DemoFrame>
);

const loadSortableGrid = () => import("./solid/SortableGrid");
export const SortableGridDemo = () => (
  <DemoFrame
    title="Sortable ↔ grid"
    hint="drag a widget into the grid · drag a tile out to the tray · reorder the tray"
    code={SOLID_EXAMPLE_CODE.sortableGrid}
    stackblitz={false}
  >
    <SolidDemo load={loadSortableGrid} />
  </DemoFrame>
);

const loadComponentLayerGrid = () => import("./solid/ComponentLayerGrid");
export const ComponentLayerDemo = () => (
  <DemoFrame
    title="Component layer"
    hint="the turnkey <GridLayout> — no hooks, no dnd-kit wiring"
    code={SOLID_EXAMPLE_CODE.componentLayer}
    stackblitz={false}
  >
    <SolidDemo load={loadComponentLayerGrid} />
  </DemoFrame>
);
