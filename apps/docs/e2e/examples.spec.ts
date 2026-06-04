import { type Page, expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/");
  await page.waitForSelector(".dg-cell");
  await page.waitForTimeout(400);
});

// Drag from one element's center into a destination rect, dwelling + settling in
// it so the geometry-based drop target (used under feedback:'none') registers.
async function dragInto(
  page: Page,
  from: { x: number; y: number; width: number; height: number },
  dest: { x: number; y: number; width: number; height: number },
) {
  const fx = from.x + from.width / 2;
  const fy = from.y + from.height / 2;
  const dx = dest.x + dest.width / 2;
  const dy = dest.y + dest.height / 2;
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(fx + 12, fy + 12, { steps: 5 });
  await page.mouse.move(dx, dy, { steps: 20 });
  await page.mouse.move(dx + 6, dy + 4, { steps: 4 });
  await page.mouse.move(dx, dy, { steps: 4 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(450);
}

test("keyboard: pick up, move with arrows, drop", async ({ page }) => {
  const demo = page.locator(".dg-demo").first(); // basic drag & resize
  const item = demo.locator(".dg-cell").first();
  const before = await item.boundingBox();
  await item.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press("Enter");
  await expect(demo.locator(".dg-placeholder")).toHaveCount(1);
  // A keyboard drag has no floating overlay, so the in-grid tile must stay
  // VISIBLE and move in place (unlike a pointer drag, which hides it and floats
  // a clone). Guards the Phase 3 keyboard path.
  await expect(item).toBeVisible();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await expect(item).toBeVisible();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const after = await item.boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x + 20);
});

test("drag handle: the grip drags, the button stays clickable", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.locator(".dg-grip--bar") });
  const tile = demo
    .locator(".dg-cell")
    .filter({ has: page.locator(".dg-likebtn") })
    .first();
  const before = await tile.boundingBox();
  // Clicking the like button increments it and must NOT start a drag.
  const btn = tile.locator(".dg-likebtn");
  const label0 = (await btn.textContent())?.trim();
  await btn.click();
  expect((await btn.textContent())?.trim()).not.toEqual(label0);
  expect(Math.abs((await tile.boundingBox())!.x - before!.x)).toBeLessThan(3);
  // Dragging the grip bar DOES move it.
  const bar = tile.locator(".dg-grip--bar");
  const bb = await bar.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb!.x + 260, bb!.y, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(Math.abs((await tile.boundingBox())!.x - before!.x)).toBeGreaterThan(20);
});

test("static items: locked can't drag, pinned drags by the grip", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.locator(".dg-anchor") });
  const tile = demo.locator(".dg-cell", { has: page.locator(".dg-anchor") }).first();
  const grip = tile.locator(".dg-anchor__grip");
  const toggle = tile.locator(".dg-anchor__toggle");
  const before = await tile.boundingBox();

  // LOCKED (default): dragging the grip does nothing — the handle is disabled.
  const gb0 = await grip.boundingBox();
  await page.mouse.move(gb0!.x + gb0!.width / 2, gb0!.y + gb0!.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb0!.x + 220, gb0!.y, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(Math.abs((await tile.boundingBox())!.x - before!.x)).toBeLessThan(3);

  // Toggle to PINNED. The toggle is a clean sibling of the (disabled) handle, so
  // it's clickable even while locked; the click itself must not move the tile.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(Math.abs((await tile.boundingBox())!.x - before!.x)).toBeLessThan(3);

  // PINNED: dragging the grip DOES move the anchor.
  const gb = await grip.boundingBox();
  await page.mouse.move(gb!.x + gb!.width / 2, gb!.y + gb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb!.x + 240, gb!.y, { steps: 14 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(350);
  expect(Math.abs((await tile.boundingBox())!.x - before!.x)).toBeGreaterThan(20);
});

test("resize: dragging the SE handle grows the tile", async ({ page }) => {
  // The "Resize constraints" demo: the unconstrained "free" tile sits at the
  // right edge (can't widen), so drag the SE handle DOWN and assert it grows
  // taller — proving the headless resize handle is wired up.
  const demo = page.locator(".dg-demo", { has: page.getByText("free", { exact: true }) });
  await demo.scrollIntoViewIfNeeded();
  const tile = demo.locator(".dg-cell").filter({ hasText: "free" });
  const before = await tile.boundingBox();
  const handle = tile.locator(".dg-rh--se");
  const hb = await handle.boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + 20, hb!.y + 150, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await tile.boundingBox();
  expect(after!.height).toBeGreaterThan(before!.height + 20);
});

test("compaction: switching packer keeps tiles overlap-free", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.getByRole("button", { name: "masonry" }) });
  await demo.getByRole("button", { name: "masonry" }).click();
  await page.waitForTimeout(300);
  const rects = await demo.locator(".dg-cell").evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const overlap =
        a.x < b.x + b.w - 2 && a.x + a.w - 2 > b.x && a.y < b.y + b.h - 2 && a.y + a.h - 2 > b.y;
      expect(overlap, `tiles ${i} and ${j} overlap`).toBe(false);
    }
  }
});

