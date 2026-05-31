// CI guard: fails if the committed OG card was rendered for a different
// major.minor than the current @snapgrid/react version. Keeps the social card's
// version pill from going stale on a release without putting image rendering in
// CI. Fix a failure by running `pnpm assets` and committing the result.
import { readFile } from "node:fs/promises";

const PKG = new URL("../../../packages/grid-react/package.json", import.meta.url);
const STAMP = new URL("../og.version", import.meta.url);

const { version } = JSON.parse(await readFile(PKG, "utf8"));
const expected = version.split(".").slice(0, 2).join(".");

let stamped;
try {
  stamped = (await readFile(STAMP, "utf8")).trim();
} catch {
  console.error("✗ apps/docs/og.version is missing — run `pnpm assets` and commit.");
  process.exit(1);
}

if (stamped !== expected) {
  console.error(
    `✗ OG card is stale: rendered for v${stamped}, but @snapgrid/react is ${version} (v${expected}).\n  Run \`pnpm assets\` and commit the refreshed og.png + og.version.`,
  );
  process.exit(1);
}

console.log(`✓ OG card is current (v${expected}).`);
