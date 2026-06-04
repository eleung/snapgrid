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

### CI on the Version Packages PR (the `CHANGESETS_TOKEN` PAT)

The changesets action authenticates with a **Personal Access Token** stored as the repo secret
`CHANGESETS_TOKEN`, not the default `GITHUB_TOKEN`. This is deliberate: GitHub suppresses workflow runs
for any push or PR made with `GITHUB_TOKEN`, so a Version Packages PR opened that way would never run its
required `validate` check and could not be merged without a manual nudge. The PAT identity makes that
PR's CI run normally.

The token is a fine-grained PAT scoped to this repo with **Contents: read/write** and **Pull requests:
read/write**. It expires — the current one on **2026-09-02 (Wed, Sep 2 2026)**. When it lapses the
release job fails to open/update the PR; regenerate it, run `gh secret set CHANGESETS_TOKEN`, and update
that date here. npm publishing itself does **not** use this token (that's OIDC, below), so a
missing/expired PAT blocks the version PR but never the publish.

### Brand cards (OG + social)

The "Version Packages" PR also re-renders the social cards so their version pill tracks the bump:
`version-packages` runs `pnpm --filter @snapgridjs/docs cards`, regenerating `apps/docs/public/og.png`
(+ `og.version`, which the `check:og` CI guard enforces) and `media/github-social.png`. The OG card
is site-served, so merging the PR redeploys the docs and the **live** card updates automatically.

`media/github-social.png` is the one residual manual step: GitHub's repo **Settings → Social preview**
is a web-UI upload with no API, so on a **minor/major** bump re-upload the freshly-committed file there.
(Patch bumps keep the same `vX.Y` pill — no re-render or re-upload needed.)

## How auth works — trusted publishing (OIDC)

The Release workflow publishes with **no npm token.** `npm` (≥ 11.5.1, installed by the workflow)
exchanges the workflow's GitHub `id-token` for a short-lived registry credential
([trusted publishing](https://docs.npmjs.com/trusted-publishers/)), and provenance ("Built and
signed on GitHub Actions") is attached automatically.

Each `@snapgridjs/*` package is configured on npmjs.com (package → **Settings**) with:

- **Trusted Publisher** → GitHub Actions · repo `eleung/snapgrid` · workflow `release.yml` · action
  _Allow npm publish_.
- **Publishing access** → _Require two-factor authentication and disallow tokens_.

So the only ways to publish are this workflow (OIDC) or an interactive 2FA login from a maintainer's
machine — there is no long-lived `NPM_TOKEN` anywhere.

The catch: `changeset publish` runs the actual publish through **`npm`**, not pnpm, and npm only supports
OIDC trusted publishing from **11.5.1+**. The Node 22 runner bundles npm 10.9.x, which ignores OIDC and
publishes with no credential — npm then masks the unauthorized write as a confusing `E404 Not Found` on
the registry `PUT`. So the workflow installs a current npm (`npm@11.16.0`) before the changesets step.
(pnpm — pinned to `pnpm@10.30.3` via the root `packageManager` field — only runs installs and the build;
it never does the publish.) Node ≥ 22.14 is also required.

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
