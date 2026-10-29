/** @jsxImportSource solid-js */
import {
  DragDropProvider,
  type Layout,
  type LayoutItem,
  type UseGridControllerOptions,
  useGridContainer,
} from "@snapgridjs/solid";
import { type Accessor, For, type JSX, createMemo } from "solid-js";
import { DemoTile } from "./DemoTile";
import { GridPlaceholder } from "./GridPlaceholder";
import { GridTile } from "./GridTile";

export interface HeadlessGridProps {
  layout: Layout;
  width: number;
  onLayoutChange: (layout: Layout) => void;
  /** The per-grid config (gridConfig, dragConfig, compactor, dropConfig, accept…), minus
   *  the controlled state the host threads itself. */
  options?: Partial<UseGridControllerOptions>;
  resizable?: boolean;
  id?: string;
  /** Draws a tile's inner content (default: DemoTile). */
  content?: (item: Accessor<LayoutItem>) => JSX.Element;
  /** For items where `isCustom` is true: a full custom positioned tile. */
  tile?: (item: Accessor<LayoutItem>, group: string) => JSX.Element;
  isCustom?: (item: LayoutItem) => boolean;
}

// The headless wiring every single-grid demo shares: a dnd-kit DragDropProvider wrapping
// the grid host. The provider is the OUTERMOST element — useGridContainer must run inside
// it (it registers the grid's controller on the provider's manager), and Solid resolves
// context from the owner chain, so the host is a component rendered INSIDE the provider,
// never the one rendering it. Mirrors the React/Svelte/Vue `HeadlessGrid`.
export function HeadlessGrid(props: HeadlessGridProps) {
  return (
    <DragDropProvider>
      <HeadlessGridHost {...props} />
    </DragDropProvider>
  );
}

// The grid host — rendered inside a DragDropProvider (see HeadlessGrid, or a shared
// SnapGridGroup/provider for multi-grid demos) so useGridContainer resolves the right
// manager. Renders the surface, tiles, and the placeholder.
export function HeadlessGridHost(props: HeadlessGridProps) {
  // The options are a GETTER, so the controller tracks whichever fields change.
  const grid = useGridContainer(() => ({
    ...(props.id ? { id: props.id } : {}),
    layout: props.layout,
    width: props.width,
    onLayoutChange: props.onLayoutChange,
    ...props.options,
  }));

  return (
    <div ref={grid.ref} style={grid.style()} class="dg-grid">
      {/* Iterate ids, not entries: <For> keys by identity, and every commit replaces the
          entries — iterating them would remount each tile on every drop. */}
      <For each={props.layout.map((it) => it.i)}>
        {(id) => {
          // This tile's committed entry. Holds the last one so a tile being removed never
          // reads `undefined` before <For> disposes it.
          const item = createMemo<LayoutItem>(
            (prev) => props.layout.find((it) => it.i === id) ?? prev,
            props.layout.find((it) => it.i === id)!,
          );
          return props.tile && props.isCustom?.(item()) ? (
            props.tile(item, grid.group())
          ) : (
            <GridTile id={id} group={grid.group()} resizable={props.resizable}>
              {props.content ? (
                props.content(item)
              ) : (
                <DemoTile
                  label={id.toUpperCase()}
                  meta={`${item().w}×${item().h}`}
                  isStatic={item().static ?? false}
                />
              )}
            </GridTile>
          );
        }}
      </For>
      <GridPlaceholder group={grid.group()} />
    </div>
  );
}
