// Renders the snapgrid wordmark (2x2 orange mark + Fraunces "snapgrid") to two
// transparent PNGs — a light-mode and a dark-mode variant — for the README's
// theme-adaptive <picture>. Matches the docs logo (.dg-logo) and brand fonts.
//
//   node apps/docs/scripts/wordmark.mjs
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Repo-root media/, resolved relative to this script so it runs from any CWD.
const MEDIA = fileURLToPath(new URL("../../../media", import.meta.url));

// word = wordmark text color; accent = mark color (brand orange per theme).
const VARIANTS = [
  { out: `${MEDIA}/snapgrid-wordmark.png`, word: "#1c1a17", accent: "#c2410c" },
  { out: `${MEDIA}/snapgrid-wordmark-dark.png`, word: "#faf8f4", accent: "#ea7a47" },
];

const template = (word, accent) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; }
  .logo { display: inline-flex; align-items: center; gap: 20px; padding: 26px 30px; }
  .mark {
    display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
    gap: 6px; width: 56px; height: 56px;
  }
  .mark span { background: ${accent}; border-radius: 7px; opacity: .9; }
  .mark span:nth-child(2) { opacity: .4; }
  .mark span:nth-child(3) { opacity: .55; }
  .word {
    font-family: "Fraunces", ui-serif, Georgia, serif; font-weight: 600;
    font-size: 68px; letter-spacing: -1.2px; line-height: 1; color: ${word};
  }
</style></head><body>
  <div class="logo" id="logo">
    <div class="mark"><span></span><span></span><span></span><span></span></div>
    <div class="word">snapgrid</div>
  </div>
</body></html>`;

await mkdir(MEDIA, { recursive: true });
const browser = await chromium.launch();
for (const v of VARIANTS) {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.setContent(template(v.word, v.accent), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#logo").screenshot({ path: v.out, omitBackground: true });
  await page.close();
  console.log(`wrote ${v.out}`);
}
await browser.close();
