/** @jsxImportSource solid-js */
import { useContainerWidth } from "@snapgridjs/solid";
import { createSignal } from "solid-js";
import { DemoTile } from "./DemoTile";
import { HeadlessGrid } from "./HeadlessGrid";
import { HERO, HERO_ACCENT } from "./demo-config";

// The home-page hero grid, Solid edition — the same headless composition + `.dg-*` look as
// the React `HeroGrid` / Svelte + Vue hero grids, mounted as a client island when Solid is
// the selected framework.
export default function SolidHeroGrid() {
  const [layout, setLayout] = createSignal(HERO);
  const { width, ref } = useContainerWidth({ initialWidth: 563 });

  const options = {
    gridConfig: { cols: 12, rowHeight: 56, margin: [12, 12] as [number, number] },
    resizeConfig: { handles: ["se" as const] },
  };

  return (
    // Outer card carries the padding/border/dotted background; the INNER div is what
    // useContainerWidth measures, so the grid surface is sized to the real width.
    <div class="dg-hero-grid">
      <div ref={ref}>
        <HeadlessGrid
          layout={layout()}
          width={width()}
          onLayoutChange={setLayout}
          options={options}
          resizable
          content={(item) => <DemoTile label={item().i} accent={HERO_ACCENT.includes(item().i)} />}
        />
      </div>
    </div>
  );
}
