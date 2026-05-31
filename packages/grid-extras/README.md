# @snapgrid/extras

Extra packing styles for [snapgrid](https://github.com/eleung/snapgrid) — drop-in `Compactor`s beyond the built-in `vertical` / `horizontal` / `none`.

[![npm](https://img.shields.io/npm/v/@snapgrid/extras.svg)](https://www.npmjs.com/package/@snapgrid/extras)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

## Install

```sh
pnpm add @snapgrid/extras
```

Use alongside [`@snapgrid/react`](https://www.npmjs.com/package/@snapgrid/react) (or `@snapgrid/core`).

## Packers

- **`masonryCompactor`** — shortest-column packing for Pinterest-style boards.
- **`gravityCompactor`** — tiles fall and settle into the nearest gap.
- **`shelfCompactor`** — row-by-row ("shelf") packing.
- **`wrapCompactor`** / `wrapOverlapCompactor` — flow-wrap packing.
- Fast variants: `fastVerticalCompactor`, `fastHorizontalCompactor` (and their `*Overlap` forms).

```tsx
import { GridLayout } from "@snapgrid/react";
import { masonryCompactor } from "@snapgrid/extras";

<GridLayout layout={layout} width={width} onLayoutChange={setLayout} compactor={masonryCompactor} />;
```

→ See the [compaction guide](https://snapgrid.dev/docs/guides/compaction).

## License

MIT © Edmond Leung
