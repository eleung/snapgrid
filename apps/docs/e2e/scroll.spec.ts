import { type Page, expect, test } from "@playwright/test";

// Regression for issue #49 — drag tracking under page scroll.
//
// The in-grid drag target is derived from the pointer against the grid's rect. If
// the page scrolls mid-drag, the grid moves in the viewport but the pointer does
// not, so the target must keep tracking — otherwise the landing placeholder freezes
// and you can't reach (or drop at) rows the scroll reveals. dnd-kit emits no
// `dragmove` for a scroll (it only re-runs collision), so the engine listens for
// scroll itself and recomputes. This test drives that with `window.scrollBy` while
// the pointer is held still.

test.beforeEach(async ({ page }) => {
  await page.goto("/react/examples/");
  await page.waitForSelector(".dg-cell");
  await page.waitForTimeout(400);
});

// Placeholder position relative to the grid's top-left — scroll-invariant (both
// shift together when the page scrolls), so it isolates the *target cell* rather
// than the viewport shift.
async function placeholderRelY(page: Page, demo: ReturnType<Page["locator"]>) {
  const ph = await demo.locator(".dg-placeholder").boundingBox();
  const grid = await demo.locator(".dg-grid").boundingBox();
  return ph && grid ? ph.y - grid.y : null;
}

test("the landing placeholder tracks the grid as the page scrolls under a still pointer", async ({
  page,
}) => {
  // The Compaction demo, switched to the `none` packer so placement is free — a
  // tile dropped low stays low (vertical compaction would pull it back up and hide
  // the effect). It's the demo whose controls include a `none` pill.
  const demo = page.locator(".dg-demo", {
    has: page.getByRole("button", { name: "none", exact: true }),
  });
  await demo.scrollIntoViewIfNeeded();
  await demo.getByRole("button", { name: "none", exact: true }).click();
  await page.waitForTimeout(200);

  // Grab the top-left tile so there's room below for the target to travel.
  const tile = demo.locator(".dg-cell").first();
  const b = (await tile.boundingBox())!;
  const fx = b.x + b.width / 2;
  const fy = b.y + b.height / 2;

  // Start a real pointer drag and clear the activation threshold; the pointer then
  // stays put for the rest of the test.
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(fx + 8, fy + 8, { steps: 4 });
  await page.waitForTimeout(200);

  const gridBefore = (await demo.locator(".dg-grid").boundingBox())!;
  const y0 = await placeholderRelY(page, demo);

  // Scroll the page WITHOUT moving the pointer. dnd-kit fires no dragmove for this;
  // the engine's own scroll handler must recompute the target against the fresh rect.
  await page.evaluate(() => window.scrollBy(0, 140));
  await page.waitForTimeout(300); // let the recompute + placeholder transition settle

  const gridAfter = (await demo.locator(".dg-grid").boundingBox())!;
  const y1 = await placeholderRelY(page, demo);
  await page.mouse.up();

  // Sanity: the scroll actually moved the grid in the viewport (so the drag really
  // was under a scrolling grid, not a no-op).
  expect(gridBefore.y - gridAfter.y, "the page scrolled the grid up").toBeGreaterThan(80);

  expect(y0, "a landing placeholder is shown while dragging").not.toBeNull();
  expect(y1, "the placeholder is still shown after scrolling").not.toBeNull();
  // With the bug the target freezes (y1 ≈ y0); with the fix it advances downward
  // with the scroll. Require a clear, multi-cell advance (row pitch is 62px).
  expect(y1! - y0!, "the target tracked the scroll").toBeGreaterThan(60);
});
