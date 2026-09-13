# Scenario Census — ose-public

Phase 0 audit data for `enforce-repo-wide-scenario-implementation`, scoped to `ose-public`. Source:
`~/ose-projects/ose-public/repo-config.yml` `coverage.projects` (26 entries, read verbatim
2026-07-04, from the live repo — not this worktree). Scenario counts = `grep -E
"^\s*(Scenario|Scenario Outline):"` over every `.feature` file matched by each project's real spec
source. "Level-tagged scenarios" = scenarios with a literal `@unit`/`@integration`/`@e2e` tag line
directly above the `Scenario:`/`Scenario Outline:` line, verified with a script (not a bare grep, to
avoid counting tag-prose mentions in meta-specs).

## Headline finding: the registry's `specs:` glob strings do not match real files for 18 of 26 entries

Before the table: `coverage.projects[].specs` in `repo-config.yml` is **not** the mechanism that
actually wires a project to its Gherkin — that wiring lives in each project's own `project.json`
(`specs:behavior:coverage` command args + `namedInputs.specs`). Cross-checking the registry's literal
glob strings against (a) the real filesystem and (b) each project's own `project.json` shows:

- **8 entries genuinely match** (`rhino-cli`, `ose-be`, `ose-be-e2e`, `ose-app-web`, `ose-app-web-e2e`,
  `rust-commons`, `web-ui`, `fsharp-crane-core`) — for these, the on-disk directory really is named
  exactly what the registry glob says (e.g. `specs/apps/ose/behavior/be/**` → real dir `.../behavior/be/`).
