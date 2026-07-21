// Ambient type for `.svelte` imports in .ts/.tsx (the SvelteDemo islands).
// svelte-loader compiles them; the default export is a mountable Svelte component.
// NB: this file must NOT be named `svelte.d.ts` — TS would then resolve bare
// `import … from "svelte"` to it instead of the real package types.
declare module "*.svelte" {
  import type { Component } from "svelte";
  // biome-ignore lint/suspicious/noExplicitAny: props shape varies per demo component.
  const component: Component<Record<string, any>>;
  export default component;
}