test("cross-grid: a tile can be dragged into the other grid", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.getByText(/grid a/i) });
  // This demo sits far down the page; scroll it into view first so boundingBox()
  // returns in-viewport coordinates the mouse can actually reach.
  await demo.scrollIntoViewIfNeeded();
  const subA = demo.locator(".dg-subgrid", { has: page.getByText(/grid a/i) });
  const subB = demo.locator(".dg-subgrid", { has: page.getByText(/grid b/i) });
  const aItems = subA.locator(".dg-grid > .dg-cell");
  const bItems = subB.locator(".dg-grid > .dg-cell");
  const a0 = await aItems.count();
  const b0 = await bItems.count();
  await dragInto(
    page,
    (await aItems.first().boundingBox())!,
    (await subB.locator(".dg-grid").boundingBox())!,
  );
  await expect(bItems).toHaveCount(b0 + 1);
  await expect(aItems).toHaveCount(a0 - 1);
});

test("external drop: a palette chip lands in the grid", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.locator(".dg-chip") });
  await demo.scrollIntoViewIfNeeded();
  const dropGrid = demo
    .locator(".dg-subgrid", { hasNot: page.locator(".dg-chip") })
    .locator(".dg-grid");
  const items = dropGrid.locator("> .dg-cell");
  const n0 = await items.count();
  await dragInto(
    page,
    (await demo.locator(".dg-chip").first().boundingBox())!,
    (await dropGrid.boundingBox())!,
  );
  await expect(items).toHaveCount(n0 + 1);
});

test("snapToGrid: the floating tile quantizes to whole cells", async ({ page }) => {
  // The snap demo: toggle snapToGrid on, then drag a tile by a sub-cell amount
  // and confirm the dragged tile snaps in cell-sized steps rather than gliding to
  // the exact pointer. The tile floats itself (no separate overlay), so its own
  // bounding box IS the floating position.
  const demo = page.locator(".dg-demo", { has: page.getByText("snapToGrid") });
  await demo.scrollIntoViewIfNeeded();
  await demo.getByText("snapToGrid").click();

  const tile = demo.locator(".dg-cell").first();
  const b = (await tile.boundingBox())!;
  const fx = b.x + b.width / 2;
  const fy = b.y + b.height / 2;

  // The dragged tile is the one that floats (dnd-kit lifts it), so read its x.
  const tileX = async () => {
    const box = await tile.boundingBox();
    return box ? Math.round(box.x) : null;
  };

  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(fx + 10, fy, { steps: 4 }); // clear threshold; <1 cell
  await page.waitForTimeout(80);
  const xSmall = await tileX();

  // Nudge a bit more, still within the same cell — a snapped tile must NOT move.
  await page.mouse.move(fx + 24, fy, { steps: 4 });
  await page.waitForTimeout(80);
  const xStillSameCell = await tileX();

  // Move past a full cell — now the tile should jump by a cell.
  await page.mouse.move(fx + 220, fy, { steps: 10 });
  await page.waitForTimeout(80);
  const xNextCell = await tileX();
  await page.mouse.up();

  expect(xSmall).not.toBeNull();
  // Sub-cell nudge: snapped tile stays put (quantized), unlike a gliding one.
  expect(Math.abs((xStillSameCell ?? 0) - (xSmall ?? 0))).toBeLessThan(8);
  // Crossing a cell boundary moves the tile by a meaningful (cell-sized) jump.
  expect((xNextCell ?? 0) - (xSmall ?? 0)).toBeGreaterThan(80);
});
