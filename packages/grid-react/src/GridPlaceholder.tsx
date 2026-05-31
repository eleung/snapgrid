import type { CSSProperties } from "react";
import { useGridPlaceholder } from "./hooks/useGridPlaceholder.js";

export interface GridPlaceholderProps {
  /** Appended to the default `snapgrid-placeholder` class. */
  className?: string;
  /** Merged over (and able to override) the default look. */
  style?: CSSProperties;
}

const DEFAULT_LOOK: CSSProperties = {
  background: "rgba(99, 102, 241, 0.2)",
  border: "1px dashed rgba(99, 102, 241, 0.6)",
  borderRadius: 4,
  boxSizing: "border-box",
  zIndex: 2,
  transition: "transform 150ms ease, width 150ms ease, height 150ms ease",
};

/**
 * Convenience placeholder rendered from {@link useGridPlaceholder}. Renders
 * nothing when no drag is active. For a custom placeholder, call the hook
 * directly and render your own element with the returned `style`.
 */
export function GridPlaceholder({ className, style }: GridPlaceholderProps) {
  const placeholder = useGridPlaceholder();
  if (!placeholder) return null;
  return (
    <div
      aria-hidden="true"
      className={className ? `snapgrid-placeholder ${className}` : "snapgrid-placeholder"}
      style={{ ...placeholder.style, ...DEFAULT_LOOK, ...style }}
    />
  );
}
