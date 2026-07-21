# @snapgridjs/core

## 0.9.0

### Patch Changes

- 65bebeb: Refresh package READMEs for the Svelte release. `@snapgridjs/svelte` now ships a README (install, headless quick start, and the turnkey `<GridLayout>`); the React, core, dnd, and extras READMEs document the Svelte binding alongside React; and documentation links that moved under `/react` and `/svelte` are corrected.

## 0.8.0

## 0.7.0

## 0.6.1

## 0.6.0

## 0.5.0

## 0.4.0

### Patch Changes

- 927c9fe: Fix: a tile received from another grid (cross-grid or nested) could never land in an occupied row — e.g. the target grid's top row. The insert placed the tile straight at the target cell, so the move meant to displace the occupant was a no-op and the tile stacked below. The incoming tile now displaces whatever occupies the drop cell, matching a same-grid drop.
