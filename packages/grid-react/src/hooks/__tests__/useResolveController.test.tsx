import { DragDropProvider } from "@dnd-kit/react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useResolveController } from "../useResolveController.js";

function Probe({ group }: { group: string }) {
  useResolveController(group);
  return null;
}

describe("useResolveController", () => {
  it("throws a helpful error when no grid is registered for the group", () => {
    // A manager exists (we're inside a provider) but no grid host registered this
    // group — the common "tile rendered outside its grid / bad group" mistake.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <DragDropProvider>
          <Probe group="missing" />
        </DragDropProvider>,
      ),
    ).toThrow(/no grid found for group "missing"/);
    spy.mockRestore();
  });
});
