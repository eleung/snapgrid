import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";

// Nextra 4 requires this file at the project root. It replaces the `components`
// option from the old theme.config: merge the docs-theme MDX components
// (Callout, Tabs, Steps, code blocks, the page `wrapper`, …) with any per-page
// overrides the catch-all route passes in.
const docsComponents = getDocsMDXComponents();

export function useMDXComponents(components?: Record<string, unknown>) {
  return {
    ...docsComponents,
    ...components,
  };
}
