import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/showcase/");
  await page.waitForSelector(".sg-widget");
  await page.waitForTimeout(400);
});

test("drag a widget by its header relocates it", async ({ page }) => {
  const item = page.locator(".snapgrid-item:has(.sg-kpi)").first();
  const before = await item.boundingBox();
  const head = item.locator(".sg-widget__head");
  const hb = await head.boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + 220, hb!.y + 160, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await item.boundingBox();
  expect(Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)).toBeGreaterThan(20);
});

test("resizing a widget from its corner grows it", async ({ page }) => {
  // Traffic (area chart) sits at the left with room to grow, unlike the
  // right-edge donut.
  const item = page.locator(".snapgrid-item").filter({
    has: page.getByText("Traffic", { exact: true }),
  });
  const before = await item.boundingBox();
  const handle = item.locator(":scope > .snapgrid-resize-handle--se");
  const hb = await handle.boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + 130, hb!.y + 120, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await item.boundingBox();
  expect(after!.width).toBeGreaterThan(before!.width + 20);
});

test("add then remove a widget", async ({ page }) => {
  const widgets = page.locator(".snapgrid-item:has(.sg-widget__head)");
  const count0 = await widgets.count();
  await page.getByRole("button", { name: /add widget/i }).click();
  await page.locator(".sg-menu__item").first().click();
  await expect(widgets).toHaveCount(count0 + 1);
  await page.locator(".sg-widget__x").last().click();
  await expect(widgets).toHaveCount(count0);
});

test("dashboard reflows to fewer columns as the viewport narrows", async ({ page }) => {
  await expect(page.locator(".sg-bp")).toHaveText("12 cols");
  await page.setViewportSize({ width: 760, height: 1400 });
  await expect(page.locator(".sg-bp")).toHaveText("8 cols");
  await page.setViewportSize({ width: 560, height: 1600 });
  await expect(page.locator(".sg-bp")).toHaveText("4 cols");
});

test("dragging a nested team member does not move the outer team widget", async ({ page }) => {
  const teamItem = page.locator(".snapgrid-item:has(.sg-teamgrid)");
  await teamItem.scrollIntoViewIfNeeded();
  const pos = () =>
    teamItem.evaluate((el) => ({
      left: (el as HTMLElement).style.left,
      top: (el as HTMLElement).style.top,
    }));
  const before = await pos();
  const member = teamItem.locator('.sg-teamgrid .snapgrid-item[data-grid-id="alex"] .sg-tm');
  const target = teamItem.locator('.sg-teamgrid .snapgrid-item[data-grid-id="sara"]');
  const mb = await member.boundingBox();
  const tb = await target.boundingBox();
  await page.mouse.move(mb!.x + mb!.width / 2, mb!.y + mb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(mb!.x + 8, mb!.y + 8, { steps: 3 });
  await page.mouse.move(tb!.x + tb!.width / 2, tb!.y + tb!.height / 2, { steps: 12 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await pos()).toEqual(before); // outer tile's absolute position is unchanged
});
