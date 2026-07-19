// Top navbar order + per-page layout. `index` (home) and `showcase/*` are
// full-bleed (navbar only — no sidebar/toc/breadcrumb), the Nextra 4 replacement
// for the removed theme:{ layout:"raw" }. Home is hidden from the nav (reached
// via the logo); the rest are top-nav pages.
//
// Framework split: docs + examples live under per-framework folders (react/,
// svelte/…) so a grid's guides can differ per binding. Those folders are hidden
// from the nav; the framework-aware "Documentation"/"Examples" links + switcher
// are supplied by the custom navbar (see app/(site)/layout.tsx + FrameworkNav).
// showcase/roadmap/changelog are framework-agnostic and stay unprefixed.
import { fullBleed } from "../lib/full-bleed.js";

export default {
  index: { display: "hidden", theme: fullBleed },
  react: { title: "React", type: "page" },
  showcase: { title: "Showcase", type: "page" },
  roadmap: { title: "Roadmap", type: "page" },
  changelog: { title: "Changelog", type: "page" },
};
