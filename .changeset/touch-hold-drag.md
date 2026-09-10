---
"@snapgridjs/dnd": minor
"@snapgridjs/react": minor
"@snapgridjs/svelte": minor
"@snapgridjs/vue": minor
---

Touch drags now arm on a hold instead of on movement, so a swipe over a tile scrolls the page again

Mobile scrolling was broken for any grid inside a scrollable page: every touch that landed on a tile
was captured by the drag sensor, so the list could not be swiped. Two things caused it, and both are
fixed:

- The item sensors replaced dnd-kit's activation constraints (which include a 250 ms touch delay)
  with a flat `threshold` distance, so 3 px of finger movement started a drag and `preventDefault`ed
  the `touchmove`. Touch now gets a hold constraint; the mouse and the pen keep `threshold`.
- Tiles and resize handles set `touch-action: none`, which stops the browser from starting a scroll
  from any touch on them regardless of the sensors. Both are `touch-action: pan-y` now.

New `dragConfig.touchHold` (ms, default `250`) tunes the hold — set it to `0` for the previous
behaviour, where touch drags on movement like the mouse.
