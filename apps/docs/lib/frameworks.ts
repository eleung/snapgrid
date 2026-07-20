// The framework bindings the docs cover, and which have shipped. Single source of
// truth shared by the client switcher/state (FrameworkProvider) and the server-side
// SEO gate (page.tsx), so the two can't drift when a binding is added.
export const FRAMEWORKS = [
  { id: "react", label: "React", available: true },
  { id: "svelte", label: "Svelte", available: true },
] as const;

export type Framework = (typeof FRAMEWORKS)[number]["id"];

export const FRAMEWORK_IDS = FRAMEWORKS.map((f) => f.id) as Framework[];
