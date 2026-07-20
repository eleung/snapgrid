// Renders the GitHub repository social-preview card to media/github-social.png.
// This is the image you upload under the repo's Settings → Social preview; it's
// what unfurls when github.com/eleung/snapgrid is shared on Twitter/Slack/etc.
//
// GitHub displays the social preview at 1280x640 (2:1) and crops the very edges
// on some surfaces, so all content is kept inside a 40px safe border (drawn as a
// matte frame). Self-contained like og-image.mjs: renders an inline HTML/CSS
// template in headless Chromium at 2x, then downscales to 1280x640 with ffmpeg.
//
// Unlike the OG card, this one PULLS LIVE GITHUB CONTEXT (`gh repo view`): the
// owner/repo slug, visibility, license, primary language, and repo URL all come
// from the actual repository, with a `git remote` → hardcoded fallback so it
// still renders offline or without the gh CLI installed.
//
//   node apps/docs/scripts/github-social.mjs
import { execFile, execFileSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const W = 1280;
const H = 640;
const SAFE = 40; // GitHub crops the edges — keep all content inside this border.
const TMP = "/tmp/snapgrid-github-social@2x.png";
// Resolved relative to this script so it runs from any CWD (root or apps/docs).
// Lives in media/ next to the wordmarks + cross-grid gif (repo/README assets),
// not public/ (which is site-served) — this PNG is uploaded to GitHub by hand.
const OUT = fileURLToPath(new URL("../../../media/github-social.png", import.meta.url));
const PKG = new URL("../../../packages/grid-react/package.json", import.meta.url);

// Version pill tracks the published @snapgridjs/react version (major.minor) — the
// same source the docs header and OG card read. Re-run on a release bump.
const { version } = JSON.parse(await readFile(PKG, "utf8"));
const VER = `v${version.split(".").slice(0, 2).join(".")}`;

// The size chip reads the same generated bundle-size source the docs + OG card
// use, so it can't drift from the hero/migration figures (snapgrid's brotli size).
const BUNDLE = new URL("../components/generated/bundle-size.ts", import.meta.url);
const SNAPGRID_KB = (await readFile(BUNDLE, "utf8")).match(/snapgrid:\s*(\d+)/)?.[1] ?? "";

// --- Pull live GitHub context, with graceful fallbacks -----------------------
// Prefer the gh CLI (authoritative: visibility, license, language). Fall back to
// parsing the git remote, then to hardcoded defaults. Never hard-fails.
function ghContext() {
  try {
    const json = execFileSync(
      "gh",
      [
        "repo",
        "view",
        "--json",
        "nameWithOwner,visibility,licenseInfo,primaryLanguage,url,description",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const r = JSON.parse(json);
    return {
      slug: r.nameWithOwner,
      visibility: r.visibility,
      license: r.licenseInfo?.nickname || r.licenseInfo?.key?.toUpperCase() || r.licenseInfo?.name,
      language: r.primaryLanguage?.name,
      url: r.url,
      description: r.description,
    };
  } catch {
    // gh missing / not authed / offline — derive the slug from the git remote.
    try {
      const remote = execFileSync("git", ["remote", "get-url", "origin"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      const slug = remote
        .replace(/^git@[^:]+:/, "")
        .replace(/^https?:\/\/[^/]+\//, "")
        .replace(/\.git$/, "");
      if (slug) return { slug };
    } catch {
      /* fall through to defaults */
    }
    return {};
  }
}

const gh = ghContext();
const SLUG = gh.slug ?? "eleung/snapgrid";
const [OWNER, REPO] = SLUG.split("/");
const VISIBILITY = (gh.visibility ?? "PUBLIC").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const LICENSE = gh.license ?? "MIT";
const LANGUAGE = gh.language ?? "TypeScript";
const REPO_URL = (gh.url ?? `https://github.com/${SLUG}`).replace(/^https?:\/\//, "");

// GitHub Linguist-ish dot colors so the language chip reads as authentic.
const LANG_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Rust: "#dea584",
  Go: "#00add8",
};
const LANG_DOT = LANG_COLORS[LANGUAGE] ?? "#c2410c";

// Octicons (16px viewBox), inlined so there's no network/file dependency.
const OCTI = {
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  law: "M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.006.005-.01.01-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.014-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.984V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z",
  github:
    "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z",
};
const icon = (name, size = 18) =>
  `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${OCTI[name]}"/></svg>`;

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
  /* full-bleed warm paper + dotted grid (brand background, runs to the edges) */
  .canvas {
    width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background-color: var(--paper);
    background-image: radial-gradient(circle, #e6dfd4 1.4px, transparent 1.4px);
    background-size: 30px 30px;
  }
  .canvas::before { /* warm accent glow, top-right */
    content: ""; position: absolute; top: -200px; right: -180px; width: 620px; height: 620px;
    background: radial-gradient(circle, rgba(194,65,12,.13), transparent 62%);
  }
  /* matte safe-border: all content lives inside this 40px inset frame */
  .frame {
    position: absolute; inset: ${SAFE}px; border: 1px solid var(--line); border-radius: 30px;
    padding: 44px 52px; display: flex; flex-direction: column; z-index: 1;
  }

  /* row 1 — GitHub repo header (live context) on the left, brand lockup right */
  .top { display: flex; align-items: center; justify-content: space-between; }
  .repo { display: flex; align-items: center; gap: 12px; }
  .repo .octi { color: var(--muted); display: flex; }
  .repo .slug { font-size: 26px; font-weight: 500; letter-spacing: -.2px; }
  .repo .slug .owner { color: var(--muted); }
  .repo .slug .sep { color: var(--muted); margin: 0 2px; }
  .repo .slug .name { color: var(--ink); font-weight: 700; }
  .pill {
    font-size: 14px; font-weight: 600; color: var(--muted);
    border: 1px solid var(--line); padding: 3px 12px; border-radius: 999px; background: #fff;
  }
  .brand { display: flex; align-items: center; gap: 13px; }
  .mark {
    width: 40px; height: 40px; display: grid; grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr; gap: 4px;
  }
  .mark span { border-radius: 5px; background: var(--accent); opacity: .9; }
  .mark span:nth-child(2) { opacity: .4; }
  .mark span:nth-child(3) { opacity: .55; }
  .brand b { font-family: "Fraunces", ui-serif, Georgia, serif; font-size: 31px; font-weight: 600; letter-spacing: -.5px; }
  .ver {
    font-size: 15px; font-weight: 700; color: var(--accent);
    background: var(--accent-soft); border: 1px solid var(--accent-line);
    padding: 3px 10px; border-radius: 999px;
  }

  /* row 2 — hero copy (left) + cross-grid illustration (right) */
  .body { flex: 1; display: flex; align-items: center; gap: 48px; }
  .main { flex: 1; }
  h1 {
    font-family: "Fraunces", ui-serif, Georgia, serif;
    font-size: 56px; line-height: 1.08; font-weight: 600; letter-spacing: -1px; max-width: 640px;
  }
  h1 em { color: var(--accent); font-style: normal; }
  .sub {
    margin-top: 20px; font-size: 22px; line-height: 1.4; color: var(--muted);
    font-weight: 500; max-width: 600px; text-wrap: balance;
  }
  .chips { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 9px; }
  .chip {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 16px; font-weight: 600; color: var(--ink);
    background: #fff; border: 1px solid var(--line); padding: 7px 13px; border-radius: 999px;
  }
  .chip.accent { color: var(--accent); background: var(--accent-soft); border-color: var(--accent-line); }
  .chip .langdot { width: 11px; height: 11px; border-radius: 999px; background: ${LANG_DOT}; }
  .chip .octi { color: var(--muted); display: flex; }

  /* cross-grid illustration — the product's signature motif */
  .art { width: 372px; flex: none; display: flex; flex-direction: column; gap: 26px; }
  .grid {
    position: relative; height: 150px; border-radius: 20px; background: #fff;
    border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(28,26,23,.06);
    background-image: radial-gradient(circle, #e9e2d8 1.3px, transparent 1.3px);
    background-size: 22px 22px; background-position: 14px 36px; padding: 36px 18px 18px;
  }
  .glabel { position: absolute; top: 13px; left: 18px; font-size: 12px; font-weight: 800; letter-spacing: 1px; color: var(--muted); }
  .t { position: absolute; border-radius: 11px; background: #f3eee6; border: 1px solid var(--line); }
  .g1 .t1 { left: 18px; top: 40px; width: 150px; height: 44px; }
  .g1 .t2 { left: 180px; top: 40px; width: 174px; height: 92px; }
  .g1 .t3 { left: 18px; top: 92px; width: 150px; height: 40px; }
  .g2 .t1 { left: 18px; top: 40px; width: 96px; height: 92px; }
  .g2 .t2 { left: 126px; top: 40px; width: 96px; height: 44px; }
  .g2 .t3 { left: 126px; top: 92px; width: 228px; height: 40px; opacity: .55; border-style: dashed; }
  /* floating tile being dragged between the two grids */
  .float {
    position: absolute; right: 14px; top: 122px; width: 180px; height: 80px;
    border-radius: 13px; background: #fff; border: 2px solid var(--accent);
    box-shadow: 0 22px 44px rgba(28,26,23,.22); transform: rotate(-4deg);
    display: flex; align-items: center; gap: 12px; padding: 0 18px; z-index: 3;
  }
  .float .dot { width: 13px; height: 13px; border-radius: 999px; background: var(--accent); }
  .float .bars { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .float .bars i { height: 9px; border-radius: 5px; background: #ece6dd; display: block; }
  .float .bars i:first-child { width: 70%; background: var(--accent-soft); }

  /* row 3 — install command + repo url */
  .foot { display: flex; align-items: center; gap: 18px; }
  .foot .cmd {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px;
    background: var(--ink); color: #faf8f4; padding: 11px 17px; border-radius: 10px; font-weight: 600;
  }
  .foot .url { color: var(--muted); font-weight: 600; font-size: 19px; display: inline-flex; align-items: center; gap: 9px; }
  .foot .url .octi { display: flex; }
</style></head><body>
  <div class="canvas">
    <div class="frame">
      <div class="top">
        <div class="repo">
          <span class="octi">${icon("repo", 26)}</span>
          <span class="slug"><span class="owner">${OWNER}</span><span class="sep">/</span><span class="name">${REPO}</span></span>
          <span class="pill">${VISIBILITY}</span>
        </div>
        <div class="brand">
          <div class="mark"><span></span><span></span><span></span><span></span></div>
          <b>snapgrid</b>
          <span class="ver">${VER}</span>
        </div>
      </div>

      <div class="body">
        <div class="main">
          <h1>Draggable grid layouts<br>that drag <em>between</em> grids.</h1>
          <div class="sub">A react-grid-layout v2 alternative for React &amp; Svelte, built on dnd-kit — headless-first, keyboard-accessible.</div>
          <div class="chips">
            <span class="chip"><span class="langdot"></span>${LANGUAGE}</span>
            <span class="chip"><span class="octi">${icon("law", 16)}</span>${LICENSE}</span>
            <span class="chip accent">React · Svelte</span>
            <span class="chip">~${SNAPGRID_KB} kB core</span>
            <span class="chip">Cross-grid</span>
            <span class="chip">Nested grids</span>
          </div>
        </div>
        <div class="art">
          <div class="grid g1"><span class="glabel">GRID A</span><div class="t t1"></div><div class="t t2"></div><div class="t t3"></div></div>
          <div class="grid g2"><span class="glabel">GRID B</span><div class="t t1"></div><div class="t t2"></div><div class="t t3"></div></div>
          <div class="float"><span class="dot"></span><div class="bars"><i></i><i></i></div></div>
        </div>
      </div>

      <div class="foot">
        <span class="cmd">pnpm add @snapgridjs/react</span>
        <span class="url"><span class="octi">${icon("github", 18)}</span>${REPO_URL}</span>
      </div>
    </div>
  </div>
</body></html>`;

await mkdir(fileURLToPath(new URL("../../../media", import.meta.url)), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: TMP, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

// Downscale the 2x capture to a crisp, canonical 1280x640.
await promisify(execFile)("ffmpeg", ["-y", "-i", TMP, "-vf", `scale=${W}:${H}:flags=lanczos`, OUT]);
console.log(`wrote ${OUT} (${SLUG} ${VER}, ${LICENSE}, ${LANGUAGE})`);
