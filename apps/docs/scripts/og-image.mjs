// Renders the Open Graph / social-share card to apps/docs/public/og.png.
// Self-contained (no dev server needed): renders an inline HTML/CSS template in
// headless Chromium at 2x, then downscales to the canonical 1200x630 with ffmpeg.
//
//   node apps/docs/scripts/og-image.mjs
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const W = 1200;
const H = 630;
const TMP = "/tmp/snapgrid-og@2x.png";
// Resolved relative to this script so it runs from any CWD (root or apps/docs).
const OUT = fileURLToPath(new URL("../public/og.png", import.meta.url));
const PKG = new URL("../../../packages/grid-react/package.json", import.meta.url);
// Committed sidecar recording the major.minor this card was rendered for; the
// `check:og` guard fails CI if it drifts from the package version (see scripts).
const STAMP = fileURLToPath(new URL("../og.version", import.meta.url));

// Version pill tracks the published @snapgrid/react version (major.minor) — the
// same source the docs header reads, so a release bump + rerun updates the card.
const { version } = JSON.parse(await readFile(PKG, "utf8"));
const MM = version.split(".").slice(0, 2).join(".");
const VER = `v${MM}`;

// The size chip reads the same generated bundle-size source the docs use, so it
// can't drift from the hero/migration figures (snapgrid's own brotli size).
const BUNDLE = new URL("../components/generated/bundle-size.ts", import.meta.url);
const SNAPGRID_KB = (await readFile(BUNDLE, "utf8")).match(/snapgrid:\s*(\d+)/)?.[1] ?? "";

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --paper: #faf8f4; --ink: #1c1a17; --muted: #79706a; --accent: #c2410c;
    --accent-soft: #fdecdf; --accent-line: #f0c7ad; --line: #e9e2d8; --tile: #fff;
  }
  html, body { width: ${W}px; height: ${H}px; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink); background: var(--paper);
  }
  .og {
    width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    display: flex; padding: 68px 76px 60px; gap: 40px;
    background-color: var(--paper);
    background-image: radial-gradient(circle, #e6dfd4 1.4px, transparent 1.4px);
    background-size: 30px 30px;
  }
  .og::before { /* warm accent glow, top-right */
    content: ""; position: absolute; top: -180px; right: -160px; width: 560px; height: 560px;
    background: radial-gradient(circle, rgba(194,65,12,.12), transparent 62%);
  }
  .main { flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .mark {
    width: 46px; height: 46px; display: grid; grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr; gap: 5px;
  }
  .mark span { border-radius: 6px; background: var(--accent); opacity: .9; }
  .mark span:nth-child(2) { opacity: .4; }
  .mark span:nth-child(3) { opacity: .55; }
  .brand b { font-family: "Fraunces", ui-serif, Georgia, serif; font-size: 35px; font-weight: 600; letter-spacing: -.5px; }
  .ver {
    font-size: 17px; font-weight: 700; color: var(--accent);
    background: var(--accent-soft); border: 1px solid var(--accent-line);
    padding: 3px 11px; border-radius: 999px;
  }
  h1 {
    font-family: "Fraunces", ui-serif, Georgia, serif;
    margin-top: 40px; font-size: 58px; line-height: 1.1; font-weight: 600;
    letter-spacing: -1px; max-width: 820px;
  }
  h1 em { color: var(--accent); font-style: normal; }
  .sub {
    margin-top: 22px; font-size: 23px; line-height: 1.34; color: var(--muted);
    font-weight: 500; max-width: 600px; text-wrap: balance;
  }
  .chips { margin-top: auto; display: flex; flex-wrap: wrap; gap: 10px; }
  .chip {
    font-size: 17px; font-weight: 600; color: var(--ink);
    background: #fff; border: 1px solid var(--line); padding: 8px 14px; border-radius: 999px;
  }
  .chip.accent { color: var(--accent); background: var(--accent-soft); border-color: var(--accent-line); }
  .foot {
    margin-top: 30px; display: flex; align-items: center; gap: 18px; font-size: 20px;
  }
  .foot .cmd {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px;
    background: var(--ink); color: #faf8f4; padding: 10px 16px; border-radius: 10px; font-weight: 600;
  }
  .foot .url { color: var(--muted); font-weight: 600; }

  /* cross-grid illustration */
  .art { width: 366px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 30px; justify-content: center; }
  .grid {
    position: relative; height: 188px; border-radius: 20px; background: #fff;
    border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(28,26,23,.06);
    background-image: radial-gradient(circle, #e9e2d8 1.3px, transparent 1.3px);
    background-size: 22px 22px; background-position: 14px 36px; padding: 36px 18px 18px;
  }
  .glabel { position: absolute; top: 13px; left: 18px; font-size: 13px; font-weight: 800; letter-spacing: 1px; color: var(--muted); }
  .t { position: absolute; border-radius: 11px; background: #f3eee6; border: 1px solid var(--line); }
  .g1 .t1 { left: 18px; top: 40px; width: 150px; height: 60px; }
  .g1 .t2 { left: 180px; top: 40px; width: 168px; height: 130px; }
  .g1 .t3 { left: 18px; top: 110px; width: 150px; height: 60px; }
  .g2 .t1 { left: 18px; top: 40px; width: 96px; height: 130px; }
  .g2 .t2 { left: 126px; top: 40px; width: 96px; height: 60px; }
  .g2 .t3 { left: 126px; top: 110px; width: 222px; height: 60px; opacity: .55; border-style: dashed; }
  /* floating tile being dragged between the two grids */
  .float {
    position: absolute; right: 16px; top: 150px; width: 176px; height: 96px;
    border-radius: 13px; background: #fff; border: 2px solid var(--accent);
    box-shadow: 0 22px 44px rgba(28,26,23,.22); transform: rotate(-4deg);
    display: flex; align-items: center; gap: 12px; padding: 0 18px; z-index: 3;
  }
  .float .dot { width: 13px; height: 13px; border-radius: 999px; background: var(--accent); }
  .float .bars { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .float .bars i { height: 9px; border-radius: 5px; background: #ece6dd; display: block; }
  .float .bars i:first-child { width: 70%; background: var(--accent-soft); }
</style></head><body>
  <div class="og">
    <div class="main">
      <div class="brand">
        <div class="mark"><span></span><span></span><span></span><span></span></div>
        <b>snapgrid</b>
        <span class="ver">${VER}</span>
      </div>
      <h1>Draggable grid layouts<br>that drag <em>between</em> grids.</h1>
      <div class="sub">A react-grid-layout v2 alternative, built on dnd-kit. Controlled, headless-first, keyboard-accessible.</div>
      <div class="chips">
        <span class="chip accent">Cross-grid</span>
        <span class="chip">Nested grids</span>
        <span class="chip">Keyboard a11y</span>
        <span class="chip">Headless</span>
        <span class="chip">~${SNAPGRID_KB} kB</span>
      </div>
      <div class="foot">
        <span class="cmd">pnpm add @snapgrid/react</span>
        <span class="url">snapgrid.dev</span>
      </div>
    </div>
    <div class="art">
      <div class="grid g1"><span class="glabel">GRID A</span><div class="t t1"></div><div class="t t2"></div><div class="t t3"></div></div>
      <div class="grid g2"><span class="glabel">GRID B</span><div class="t t1"></div><div class="t t2"></div><div class="t t3"></div></div>
      <div class="float"><span class="dot"></span><div class="bars"><i></i><i></i></div></div>
    </div>
  </div>
</body></html>`;

await mkdir(fileURLToPath(new URL("../public", import.meta.url)), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: TMP, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

// Downscale the 2x capture to a crisp, canonical 1200x630.
await promisify(execFile)("ffmpeg", ["-y", "-i", TMP, "-vf", `scale=${W}:${H}:flags=lanczos`, OUT]);
await writeFile(STAMP, `${MM}\n`);
console.log(`wrote ${OUT} (${VER})`);
