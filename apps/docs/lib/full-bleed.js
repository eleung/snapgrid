// Shared "full-bleed" page theme for the home + showcase routes: navbar only —
// no sidebar/toc/breadcrumb/pagination/copy-page/last-updated. The Nextra 4
// replacement for the removed theme:{ layout: "raw" }. Spread into each page's
// `_meta` theme so the home and showcase views can't silently diverge.
export const fullBleed = {
  layout: "full",
  sidebar: false,
  toc: false,
  breadcrumb: false,
  pagination: false,
  copyPage: false,
  timestamp: false,
};
