import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Preprocess `<script lang="ts">` in .svelte components for svelte-package /
// svelte-check. No other adapters — this is a component library, not an app.
export default {
  preprocess: vitePreprocess(),
};
