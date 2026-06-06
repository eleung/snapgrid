# @snapgridjs/core

## 0.6.1

## 0.6.0

## 0.5.0

## 0.4.0

### Patch Changes

- 927c9fe: Fix: a tile received from another grid (cross-grid or nested) could never land in an occupied row — e.g. the target grid's top row. The insert placed the tile straight at the target cell, so the move meant to displace the occupant was a no-op and the tile stacked below. The incoming tile now displaces whatever occupies the drop cell, matching a same-grid drop.
