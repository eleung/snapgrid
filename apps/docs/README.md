# @snapgridjs/docs

Documentation site for SnapGrid, built with [Nextra 4](https://nextra.site) on
Next.js 15 / React 19. Search is powered by [Pagefind](https://pagefind.app)
over the static export.

## Local development

```bash
pnpm dev   # from the repo root (alias for: pnpm --filter @snapgridjs/docs dev)
```

The site is a fully static export (`output: "export"` → `apps/docs/out`); there
is no server runtime.

## Deployment — Cloudflare Pages

The site deploys to **Cloudflare Pages** from `main`. Project settings:

| Setting                  | Value                              |
| ------------------------ | ---------------------------------- |
| Production branch        | `main`                             |
| Root directory           | _(repo root — leave empty)_        |
| Build command            | `pnpm build`                       |
| Build output directory   | `apps/docs/out`                    |
| `NODE_VERSION` (env var) | `22`                               |

Notes:

- The build must run from the **repo root** so the workspace packages
  (`@snapgridjs/core`, `@snapgridjs/react`, `@snapgridjs/extras`) build first.
  `pnpm build` (`pnpm -r build`) handles the topological order and runs the
  Pagefind index as a `postbuild` step.
- pnpm is pinned via the root `package.json` `packageManager` field, so
  Cloudflare's corepack resolves the correct version automatically.
- Served from the `snapgrid.dev` apex, so `basePath` is empty. To host under a
  subpath instead (e.g. a project site), set `DOCS_BASE_PATH=/subpath`.
- Pushes to `main` deploy production; pull requests get automatic preview
  deployments.
