// Warm the routes the specs drive BEFORE the parallel workers start. `next dev`
// compiles pages on first request; with the Svelte pages added, a cold compile can
// take long enough that timing-sensitive drag tests time out when many workers hit
// different (uncompiled) pages at once. Fetching each route here forces those
// compiles to happen once, up front, so every test hits a warm page.
async function globalSetup() {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const routes = ["/showcase/", "/react/examples/", "/svelte/examples/"];
  await Promise.all(
    routes.map((r) =>
      fetch(base + r).catch(() => {
        /* the webServer is already up (Playwright waited on it); ignore transient misses */
      }),
    ),
  );
}

export default globalSetup;
