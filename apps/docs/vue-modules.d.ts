// Ambient type for `.vue` imports in .ts/.tsx (the VueDemo islands).
// vue-loader compiles them; the default export is a mountable Vue component.
// NB: this file must NOT be named `vue.d.ts` — TS would then resolve bare
// `import … from "vue"` to it instead of the real package types.
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // biome-ignore lint/suspicious/noExplicitAny: props shape varies per demo component.
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>;
  export default component;
}
