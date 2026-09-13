# Scenario Census — ose-infra

Phase 0 audit data for `enforce-repo-wide-scenario-implementation`, scoped to `ose-infra`.
Source: `~/ose-projects/ose-infra/repo-config.yml` `coverage.projects` (8 entries, read
verbatim 2026-07-04). Scenario counts = `grep -E "^\s*(Scenario|Scenario Outline):"` over every
`.feature` file matched by each project's `specs` glob. "Level-tagged scenarios" = scenarios with a
literal `@unit`/`@integration`/`@e2e` tag line directly above the `Scenario:`/`Scenario Outline:`
line (verified with a script, not a bare grep — see note below).

| #   | Project                | `levels` (registry)   | `specs` glob                                                   | `.feature` files | Scenario count | Level-tagged scenarios |
| --- | ---------------------- | --------------------- | -------------------------------------------------------------- | ---------------- | -------------- | ---------------------- |
| 1   | `rhino-cli`            | `[unit, integration]` | `specs/apps/rhino/behavior/rhino-cli/**`                       | 57               | 310            | 13 (all `@unit`)       |
| 2   | `coralpolyp-contracts` | `[]`                  | `specs/apps/coralpolyp/containers/contracts/**`                | 0                | 0              | 0                      |
| 3   | `coralpolyp-be`        | `[unit, integration]` | `specs/apps/coralpolyp/behavior/coralpolyp-be/**`              | 1 (shared)       | 2 (shared)     | 0                      |
| 4   | `coralpolyp-be-e2e`    | `[e2e]`               | `specs/apps/coralpolyp/behavior/coralpolyp-be/**` (same glob)  | 1 (shared)       | 2 (shared)     | 0                      |
| 5   | `coralpolyp-fe`        | `[unit]`              | `specs/apps/coralpolyp/behavior/coralpolyp-web/**`             | 3 (shared)       | 8 (shared)     | 0                      |
| 6   | `coralpolyp-fe-e2e`    | `[e2e]`               | `specs/apps/coralpolyp/behavior/coralpolyp-web/**` (same glob) | 3 (shared)       | 8 (shared)     | 0                      |
| 7   | `ts-ui-tokens`         | `[]`                  | `specs/libs/ts-ui-tokens/behavior/gherkin/**`                  | 1                | 1              | 0                      |
| 8   | `ts-ui`                | `[unit]`              | `specs/libs/ts-ui/behavior/gherkin/**`                         | 6                | 31             | 0                      |

**Deduped total (unique `.feature` files/scenarios across the repo)**: 69 files, 352 scenarios — the
`coralpolyp-be`/`coralpolyp-be-e2e` pair and the `coralpolyp-fe`/`coralpolyp-fe-e2e` pair each own an
**identical glob** (same physical files), so their scenario counts are NOT additive; each pair's
scenarios are counted once in the dedup total (2 + 8, not 4 + 16).

## Per-project detail

### 1. `rhino-cli`

- 57 `.feature` files under `specs/apps/rhino/behavior/rhino-cli/gherkin/**`, 310 scenarios (all via
  `Scenario:`; zero `Scenario Outline:` in this project).
- 13 scenarios carry a literal `@unit` tag immediately above `Scenario:` (all in
  `gherkin/specs/{behavior-coverage,domain-coverage,harness-bindings,harness-registry-driven,
worktree-agnostic,env-staged-guard}.feature` — i.e., rhino-cli's own meta-specs about its coverage
  tooling). Zero literal `@integration` or `@e2e` scenario tags exist anywhere in this project.
- A naive `grep -c "@unit\|@integration\|@e2e"` over the raw file text returns 16/2/2 — inflated
  because `behavior-coverage.feature` and `domain-coverage.feature` are meta-specs that describe the
  `@unit`/`@integration`/`@e2e`/`@covers` tagging convention itself in Given/When/Then step **prose**
  (e.g. `Given a scenario with no @unit, @integration, or @e2e level tag`), not as literal Gherkin
  tags. The verified figure (13, all `@unit`) is from a script that only counts tag lines
  immediately preceding a `Scenario:`/`Scenario Outline:` line.
