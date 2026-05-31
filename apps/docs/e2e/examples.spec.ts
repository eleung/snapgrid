import { type Page, expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/examples/");
  await page.waitForSelector(".snapgrid-item");
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
  const item = demo.locator(".snapgrid-item").first();
  const before = await item.boundingBox();
  await item.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press("Enter");
  await expect(demo.locator(".snapgrid-placeholder")).toHaveCount(1);
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const after = await item.boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x + 20);
});

test("drag handle: the grip drags, the button stays clickable", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.locator(".dg-grip--bar") });
  const tile = demo
    .locator(".snapgrid-item")
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

test("compaction: switching packer keeps tiles overlap-free", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.getByRole("button", { name: "masonry" }) });
  await demo.getByRole("button", { name: "masonry" }).click();
  await page.waitForTimeout(300);
  const rects = await demo.locator(".snapgrid-item").evaluateAll((els) =>
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
  const aItems = subA.locator(".snapgrid > .snapgrid-item");
  const bItems = subB.locator(".snapgrid > .snapgrid-item");
  const a0 = await aItems.count();
  const b0 = await bItems.count();
  await dragInto(
    page,
    (await aItems.first().boundingBox())!,
    (await subB.locator(".snapgrid").boundingBox())!,
  );
  await expect(bItems).toHaveCount(b0 + 1);
  await expect(aItems).toHaveCount(a0 - 1);
});

test("external drop: a palette chip lands in the grid", async ({ page }) => {
  const demo = page.locator(".dg-demo", { has: page.locator(".dg-chip") });
  await demo.scrollIntoViewIfNeeded();
  const dropGrid = demo
    .locator(".dg-subgrid", { hasNot: page.locator(".dg-chip") })
    .locator(".snapgrid");
  const items = dropGrid.locator("> .snapgrid-item");
  const n0 = await items.count();
  await dragInto(
    page,
    (await demo.locator(".dg-chip").first().boundingBox())!,
    (await dropGrid.boundingBox())!,
  );
  await expect(items).toHaveCount(n0 + 1);
});
