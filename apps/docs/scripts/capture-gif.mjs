// Records the cross-grid drag from the live /examples page to a webm, for the
// README hero GIF. Run with the docs dev server up (`pnpm dev`), then convert:
//
//   node apps/docs/scripts/capture-gif.mjs
//   ffmpeg ... (see scripts output)
//
// Outputs the video path and the demo's crop box (x y w h) on stdout.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const VIEWPORT = { width: 1200, height: 760 };
const OUT_DIR = process.env.OUT_DIR ?? "/tmp/snapgrid-cap";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
});
const page = await context.newPage();

await page.goto(`${BASE}/react/examples/`);
await page.waitForSelector(".snapgrid-item");
await page.waitForTimeout(600);

const demo = page.locator(".dg-demo", { has: page.getByText(/grid a/i) });
await demo.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

const subA = demo.locator(".dg-subgrid", { has: page.getByText(/grid a/i) });
const subB = demo.locator(".dg-subgrid", { has: page.getByText(/grid b/i) });
const source = subA.locator(".snapgrid > .snapgrid-item").first();
const destGrid = subB.locator(".snapgrid");

const from = await source.boundingBox();
const dest = await destGrid.boundingBox();
const box = await demo.boundingBox();

// A slow, smooth drag that reads well as a loop: pick up, glide across, settle.
const fx = from.x + from.width / 2;
const fy = from.y + from.height / 2;
const dx = dest.x + dest.width / 2;
const dy = dest.y + dest.height / 2;

// Move the pointer in a real-time eased loop (one move + a frame delay each
// step) so the recorded motion is a smooth glide, not an instant teleport —
// Playwright's built-in `{ steps }` interpolates within a single synchronous
// call and reads as a jump on video.
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const glide = async (ax, ay, bx, by, frames, frameMs) => {
  for (let k = 1; k <= frames; k++) {
    const t = easeInOut(k / frames);
    await page.mouse.move(ax + (bx - ax) * t, ay + (by - ay) * t);
    await page.waitForTimeout(frameMs);
  }
};

await page.waitForTimeout(500);
await page.mouse.move(fx, fy);
await page.mouse.down();
await page.waitForTimeout(450); // beat on pickup
await glide(fx, fy, fx + 18, fy - 12, 8, 18); // lift
await glide(fx + 18, fy - 12, dx, dy, 52, 18); // glide across into grid B
await glide(dx, dy, dx + 6, dy + 5, 6, 18); // settle
await glide(dx + 6, dy + 5, dx, dy, 6, 18);
await page.waitForTimeout(500); // beat before drop
await page.mouse.up();
await page.waitForTimeout(1000); // hold on the result

const video = page.video();
await context.close();
const path = await video.path();
await browser.close();

const pad = 8;
const x = Math.max(0, Math.round(box.x - pad));
const y = Math.max(0, Math.round(box.y - pad));
const w = Math.min(VIEWPORT.width - x, Math.round(box.width + pad * 2));
const h = Math.min(VIEWPORT.height - y, Math.round(box.height + pad * 2));
console.log(`VIDEO ${path}`);
console.log(`CROP ${w} ${h} ${x} ${y}`);
