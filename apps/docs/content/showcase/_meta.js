// The three showcase views are their own routes (own URL + SEO), all full-bleed
// (navbar only, no sidebar/toc/breadcrumb). They're navigated via the in-page tab
// bar AND listed in the mobile nav menu (the tab bar is hidden behind the
// hamburger on small screens), so all three stay visible in nav listings.
import { fullBleed } from "../../lib/full-bleed.js";

const view = { theme: fullBleed };

export default {
  index: { title: "Dashboard", ...view },
  performance: { title: "Performance", ...view },
  gallery: { title: "Gallery", ...view },
};
