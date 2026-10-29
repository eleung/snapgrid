/** @jsxImportSource solid-js */
import { Show } from "solid-js";

// The neutral demo tile — mirrors the React `Tile` (DemoFrame.tsx) / Svelte + Vue
// `DemoTile` and their `.dg-tile` styling in styles/globals.css: a paper card with a mono
// label and the item's size, plus accent/static variants. Using the same global classes
// keeps the /solid gallery pixel-identical to the others instead of a bespoke look.
export function DemoTile(props: {
  label: string;
  meta?: string;
  accent?: boolean;
  isStatic?: boolean;
}) {
  return (
    <div
      class="dg-tile"
      classList={{ "dg-tile--accent": props.accent, "dg-tile--static": props.isStatic }}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
    >
      <span class="dg-tile__label">{props.label}</span>
      <Show when={props.meta}>
        <span class="dg-tile__meta">{props.meta}</span>
      </Show>
    </div>
  );
}
