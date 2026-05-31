# Contributing to snapgrid

Thanks for your interest in improving snapgrid! This guide covers how to get set up and what we
look for in a change.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to
uphold it.

## Getting set up

snapgrid is a [pnpm](https://pnpm.io) workspace (Node ≥ 20).

```sh
git clone https://github.com/eleung/snapgrid.git
cd snapgrid
pnpm install
pnpm dev          # demo app at http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `pnpm test` | Vitest suite (non-watch). |
| `pnpm typecheck` | Type-check all packages. |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix. |
| `pnpm build` | Build all packages. |
| `pnpm validate` | All of the above — run before opening a PR. |
| `pnpm --filter @snapgridjs/docs dev` | Run the docs site locally. |

## Project layout

```
packages/
  grid-core    @snapgridjs/core    engine: geometry, move/resize, compaction, session
  grid-react   @snapgridjs/react   React components + hooks
  grid-extras  @snapgridjs/extras  extra packers (masonry, gravity, shelf)
apps/
  demo         kitchen-sink demo (Vite)
  docs         documentation site (Next.js + Nextra)
```

## Guidelines

- **Tests first.** New behaviour needs a test; bug fixes need a regression test. Never weaken a test
  to make it pass — fix the implementation.
- **Keep the engine seam.** Nothing outside `packages/grid-core/src/rgl.ts` should import
  `react-grid-layout` directly.
- **Match the surrounding style.** Biome enforces formatting/linting; run `pnpm lint:fix`.
- **Small, focused PRs** are easier to review and land faster.
- **`pnpm validate` must pass** (typecheck, lint, test, build) before review.

## Commit & PR

1. Branch off `main`.
2. Make your change with tests.
3. Run `pnpm validate`.
4. Open a PR using the template — describe the change, link any issue, and note breaking changes.

## Reporting bugs

Open an issue with the **Bug report** template. A minimal reproduction (CodeSandbox/StackBlitz or a
small repo) gets it fixed far faster.

## Adding a compactor

New packing styles belong in `@snapgridjs/extras`. Implement the `Compactor` interface, add a test in
`packages/grid-extras/src/__tests__`, and document it in `apps/docs`.