- **18 entries do not match anything on disk.** The registry glob uses a bare surface segment (`www`,
  `cli`, `be`, `app-web`) with no domain/project-name prefix, but every other domain's real spec
  directories are prefixed with the full project name (`organiclever-be`, `organiclever-www`,
  `ayokoding-cli`, `ayokoding-www`, `wahidyankf-www`, `crane-cli`, `ose-cli`) or use an even-further
  legacy name (`ose`'s www-tier specs live under `platform-web`/`platform-be`, not `www`). A literal
  `find`/glob against the registry string returns **zero files** for all 18. The table below resolves
  each of these 18 to its **real** spec source (taken from the project's own `project.json`, which is
  what CI actually runs) so the scenario counts are meaningful; the "Registry glob" column is shown
  as-written for comparison.
- This is consistent with, and explains, a second finding in `04-vacuity-public.md`: the per-scenario
  `@covers`/level-tag engine (`application::behavior_coverage::validator::validate`) that would
  actually _consume_ this registry's `specs` field at real-file granularity is not wired to any CLI
  command yet — nothing today reads `coverage.projects[].specs` as a literal filesystem glob, so the
  mismatch has had zero runtime consequence so far. It will matter as soon as Phase 1 of this plan
  tries to consume the registry literally.

## Census table (26 rows, one per `coverage.projects` entry)

| #   | Project                    | `levels` (registry)   | `specs` glob (registry, as-written)                       | Glob matches real path?                                        | Real spec source (from `project.json`)                                         | `.feature` files | Scenarios   | Level-tagged scenarios |
| --- | -------------------------- | --------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- | ----------- | ---------------------- |
| 1   | `rhino-cli`                | `[unit, integration]` | `specs/apps/rhino/behavior/rhino-cli/**`                  | Yes                                                            | same                                                                           | 57               | 310         | 13 (all `@unit`)       |
| 2   | `ose-be`                   | `[unit, integration]` | `specs/apps/ose/behavior/be/**`                           | Yes                                                            | same                                                                           | 9 (shared)       | 9 (shared)  | 4                      |
| 3   | `ose-be-e2e`               | `[e2e]`               | `specs/apps/ose/behavior/be/**` (same glob)               | Yes                                                            | same (shared with #2)                                                          | 9 (shared)       | 9 (shared)  | 4                      |
| 4   | `ose-app-web`              | `[unit]`              | `specs/apps/ose/behavior/app-web/**`                      | Yes                                                            | same                                                                           | 1 (shared)       | 1 (shared)  | 0                      |
| 5   | `ose-app-web-e2e`          | `[e2e]`               | `specs/apps/ose/behavior/app-web/**` (same glob)          | Yes                                                            | same (shared with #4)                                                          | 1 (shared)       | 1 (shared)  | 0                      |
| 6   | `ose-www`                  | `[unit]`              | `specs/apps/ose/behavior/www/**`                          | **No** (no `www` dir)                                          | `.../behavior/platform-web/gherkin` + `.../behavior/platform-be/gherkin`       | 10 (shared)      | 26 (shared) | 0                      |
| 7   | `ose-www-be-e2e`           | `[e2e]`               | `specs/apps/ose/behavior/www/**` (same glob)              | **No**                                                         | same combined platform-web + platform-be (shared with #6)                      | 10 (shared)      | 26 (shared) | 0                      |
| 8   | `ose-www-fe-e2e`           | `[e2e]`               | `specs/apps/ose/behavior/www/**` (same glob)              | **No**                                                         | `.../behavior/platform-web/gherkin` only (subset of #6/#7)                     | 5                | 14          | 0                      |
| 9   | `ose-cli`                  | `[unit, integration]` | `specs/apps/ose/behavior/cli/**`                          | **No** (real dir is `ose-cli`, not `cli`)                      | `.../behavior/ose-cli/gherkin`                                                 | 1                | 4           | 0                      |
| 10  | `organiclever-be`          | `[unit, integration]` | `specs/apps/organiclever/behavior/be/**`                  | **No** (real dir is `organiclever-be`)                         | `.../behavior/organiclever-be/gherkin`                                         | 6 (shared)       | 12 (shared) | 4                      |
| 11  | `organiclever-be-e2e`      | `[e2e]`               | `specs/apps/organiclever/behavior/be/**` (same glob)      | **No**                                                         | same (shared with #10)                                                         | 6 (shared)       | 12 (shared) | 4                      |
| 12  | `organiclever-app-web`     | `[unit]`              | `specs/apps/organiclever/behavior/app-web/**`             | **No** (real dir is `organiclever-app-web`)                    | `.../behavior/organiclever-app-web/gherkin`                                    | 14 (shared)      | 74 (shared) | 0                      |
| 13  | `organiclever-app-web-e2e` | `[e2e]`               | `specs/apps/organiclever/behavior/app-web/**` (same glob) | **No**                                                         | same (shared with #12)                                                         | 14 (shared)      | 74 (shared) | 0                      |
| 14  | `organiclever-www`         | `[unit]`              | `specs/apps/organiclever/behavior/www/**`                 | **No** (real dir is `organiclever-www`)                        | `.../behavior/organiclever-www/gherkin`                                        | 2 (shared)       | 13 (shared) | 0                      |
| 15  | `organiclever-www-be-e2e`  | `[e2e]`               | `specs/apps/organiclever/behavior/www/**` (same glob)     | **No** — and resolves to a **different real dir** than #14/#16 | `.../behavior/organiclever-www-be/gherkin`                                     | 1                | 1           | 0                      |
| 16  | `organiclever-www-fe-e2e`  | `[e2e]`               | `specs/apps/organiclever/behavior/www/**` (same glob)     | **No**                                                         | `.../behavior/organiclever-www/gherkin` (shared with #14)                      | 2 (shared)       | 13 (shared) | 0                      |
| 17  | `ayokoding-www`            | `[unit]`              | `specs/apps/ayokoding/behavior/www/**`                    | **No** (real content spans 3 dirs, not 1)                      | `ayokoding-www` + `ayokoding-be` + `ayokoding-build-tools` gherkin (union)     | 18               | 206         | 0                      |
| 18  | `ayokoding-www-be-e2e`     | `[e2e]`               | `specs/apps/ayokoding/behavior/www/**` (same glob)        | **No**                                                         | `ayokoding-be` + `ayokoding-www` gherkin (subset of #17, excludes build-tools) | 17               | 200         | 0                      |
| 19  | `ayokoding-www-fe-e2e`     | `[e2e]`               | `specs/apps/ayokoding/behavior/www/**` (same glob)        | **No**                                                         | `ayokoding-www` gherkin only (subset of #17/#18)                               | 12               | 182         | 0                      |
| 20  | `ayokoding-cli`            | `[unit, integration]` | `specs/apps/ayokoding/behavior/cli/**`                    | **No** (real dir is `ayokoding-cli`)                           | `.../behavior/ayokoding-cli/gherkin`                                           | 1                | 4           | 0                      |
| 21  | `wahidyankf-www`           | `[unit]`              | `specs/apps/wahidyankf/behavior/www/**`                   | **No** (real dir is `wahidyankf-www`)                          | `.../behavior/wahidyankf-www/gherkin`                                          | 7 (shared)       | 29 (shared) | 0                      |
| 22  | `wahidyankf-www-fe-e2e`    | `[e2e]`               | `specs/apps/wahidyankf/behavior/www/**` (same glob)       | **No**                                                         | same (shared with #21)                                                         | 7 (shared)       | 29 (shared) | 0                      |
| 23  | `crane-cli`                | `[unit, integration]` | `specs/apps/crane/behavior/cli/**`                        | **No** (real dir is `crane-cli`)                               | `.../behavior/crane-cli/gherkin`                                               | 12               | 37          | 0                      |
| 24  | `rust-commons`             | `[unit]`              | `specs/libs/rust-commons/behavior/**`                     | Yes                                                            | same                                                                           | 1                | 2           | 0                      |
| 25  | `web-ui`                   | `[unit]`              | `specs/libs/web-ui/behavior/**`                           | Yes                                                            | same                                                                           | 18               | 86          | 0                      |
| 26  | `fsharp-crane-core`        | `[unit]`              | `specs/libs/fsharp-crane-core/behavior/**`                | Yes                                                            | same                                                                           | 1                | 2           | 0                      |

**Deduped total (unique real `.feature` files/scenarios across the repo's 26 registered projects)**:
159 files, 816 scenarios. Cross-validated by an independent sweep of every `.feature` file under
`specs/apps/*/behavior/**` and `specs/libs/*/behavior/**` (139 + 21 = 160 files, 726 + 91 = 817
scenarios) minus the one deliberately-excluded project's file (`specs/libs/web-ui-token/behavior/gherkin/tokens/tokens-export.feature`,
1 file / 1 scenario — `web-ui-token` is intentionally absent from `coverage.projects`, see the registry's
own trailing comment) = 159 files / 816 scenarios. Matches exactly.

## Per-domain detail

### rhino-cli

57 `.feature` files, 310 scenarios (0 `Scenario Outline:`), 13 literal `@unit`-tagged scenarios — all
13 live in rhino-cli's own meta-specs (`gherkin/specs/{behavior-coverage,domain-coverage,
harness-bindings,harness-registry-driven,worktree-agnostic,env-staged-guard}.feature`), which describe
the coverage-checking tool itself. Zero literal `@integration`/`@e2e` tags anywhere. A naive
`grep -c "@unit\|@integration\|@e2e"` over raw file text over-counts (`behavior-coverage.feature` and
`domain-coverage.feature` mention the tags in Given/When/Then step **prose**, e.g. `Given a scenario
with no @unit, @integration, or @e2e level tag`); the verified figure comes from a script that only
counts a tag line immediately preceding `Scenario:`/`Scenario Outline:`.

### ose domain

- `ose-be`/`ose-be-e2e` share the exact same glob and real path (`specs/apps/ose/behavior/be/gherkin`,
  9 files / 9 scenarios). 4 scenarios carry literal tags: `db/migrations.feature` (`@integration`),
  `messaging/{nats-config,nats-connect,jetstream-demo}.feature` (`@unit`, `@e2e`, `@e2e`). This exact
  file-name/tag pattern is duplicated byte-for-byte in `organiclever-be` (see below) — a shared
  scaffold template between the two F# backends.
- `ose-app-web`/`ose-app-web-e2e` share one file, `gherkin/smoke/smoke.feature` (1 scenario, untagged).
- `ose-www`/`ose-www-be-e2e`/`ose-www-fe-e2e`: the registry's shared `specs/apps/ose/behavior/www/**`
  glob resolves to **nothing** on disk. The real content — confirmed from `apps/ose-www/project.json`'s
  `specs:behavior:coverage` command — lives in `specs/apps/ose/behavior/platform-web/gherkin` (landing
  page + app-shell: 5 files / 14 scenarios) and `specs/apps/ose/behavior/platform-be/gherkin` (health,
  rss-feed, content-retrieval, search, seo: 5 files / 12 scenarios). `ose-www` and `ose-www-be-e2e` both
  consume the union (10 files / 26 scenarios); `ose-www-fe-e2e` consumes `platform-web` only (5/14).
  Zero literal level tags anywhere in this pair of directories.
- `ose-cli`: registry says `specs/apps/ose/behavior/cli/**` (no such dir); real dir is
  `specs/apps/ose/behavior/ose-cli/gherkin` (1 file, `links/links-check.feature`, 4 scenarios,
  untagged).

### organiclever domain

- `organiclever-be`/`organiclever-be-e2e`: registry glob `.../behavior/be/**` doesn't exist; real dir
  is `specs/apps/organiclever/behavior/organiclever-be/gherkin` (6 files / 12 scenarios). 4 tagged
  scenarios, identical file-name pattern to `ose-be` above (`db/migrations.feature` `@integration`;
  `messaging/{nats-config,nats-connect,jetstream-demo}.feature` `@unit`/`@e2e`/`@e2e`).
- `organiclever-app-web`/`organiclever-app-web-e2e`: registry glob doesn't exist; real dir
  `.../organiclever-app-web/gherkin` (14 files / 74 scenarios, untagged) — the largest single spec tree
  in the domain besides `rhino-cli` and `ayokoding-www`.
- `organiclever-www`/`organiclever-www-fe-e2e` share `.../organiclever-www/gherkin` (`home.feature`,
  `accessibility.feature`: 2 files / 13 scenarios, untagged). `organiclever-www-be-e2e` is **distinct**
  — it resolves to `.../organiclever-www-be/gherkin` (1 file, `placeholder.feature`, 1 scenario) — a
  separate physical directory the registry's identical `www` glob cannot distinguish from
  `organiclever-www` at all (both entries currently collapse onto the literal string `.../behavior/www/**`).

### ayokoding domain

`ayokoding-www`'s real spec source (per its own `project.json`) spans **three** directories:
`ayokoding-www/gherkin` (12 files / 182 scenarios — by far the largest tree), `ayokoding-be/gherkin`
(5 files / 18 scenarios), and `ayokoding-build-tools/gherkin` (1 file / 6 scenarios) — 18 files / 206
scenarios combined, all untagged. `ayokoding-www-be-e2e` consumes `ayokoding-be` + `ayokoding-www`
(17/200, excludes build-tools); `ayokoding-www-fe-e2e` consumes `ayokoding-www` alone (12/182).
`ayokoding-cli` is separate: `.../ayokoding-cli/gherkin` (1 file, 4 scenarios, untagged).

### wahidyankf and crane domains

`wahidyankf-www`/`wahidyankf-www-fe-e2e` share `.../wahidyankf-www/gherkin` (7 files / 29 scenarios,
untagged). `crane-cli` is standalone: `.../crane-cli/gherkin` (12 files / 37 scenarios, untagged).

### libs

`rust-commons` (1 file / 2 scenarios), `web-ui` (18 files / 86 scenarios — largest lib tree, `button.feature`
alone carries a large share), `fsharp-crane-core` (1 file / 2 scenarios). All three registry globs
match real paths exactly (no domain-prefix mismatch for libs). Zero literal level tags in any lib.
Excluded from the registry (per its own trailing comment, not by oversight): `web-ui-token`,
`organiclever-contracts`, `ose-contracts` — all three have every test-level target as a documented
no-op.

## Key findings

1. **Only 3 of 26 projects carry any literal per-scenario level tag**: `rhino-cli` (13, all `@unit`,
   confined to its own meta-specs), `ose-be` (4), `organiclever-be` (4) — 21 tagged scenarios total out
   of 816 (2.6%). The other 23 projects have **zero** literal tags anywhere. This confirms the plan's
   framing: the registry's `levels:` field (project → levels), not per-scenario Gherkin tags, is the
   load-bearing level-assignment mechanism repo-wide today.
2. **18 of 26 registry entries have a `specs:` glob string that matches zero files on disk.** The
   registry was seemingly authored assuming every domain's spec directories drop the domain-name
   prefix (as `ose-be`/`ose-app-web` happen to), but `organiclever-*`, `ayokoding-*`, `wahidyankf-*`,
   `crane-cli`, and `ose-www`/`ose-cli` all use fully-prefixed (or, for `ose-www`, legacy `platform-*`)
   directory names. This has had zero runtime effect so far because nothing currently resolves
   `coverage.projects[].specs` as a literal filesystem glob (see `04-vacuity-public.md`), but it is a
   concrete gap this plan's Phase 1 must close before the registry can be trusted as ground truth.
3. Two registry entries that share an identical `specs:` glob string (`organiclever-www-be-e2e` and
   `organiclever-www`/`organiclever-www-fe-e2e`) actually resolve to two **different** real
   directories (`organiclever-www-be` vs `organiclever-www`) — the shared-glob-implies-shared-content
   assumption baked into several rows of this registry does not universally hold.
