import { DragDropProvider } from "@dnd-kit/vue";
import { defineComponent, h } from "vue";
import { markInProvider, useIsInProvider } from "../context.js";
import { gridControllerProps } from "../props.js";
import { GridSurface } from "./GridSurface.js";

/**
 * Drop-in grid: a controlled, react-grid-layout v2-compatible layout backed by dnd-kit.
 * Supplies the dnd-kit `<DragDropProvider>` for the turnkey case (unless one already
 * exists above — nested grids and `<SnapGridGroup>` siblings share it, the cross-grid
 * seam). The surface itself lives in a child component so it sets up *inside* the
 * provider (else the manager isn't injectable).
 *
 * Item content comes from the `item` scoped slot: `<template #item="{ item }">`.
 */
export const GridLayout = defineComponent({
  name: "SnapGridLayout",
  inheritAttrs: false,
  props: gridControllerProps,
  setup(props, { slots, attrs }) {
    const inProvider = useIsInProvider();
    if (!inProvider) markInProvider();

    return () => {
      const surface = h(GridSurface, { ...props, ...attrs }, slots);
      return inProvider ? surface : h(DragDropProvider, null, { default: () => surface });
    };
  },
});
