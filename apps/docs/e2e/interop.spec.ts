import { type Page, expect, test } from "@playwright/test";

// Sortable ↔ grid interop: one DragDropProvider hosts a dnd-kit useSortable tray
// beside a snapgrid grid. The cross-parent moves are reduced LIVE in onDragOver
// (dnd-kit reparents the dragged node mid-drag, so reducing on drop desyncs React
// → removeChild). We assert the FINAL state after release — the live reduction
// already committed to React during the drag, so it persists — and that no
// console/page error fired (the removeChild regression).

// Capture console errors + uncaught page errors for the whole test.
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function gotoInterop(page: Page) {
  await page.goto("/examples/");
  const demo = page.locator(".dg-interop");
  await demo.waitFor();
  await demo.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return demo;
}

// Drag from a source rect into a destination rect: clear the threshold, glide to
// the target, dwell so onDragOver fires + React renders, then release + settle.
async function drag(
  page: Page,
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number; height: number },
) {
  const fx = from.x + from.width / 2;
  const fy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(fx + 12, fy + 12, { steps: 5 }); // clear the threshold
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.mouse.move(tx + 6, ty + 4, { steps: 4 });
  await page.waitForTimeout(250); // let onDragOver fire + React render
  await page.mouse.up();
  await page.waitForTimeout(450);
}

test("tray card → grid: lands as a real cell, no removeChild", async ({ page }) => {
  const errors = trackErrors(page);
  const demo = await gotoInterop(page);

  const tray = demo.locator(".dg-tray");
  const grid = demo.locator(".dg-grid");
  const card = tray.locator(".dg-tray__card").filter({ hasText: "users" });
  const gridCells = grid.locator(":scope > .dg-cell");

  await expect(card).toHaveCount(1);
  await expect(gridCells.filter({ hasText: "users" })).toHaveCount(0);
  const before = await gridCells.count();

  await drag(page, (await card.boundingBox())!, (await grid.boundingBox())!);

  // "users" is now a real grid cell and gone from the tray.
  await expect(gridCells.filter({ hasText: "users" })).toHaveCount(1);
  await expect(gridCells).toHaveCount(before + 1);
  await expect(tray.locator(".dg-tray__card").filter({ hasText: "users" })).toHaveCount(0);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("grid tile → tray: pulls out into the tray, no removeChild", async ({ page }) => {
  const errors = trackErrors(page);
  const demo = await gotoInterop(page);

  const tray = demo.locator(".dg-tray");
  const grid = demo.locator(".dg-grid");
  const tile = grid.locator(":scope > .dg-cell").filter({ hasText: "chart" });
  const target = tray.locator(".dg-tray__card").filter({ hasText: "sales" });

  await expect(tile).toHaveCount(1);
  await expect(tray.locator(".dg-tray__card").filter({ hasText: "chart" })).toHaveCount(0);

  await drag(page, (await tile.boundingBox())!, (await target.boundingBox())!);

  // "chart" is now a tray card and gone from the grid.
  await expect(tray.locator(".dg-tray__card").filter({ hasText: "chart" })).toHaveCount(1);
  await expect(grid.locator(":scope > .dg-cell").filter({ hasText: "chart" })).toHaveCount(0);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("grid tile → tray: grid placeholder clears while held over the tray", async ({ page }) => {
  const demo = await gotoInterop(page);
  const grid = demo.locator(".dg-grid");
  const tile = grid.locator(":scope > .dg-cell").filter({ hasText: "chart" });
  const card = demo.locator(".dg-tray .dg-tray__card").filter({ hasText: "users" });
  const tb = (await tile.boundingBox())!;
  const ub = (await card.boundingBox())!;

  // Drag the tile onto a tray card and HOLD there.
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(tb.x + 12, tb.y + 12, { steps: 4 });
  await page.mouse.move(ub.x + ub.width / 2, ub.y + ub.height / 2, { steps: 14 });
  await page.mouse.move(ub.x + ub.width / 2 + 3, ub.y + ub.height / 2, { steps: 3 });

  // The tile has left the grid, so the grid's landing placeholder must not linger
  // (regression: the engine's external-source path skipped hiding it after the
  // dragged element swapped to a foreign sortable mid-drag).
  let maxSeen = 0;
  for (let i = 0; i < 6; i++) {
    maxSeen = Math.max(maxSeen, await grid.locator(":scope > .dg-placeholder").count());
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  expect(maxSeen, "grid placeholder should not render while the tile is over the tray").toBe(0);
});

test("grid tile → tray: re-packs the hole the tile leaves (no gap)", async ({ page }) => {
  const errors = trackErrors(page);
  const demo = await gotoInterop(page);

  const grid = demo.locator(".dg-grid");
  const tray = demo.locator(".dg-tray");
  // "chart" is the top-left tile (y=0); "feed" sits a row below it (y=2). Removing
  // "chart" must compact "feed" up into the freed top row, not leave a gap.
  const chart = grid.locator(":scope > .dg-cell").filter({ hasText: "chart" });
  const feed = grid.locator(":scope > .dg-cell").filter({ hasText: "feed" });
  const target = tray.locator(".dg-tray__card").filter({ hasText: "sales" });

  const gridTop = (await grid.boundingBox())!.y;
  const feedBefore = (await feed.boundingBox())!.y - gridTop;
  expect(feedBefore).toBeGreaterThan(80); // feed starts a row down

  await drag(page, (await chart.boundingBox())!, (await target.boundingBox())!);

  await expect(grid.locator(":scope > .dg-cell").filter({ hasText: "chart" })).toHaveCount(0);
  const feedAfter = (await feed.boundingBox())!.y - gridTop;
  // feed compacted up into the top row — no leftover hole where "chart" was.
  expect(feedAfter).toBeLessThan(feedBefore - 80);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("tray reorder still works alongside the grid", async ({ page }) => {
  const errors = trackErrors(page);
  const demo = await gotoInterop(page);

  const tray = demo.locator(".dg-tray");
  const cardText = () => tray.locator(".dg-tray__card").allInnerTexts();

  expect(await cardText()).toEqual(["users", "sales", "tasks"]);

  // Drag the last card up onto the first — the tray reorders via dnd-kit's move().
  const last = tray.locator(".dg-tray__card").filter({ hasText: "tasks" });
  const first = tray.locator(".dg-tray__card").filter({ hasText: "users" });
  const lb = (await last.boundingBox())!;
  const fb = (await first.boundingBox())!;
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.mouse.down();
  await page.mouse.move(lb.x, lb.y - 10, { steps: 5 });
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 16 });
  await page.waitForTimeout(300);
  const during = await cardText();
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await cardText();

  // The reorder happened mid-drag AND persisted after release (not just an optimistic
  // shuffle that reverts on drop): "tasks" is no longer last in either snapshot, and
  // the released order still holds all three cards.
  expect(during[during.length - 1]).not.toBe("tasks");
  expect(after[after.length - 1]).not.toBe("tasks");
  expect([...after].sort()).toEqual(["sales", "tasks", "users"]);
  expect(errors, errors.join("\n")).toEqual([]);
});