- Per-scenario tagging is the exception, not the rule, even in rhino-cli (13 of 310 = ~4%). The
  registry's `levels: [unit, integration]` field — not per-scenario tags — is what actually governs
  which levels rhino-cli's scenarios must be covered at.

### 2. `coralpolyp-contracts`

- `levels: []`, glob `specs/apps/coralpolyp/containers/contracts/**` resolves to **zero `.feature`
  files** — the directory holds only the OpenAPI contract (`openapi.yaml`, `paths/`, `schemas/`,
  `.spectral.yaml`, `redocly.yaml`, generated bundle output) and no Gherkin. Consistent with the
  empty `levels` array: this project has no test-level targets and nothing for a scenario-tag
  convention to attach to.

### 3 & 4. `coralpolyp-be` / `coralpolyp-be-e2e`

- Both registry rows share the **exact same glob** (`specs/apps/coralpolyp/behavior/coralpolyp-be/**`),
  resolving to one file: `gherkin/health/health-check.feature` (1 `Background` + 2 `Scenario:`
  blocks, 0 `Scenario Outline:`).
- Zero literal `@unit`/`@integration`/`@e2e` tags in the file, and zero tags of any kind (`git grep`
  for `@[a-zA-Z]` in this file returns nothing). `coralpolyp-be` is a cucumber-rs (`harness = false`)
  binary that runs the `.feature` file directly via native Given/When/Then step-attribute matching
  (`#[given(...)]`/`#[when(...)]`/`#[then(...)]`) — the registry's `levels: [unit, integration]` (for
  `coralpolyp-be`) and `[e2e]` (for `coralpolyp-be-e2e`) is the sole level-assignment mechanism; there
  is no per-scenario tag layer at all for this project today.

### 5 & 6. `coralpolyp-fe` / `coralpolyp-fe-e2e`

- Both registry rows share the same glob (`specs/apps/coralpolyp/behavior/coralpolyp-web/**`),
  resolving to 3 files / 8 scenarios: `health/health-status.feature` (2), `layout/accessibility.feature`
  (3), `layout/responsive.feature` (3).
- Zero tags of any kind in any of the three files. `coralpolyp-fe` uses Vitest + Testing Library
  (loose prose-matched `it("...")` titles, no explicit link to Gherkin scenario titles);
  `coralpolyp-fe-e2e` uses Playwright + `playwright-bdd` (native `.feature`-to-test compilation via
  `bddgen`, not `@covers` markers). Levels again come entirely from the registry.

### 7. `ts-ui-tokens`

- `levels: []`; glob resolves to 1 file (`tokens/tokens-export.feature`), 1 scenario. Tags present are
  `@open-sharia-enterprise` and `@wip` — organizational/status tags, not level tags. `test:unit` and
  `specs:behavior:coverage` are both no-op `echo` targets in `project.json` (no test runner consumes
  this project's Gherkin yet), matching the empty `levels` registry entry.

### 8. `ts-ui`

- `levels: [unit]`; glob resolves to 6 files / 31 scenarios (`button.feature` alone has 18 of the 31).
  Zero tags of any kind found in any file. Consumed by Vitest via `--shared-steps` step-text matching
  (same engine class as `coralpolyp-be`/`coralpolyp-fe`, see `04-vacuity-infra.md`).

## Key finding

Across all 8 registered projects and 352 deduped scenarios, only **13 scenarios (3.7%)** carry a
literal per-scenario level tag, and all 13 live inside `rhino-cli`'s own self-referential meta-specs
(specs that describe the coverage-checking tool itself). **Zero** scenarios in any of the 6 non-tooling
projects (`coralpolyp-*`, `ts-ui*`) carry a literal level tag. This confirms the plan's framing: the
registry's `levels:` field (glob → project → levels) is the **actual, load-bearing** level-assignment
mechanism repo-wide; per-scenario Gherkin tags are a rare, currently-unused-in-practice secondary
signal that exists only inside rhino-cli's own bootstrap specs.
