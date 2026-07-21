import { expect, test } from "@playwright/test";

// The Svelte examples gallery mounts native @snapgridjs/svelte demos as client-side
// islands. Like the React gallery, the demos are headless (createGridContainer +
// createGridItem), so their surfaces/tiles carry the demo's `.dg-grid`/`.dg-cell`
// hooks — NOT the component layer's `.snapgrid` classes. These smoke-test that the
// islands mount and the grid engine works through the Svelte binding.

test.beforeEach(async ({ page }) => {
  await page.goto("/svelte/examples/");
  // The headless demos render `.dg-cell` tiles; wait for the islands to mount.
  await page.waitForSelector("main .dg-cell");
  await page.waitForTimeout(400);
});

test("every svelte demo island mounts without a client error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // The first demo is the basic grid; its tiles are `.dg-cell`.
  await expect(page.locator("main .dg-demo").first().locator(".dg-cell").first()).toBeVisible();
  // Later demos further down the page mount too (the compaction packer pills, the
  // drag-handle grips).
  await expect(page.getByRole("button", { name: "masonry" })).toBeVisible();
  await expect(page.locator("main .dg-grip--bar").first()).toBeVisible();

  expect(errors, `client errors: ${errors.join("\n")}`).toEqual([]);
});

test("dragging a tile in the basic grid moves it to a new cell", async ({ page }) => {
  const demo = page.locator("main .dg-demo").first(); // basic drag & resize
  const grid = demo.locator(".dg-grid").first();
  const tile = demo.locator(".dg-cell").first();
  await expect(tile).toBeVisible();

  const gridBox = await grid.boundingBox();
  const before = await tile.boundingBox();
  if (!gridBox || !before) throw new Error("basic grid / first tile has no box");
  const fx = before.x + before.width / 2;
  const fy = before.y + before.height / 2;

  // Destination: another cell to the RIGHT, kept well INSIDE the grid's rect (a drop
  // outside the grid reverts). Dwell + settle so dnd-kit's collision registers.
  const tx = gridBox.x + gridBox.width * 0.62;
  const ty = fy;
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(fx + 12, fy + 6, { steps: 5 });
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.mouse.move(tx, ty, { steps: 4 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(450);

  const after = await tile.boundingBox();
  if (!after) throw new Error("tile has no box after drop");
  expect(Math.round(after.x - before.x) + Math.round(after.y - before.y)).not.toBe(0);
});
