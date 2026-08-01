<script setup>
import { useGridContainer } from "@snapgridjs/vue";
import DemoTile from "./DemoTile.vue";
import GridPlaceholder from "./GridPlaceholder.vue";
import GridTile from "./GridTile.vue";

// The grid host — rendered inside a DragDropProvider (see HeadlessGrid, or a shared
// SnapGridGroup/provider for multi-grid demos) so useGridContainer resolves the right
// manager. Vue resolves `inject` from the PARENT chain, so this must always be a CHILD
// component of the provider, never the one rendering it. Renders the surface, tiles, and
// the placeholder. Mirrors the React/Svelte `HeadlessGridHost` helper: the headless
// wiring every demo shares. The `content` slot draws a tile's inner content (default:
// DemoTile); the `tile` slot (gated by `isCustom`) supplies a full custom positioned tile.
const props = defineProps({
  layout: Array,
  width: Number,
  onLayoutChange: Function,
  // The per-grid config (gridConfig, dragConfig, compactor, dropConfig, accept…), minus
  // the controlled state the host threads itself.
  options: Object,
  resizable: { type: Boolean, default: false },
  id: String,
  isCustom: Function,
});

// The options are a GETTER function, so the controller tracks whichever fields change.
const { setRef, style, group } = useGridContainer(() => ({
  ...(props.id ? { id: props.id } : {}),
  layout: props.layout,
  width: props.width,
  onLayoutChange: props.onLayoutChange,
  ...(props.options ?? {}),
}));

// `isCustom` is a plain predicate prop — kept out of the template so the expression
// compiler never has to deal with an optional call.
const custom = (item) => (props.isCustom ? props.isCustom(item) : false);
</script>

<template>
  <div :ref="setRef" :style="style" class="dg-grid">
    <template v-for="item in layout" :key="item.i">
      <slot v-if="$slots.tile && custom(item)" name="tile" :item="item" :group="group" />
      <GridTile v-else :id="item.i" :group="group" :resizable="resizable">
        <slot v-if="$slots.content" name="content" :item="item" />
        <DemoTile
          v-else
          :label="item.i.toUpperCase()"
          :meta="`${item.w}×${item.h}`"
          :is-static="item.static ?? false"
        />
      </GridTile>
    </template>
    <GridPlaceholder :group="group" />
  </div>
</template>
