/** @jsxImportSource solid-js */
import { useGridResizeHandle } from "@snapgridjs/solid";

// A bottom-right resize handle, modelled as its own draggable via useGridResizeHandle.
// `handleProps` keeps a pointer-down on it from starting an item drag; CSS (`.dg-rh`)
// places + styles it. Mirrors the React / Svelte / Vue `ResizeHandle`.
export function ResizeHandle(props: { id: string; group: string }) {
  const handle = useGridResizeHandle({ id: props.id, handle: "se", group: props.group });
  return <span ref={handle.ref} {...handle.handleProps} class="dg-rh dg-rh--se" />;
}
