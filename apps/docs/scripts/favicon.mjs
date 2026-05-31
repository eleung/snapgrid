// Generates the favicon set from the brand mark (the 2x2 orange logo squares):
//   public/favicon.svg          — primary, crisp at any size, theme-agnostic
//   public/favicon-32x32.png    — PNG fallback for browsers without SVG favicons
//   public/apple-touch-icon.png — 180x180 opaque tile for iOS home screens
// Self-contained: inline SVG -> headless Chromium (supersampled) -> ffmpeg downscale.
//
//   node apps/docs/scripts/favicon.mjs
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const run = promisify(execFile);
const PUBLIC = fileURLToPath(new URL("../public", import.meta.url));
const ACCENT = "#c2410c";
const PAPER = "#faf8f4";

// The mark: a 2x2 grid of orange squares at the same opacities as the docs logo
// (.dg-logo__mark) and the wordmark — TL .9, TR .4, BL .55, BR .9.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="3" y="3" width="12" height="12" rx="3" fill="${ACCENT}" opacity=".9"/>
  <rect x="17" y="3" width="12" height="12" rx="3" fill="${ACCENT}" opacity=".4"/>
  <rect x="3" y="17" width="12" height="12" rx="3" fill="${ACCENT}" opacity=".55"/>
  <rect x="17" y="17" width="12" height="12" rx="3" fill="${ACCENT}" opacity=".9"/>
</svg>`;

await mkdir(PUBLIC, { recursive: true });
await writeFile(`${PUBLIC}/favicon.svg`, `${SVG}\n`);

const browser = await chromium.launch();

// Render the mark (optionally on an opaque bg) at 4x, then downscale to `size`.
async function png(name, size, inset, bg) {
  const ss = size * 4;
  const pad = Math.round(ss * inset);
  const page = await browser.newPage({ viewport: { width: ss, height: ss } });
  await page.setContent(
    `<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${ss}px;height:${ss}px}body{display:flex;align-items:center;justify-content:center;${bg ? `background:${bg};` : ""}}svg{width:${ss - pad * 2}px;height:${ss - pad * 2}px}</style>${SVG}`,
  );
  const tmp = `/tmp/snapgrid-${name}`;
  await page.screenshot({
    path: tmp,
    omitBackground: !bg,
    clip: { x: 0, y: 0, width: ss, height: ss },
  });
  await page.close();
  await run("ffmpeg", [
    "-y",
    "-i",
    tmp,
    "-vf",
    `scale=${size}:${size}:flags=lanczos`,
    `${PUBLIC}/${name}`,
  ]);
  console.log(`wrote public/${name}`);
}

await png("favicon-32x32.png", 32, 0.06, null); // transparent — composites on the tab
await png("apple-touch-icon.png", 180, 0.22, PAPER); // opaque — iOS applies its own rounding
await browser.close();
console.log("wrote public/favicon.svg");
