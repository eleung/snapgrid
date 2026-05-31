# Releasing

Maintainer runbook for cutting a snapgrid release. Contributors don't need this —
see [CONTRIBUTING.md](./CONTRIBUTING.md).

snapgrid publishes three packages from this monorepo, versioned with
[Changesets](https://github.com/changesets/changesets):

- `@snapgridjs/core`
- `@snapgridjs/react`
- `@snapgridjs/extras`

(`@snapgridjs/docs` is private and never published — it's in the changesets `ignore` list.)

## Normal release (the happy path)

1. **Add a changeset** describing the change (in the PR, or a follow-up):
   ```sh
   pnpm changeset
   ```
   Pick the affected packages and semver level, and write a human-readable summary — it
   becomes the changelog entry.
2. **Merge to `main`.** The [Release workflow](.github/workflows/release.yml) runs
   `changesets/action`, which opens (or updates) a **"Version Packages"** PR. That PR bumps
   versions, updates `CHANGELOG.md`, and consumes the changeset files.
3. **Merge the Version Packages PR.** On that merge the workflow runs `pnpm release`
   (`pnpm build && changeset publish`), which builds and publishes every package whose version
   isn't already on npm — in dependency order, with `workspace:*` rewritten to the real version.

That's the whole flow for a version bump of existing packages.

## How auth works — trusted publishing (OIDC)

The Release workflow publishes with **no token.** `pnpm publish` exchanges the workflow's GitHub
`id-token` for a short-lived registry credential
([trusted publishing](https://docs.npmjs.com/trusted-publishers/)), and provenance ("Built and
signed on GitHub Actions") is attached automatically.

Each `@snapgridjs/*` package is configured on npmjs.com (package → **Settings**) with:

- **Trusted Publisher** → GitHub Actions · repo `eleung/snapgrid` · workflow `release.yml` · action
  _Allow npm publish_.
- **Publishing access** → _Require two-factor authentication and disallow tokens_.

So the only ways to publish are this workflow (OIDC) or an interactive 2FA login from a maintainer's
machine — there is no long-lived `NPM_TOKEN` anywhere. Requirements, already met: Node ≥ 22.14 and a
pnpm with OIDC support (pinned here as `pnpm@10.30.3` via the root `packageManager` field).

## Manual release fallback

If CI is unavailable, publish from your machine — the interactive 2FA path is still allowed by the
"disallow tokens" policy. Bump versions first (`pnpm version-packages` to apply pending changesets,
or edit by hand), then:

```sh
npm login                                          # browser sign-in, approve 2FA
pnpm build
pnpm -r publish --access public --no-git-checks    # enter the OTP when prompted
```

Local publishes do **not** carry the provenance badge — only CI (OIDC) does — so prefer CI.

## Adding a NEW package

A brand-new package can't be released by CI until it exists, because the OIDC trusted publisher is
configured **per package** and npm enforces 2FA on writes (which CI can't satisfy interactively).
This is what made the v0.1.0 launch a manual first publish. To add one:

1. **Bootstrap locally** — `npm login`, then
   `pnpm --filter <new-pkg> publish --access public --no-git-checks` (enter the OTP). This creates
   the package on npm.
2. **Configure it like the others** — on npmjs.com, add the GitHub Actions **Trusted Publisher**
   (repo `eleung/snapgrid`, workflow `release.yml`, _Allow npm publish_) and set **Publishing access**
   to _Require 2FA and disallow tokens_.
3. From then on it releases through CI like the rest.

## Docs deploy separately

The documentation site deploys independently to **Cloudflare Pages** on every push to `main`
(see [apps/docs/README.md](./apps/docs/README.md)). It is not part of the package release.
