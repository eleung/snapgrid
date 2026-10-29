/** @jsxImportSource solid-js */
import { useGridItem } from "@snapgridjs/solid";
import { type ParentProps, Show } from "solid-js";
import { ResizeHandle } from "./ResizeHandle";

// A single positioned grid tile: applies useGridItem's ref + style to a wrapper that holds
// whatever content the demo rendered, plus a resize handle. `dg-cell` is the demo's own
// hook for styling/tests — headless tiles carry no class from the library. Mirrors the
// React / Svelte / Vue `GridTile` helper.
export function GridTile(props: ParentProps<{ id: string; group: string; resizable?: boolean }>) {
  const tile = useGridItem({ id: props.id, group: props.group });

  // Match the library's per-item gating: static or isResizable:false → no handle.
  const showHandle = () => {
    const item = tile.item();
    return !!props.resizable && !!item && !item.static && item.isResizable !== false;
  };

  return (
    <div
      ref={tile.ref}
      style={tile.style()}
      class="dg-cell"
      data-dragging={tile.isDragging() || undefined}
    >
      {props.children}
      <Show when={showHandle()}>
        <ResizeHandle id={props.id} group={props.group} />
      </Show>
    </div>
  );
}
