# Declare the `vite` every vitest config already imports, and gate the class

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: ten workspace packages run their tests through a `vite*.config.*` that imports a
`vite` none of them declares — it resolves only because npm auto-installs `vitest`'s peer and hoists
it to the root — so the manifests misdescribe their own packages and no gate would notice an eleventh.

> Provenance: demoted from the full `backlog/` plan `declare-vite-peer-dependency/` to a two-pager on
> 2026-08-21. Filed 2026-08-18 by
> [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md)'s Knowledge Capture phase.

## Problem / context

Search rule: every `package.json` sitting beside a `vite*.config.*` that declares `vitest`, checked
for a `vite` declaration. Eleven packages match across the two repos. **One** is declared
(`@open-sharia-enterprise/ts-ui` in the private sibling, at `^7.3.5`); the other ten are not — nine in
`ose-public` (`web-ui`, `web-ui-token`, `ts-env-loader`, `ayokoding-www`, `ose-www`, `ose-app-web`,
`organiclever-www`, `organiclever-app-web`, `wahidyankf-www`) and one in the private sibling
(`ts-ui-tokens`).

They all work because `vite` is a peer dependency of `vitest`
(`"^6.0.0 || ^7.0.0 || ^8.0.0-0"`), npm 7+ auto-installs peers, and Node's resolver walks up from any
workspace package into the root `node_modules` and finds it. That arrangement is an emergent property
of hoisting, not a decision anyone made or reviewed.

**Be precise about what this is not.** It is not an outage risk. The one time the class bit —
the private sibling's PR #51 failing `ts-ui:test:unit` with `Cannot find module 'vite'` — the cause was that
repo's self-hosted runner cache symlinking `node_modules` into `$HOME`, so Node realpath'd the
symlink and the ancestor walk continued under `$HOME` instead of the repository. Fixed in `a34d0f15e`
by copying workspace trees instead of symlinking them. `ose-public` never had that scheme at all,
which is why nine undeclared packages sat green throughout.

**And declaring would not have fixed it** — verified, not assumed. After `vite` was declared in
`libs/ts-ui/package.json`, `libs/ts-ui/node_modules/` still held only `@rolldown`, `@vitejs`, and
`react-refresh`. npm hoists to the root regardless of the declaration. A declaration records intent;
it does not relocate a package.

What survives is the third of the incident's three costs: the manifests gave no way to tell _missing_
from _unreachable_, and that ambiguity burned a full CI cycle on a fix that could not have worked.

## Why now

Not urgent, and saying so is the point of the demotion. The mechanism is fixed and never existed in
`ose-public`; overstating the risk would repeat the incident's own third hypothesis. What keeps the
idea alive is that nothing checks, so every new package with a `vitest` config repeats the pattern and
the next ambiguous failure costs the same diagnosis time — while the fix itself is provably free,
since the versions are already resolved and already installed.

## Prior art / precedents

- [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md) — where the class surfaced,
  and where the four falsified hypotheses are recorded.
- [Related Repositories reference](../../../docs/reference/related-repositories.md) — the `rhino-cli`
  parity boundary any gate implementation inherits.
- [port-registry-lacks-a-validator](./port-registry-lacks-a-validator.md) — the same shape: a stated
  invariant with nothing enforcing it.
- **`depcheck`** and **`eslint-plugin-import`'s `no-extraneous-dependencies`** — the established
  ecosystem answer to "this file imports something its package does not declare"; both are
  source-oriented, which is why a config-scoped check is worth costing against simply adopting one.
- [npm's auto-install-peers behaviour](https://docs.npmjs.com/cli/v10/using-npm/config#legacy-peer-deps)
  — the mechanism that makes the gap invisible.

## Proposed direction (sketch)

- **Write the gate first, while the RED is real.** A check that walks each workspace package's
  `*.config.{ts,js,mts,mjs,cts,cjs}`, extracts every import specifier, ignores relative paths and Node
  builtins, maps subpaths to their package (`vite/client` → `vite`, `@vitejs/plugin-react/x` →
  `@vitejs/plugin-react`), and fails naming any specifier the package does not declare. Written before
  the declarations land, its failing state is the actual repository — nine findings in `ose-public`,
  one in the private sibling — which is stronger evidence than a fixture.
- **Then declare the ten, inertly.** Each pinned to the version _its own_ repo's lockfile already
  resolves, with the lockfile diff required to be declaration-only: any changed `version`, `resolved`,
  or `integrity` field means the range was wrong and the hygiene change has become an upgrade.
- **Keep the gate deliberately narrow** — config files only, not application source. A config import
  is resolved before any of the package's own code loads, so a gap there fails the whole target rather
  than one test, and that is the case this repo has actually been bitten by.

## Rough scope & non-goals

In scope: ten `package.json` files, both `package-lock.json` files, and — for the gate —
`apps/rhino-cli/` plus `repo-config.yml` in both repos.

Out of scope (for now):

- Upgrading `vite` in either repo.
- Reconciling the 7.x/8.x split — `ose-public` hoists 8.0.13, the private sibling resolves 7.3.5. A single
  shared range across both would force a resolution change in one of them, which is exactly what the
  declaration-only lockfile check exists to prevent.
- Extending the gate beyond config files to application source.
- Any change to a `vite*.config.*` file's contents, and any further runner-cache work — that is fixed.

## Risks & open questions

- **Is a bespoke `rhino-cli` gate the right build-vs-buy call?** It carries a TDD cycle, companion
  Gherkin under `specs/apps/rhino`, `repo-config.yml` registration, and the four-repo parity-manifest
  obligation. `depcheck` may cover enough of it for a fraction of that. Uncosted. (open)
- **Does the 7-vs-8 split deserve its own plan?** Recording it as intentional is not the same as
  deciding it is fine. (open)
- **What is the gate's false-positive surface beyond builtins and relative paths?** Type-only imports,
  `import()` expressions, and virtual module ids are unenumerated. (open)
- Silent-upgrade risk: a declaration whose range does not match the resolved version turns hygiene
  into a dependency bump. Mitigated only by actually reading the lockfile diff, which is easy to skip.
- Parity drift: the gate landing in one repo and not the other recreates the asymmetry this brief
  describes, one layer up.

## What success looks like + promotion signal

Success: every package whose config imports `vite` declares it, pinned to what its own repo already
resolves; the lockfile diffs are declaration-only and all ten packages report the _same_ test counts
as before; and a package whose config imports an undeclared module fails CI with a message naming the
package and the module, in both repos, with `parity manifest validate` reporting `diverging=0`.

Promotion signal: the build-vs-buy question above is answered — a single evaluation of `depcheck`
against one workspace package decides whether this is a small config-and-declare plan or a full
`rhino-cli` gate plan, and the two have very different shapes. Promote once that verdict is written
down. Absent that, the ten declarations alone are small enough to fold into any adjacent
manifest-touching plan rather than justifying one of their own.
