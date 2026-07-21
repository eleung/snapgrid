"use client";

import { FRAMEWORKS, useFramework } from "./FrameworkProvider";

/**
 * Compact segmented control in the navbar logo node: pick the binding whose docs +
 * examples you're reading. Unavailable bindings render disabled ("soon") until
 * their docs ship. On a framework page, switching hops to the equivalent page.
 */
export function FrameworkSwitcher() {
  const { framework, select } = useFramework();
  return (
    // biome-ignore lint/a11y/useSemanticElements: labelled navbar toggle-button group; <fieldset> is for form-field grouping and is inappropriate here.
    <span className="dg-fw" role="group" aria-label="Framework">
      {FRAMEWORKS.map((f) => (
        <button
          key={f.id}
          type="button"
          className="dg-fw__opt"
          data-active={f.id === framework || undefined}
          aria-pressed={f.id === framework}
          disabled={!f.available}
          title={f.available ? `${f.label} docs & examples` : `${f.label} — coming soon`}
          onClick={() => f.available && select(f.id)}
        >
          {f.label}
          {!f.available && <span className="dg-fw__soon">soon</span>}
        </button>
      ))}
    </span>
  );
}
