---
title: "PRD — SDLC Gate Registry Enforcement"
description: Requirements and Gherkin acceptance criteria for the gate registry, surface rewire, and main-ci retirement
category: explanation
subcategory: plans
tags:
  - ci-cd
  - governance
  - requirements
created: 2026-08-02
---

# PRD — SDLC Gate Registry Enforcement

> **Scope Amendment (2026-08-07)**: the byte-identity boundary this PRD specifies as spanning "all
> four repos" is narrowed to **`ose-public` + the private sibling** — see
> [delivery.md §Scope Amendment](./delivery.md#scope-amendment-2026-08-07) for the full rationale.
> `beaver-nest` (R-11's Phase 5 join, R-13) is **cancelled** — `beaver-nest` is slated for future
> deprecation and merge into `ose-public`. `ose-primer` already fulfilled its one-time propagation
> (R-11's Phase 3 leg, merged) and is now synced periodically/manually, outside continuous
> enforcement. The requirements and Gherkin scenarios below are left as originally authored —
> historical record of the four-repo design — except where explicitly marked cancelled/superseded
> inline. Do not treat an unmarked "all four repos" or `beaver-nest` scenario below as a live,
> executable requirement; delivery.md's checklist is the current source of truth for what actually
> runs.
>
> **Planned-path annotation**: `apps/rhino-cli/parity-manifest.sha256`,
> `.github/workflows/dependency-vulnerability-audit.yml`, and
> `.github/workflows/rhino-cli-parity-audit.yml` are **new files** everywhere they appear below.
> Every test selector introduced by this PRD is a **new test** unless it names a current baseline
> test explicitly.

All requirements are numbered `R-n` and referenced by the delivery checklist. Every requirement
carries at least one Gherkin scenario. These scenarios are the source for the companion
`specs/apps/rhino/behavior/rhino-cli/gherkin/**` feature files that ship with Phase 1 — code under
`apps/` never lands without its Gherkin, per
[Feature-Change Completeness](../../../repo-governance/development/quality/feature-change-completeness.md).

## Product Overview

SDLC Gate Registry Enforcement replaces twelve hand-written, drift-prone surface files
(`.husky/pre-commit`, `.husky/pre-push`, `pr-quality-gate.yml`, `main-ci.yml` — across all four bound
repos) with a single declared `gates:` registry per repo plus thin invocation shims. From a
consumer's point of view: the maintainer running hooks locally, CI runners invoking `gate list` /
`gate run`, and any agent authoring a new gate entry all read and act on the same source of truth
instead of four independently-drifting surfaces. `gate validate` turns the previously-prose Gate
Composition Rule into a mechanical check, `main-ci.yml` retires without losing any check it uniquely
carried, and the same generate-and-validate shape is extended to keep `apps/rhino-cli` byte-identical
across all four repos this plan touches (`ose-public`, `ose-primer`, the private sibling, `beaver-nest`).

## Personas

This is a tooling/CI-governance product with no external end users — its "customers" are the
solo-maintainer's own hats and the agents that consume the registry on their behalf:

- **Repo maintainer (local)** — runs hooks and the `gate` CLI directly on a workstation, authors new
  `repo-config.yml` `gates:` entries, and wants one place that answers "what will gate my change, and
  where" (see [brd.md §Stakeholders](./brd.md#stakeholders)).
- **CI runner (`pr-quality-gate.yml`)** — invokes `gate list --surface=ci --format=json` to build its job matrix
  and `gate validate` to assert the composition rule holds server-side (R-2, R-4).
- **Contributing agent authoring a gate** — an agent (e.g. `repo-rules-maker`, or a plan executor)
  adding or editing a `gates:` entry, relying on `repo-config validate` / `gate validate` to catch a
  malformed or incomplete declaration before it is pushed (R-1, R-4).
- **Downstream-repo maintainer/agent** (`ose-primer`, the private sibling, `beaver-nest`) — consumes the
  byte-identical `rhino-cli` gate engine while declaring repo-specific registry data, and relies on
  `rhino-cli parity manifest validate` / the scheduled parity audit for the byte-identity guarantee
  (R-10, R-11, R-12, R-13).

## User Stories

- As the **repo maintainer**, I want a single `gates:` section in `repo-config.yml` declaring every
  check and mutation per surface, so that I no longer hand-maintain twelve divergent surface files
  across four repos. (R-1)
- As a **CI runner**, I want `gate list --surface=ci --format=json` to emit a machine-readable
  projection, so that `pr-quality-gate.yml` can build its job matrix instead of hand-listing jobs.
  (R-2)
- As the **pre-push hook**, I want `gate run --surface=pre-push` to execute every declared gate in
  declaration order and stop at the first failure, so that hooks become thin invocation shims with no
  embedded check list. (R-3)
- As the **repo maintainer**, I want `gate validate` to fail whenever a surface silently drops a
  declared check (or a workflow hardcodes an undeclared one), so that the Gate Composition Rule is
  mechanically enforced rather than trusted to prose. (R-4)
- As a **contributor staging files**, I want the `lint-staged` block in `package.json` generated from
  the registry, so that pre-commit's per-file gates can never hand-drift from what is declared. (R-4a)
- As the **repo maintainer**, I want every check that today exists only in `main-ci.yml` folded into
  the PR gate before that workflow is deleted, so that retiring dead weight never silently drops
  coverage. (R-5)
- As a **reviewer**, I want `harness bindings validate` to run in CI (not only pre-push), so that an
  unsynced mirror pushed with hooks bypassed is still caught before it reaches `main`. (R-6)
- As the **repo maintainer**, I want a dedicated `format-verify-*` check per formatter on the CI
  surface, so that an unformatted file in any of the fourteen supported languages fails the build
  instead of reaching `main` silently. (R-7, R-7a)
- As the **repo maintainer**, I want `deps:audit` to stay outside the gate registry and live in its
  own descriptively-named workflow, so that a non-hermetic advisory-database check never blocks a
  push for a reason unrelated to the change it contains. (R-8)
- As a **contributor reading the SDLC Gate Standard**, I want the standard and
  `git-hook-lifecycle.md` to describe exactly what the surfaces run, so that documentation cannot
  drift silently from the implementation again. (R-9)
- As a **downstream-repo maintainer/agent**, I want the gate engine to stay byte-identical to
  canonical while my repo's own gate entries differ, so that I get the same enforcement guarantee
  without forking behavior. (R-10, R-11)
- As an **agent auditing cross-repo parity**, I want a scheduled, non-blocking workflow to report
  byte-identity divergence, so that coordinated drift is visible without putting a network fetch on
  the critical path of every merge. (R-12)
- As the **`beaver-nest` maintainer**, I want repo-specific data (app-name lists, exclusion prefixes)
  declared in `repo-config.yml` instead of hardcoded in shared source, so that byte-identity across
  four repos becomes reachable at all. (R-13)

## R-1 — A declared gate registry

`repo-config.yml` gains a `gates:` section declaring **everything any surface does** — every
pass/fail check (`type: check`) and every file-rewriting step (`type: mutation`) — each with a stable
`id`, its command, and the scope it carries **per surface**. Scope values are the five controlled
values already ratified in the SDLC Gate Standard plus `path-gated`, the existing prose qualifier
this plan normalizes as a sixth strict registry value. Surfaces are the four gate surfaces and only
those: `commit-msg`, `pre-commit`, `pre-push`, `ci`. Scheduled
non-gating pipelines are outside the registry by design — see R-8.

The completeness property is the point: after this change, anything absent from `gates:` is run by no
surface. There is no third category living in prose.

```gherkin
Feature: Gate registry declaration

  Scenario: A check declares a different scope per surface
    Given repo-config.yml declares a gate "md-links" with command "md links validate"
    And that gate declares surface "pre-push" with scope "all-file-type"
    And that gate declares surface "ci" with scope "all-file-type"
    When "rhino-cli gate list --surface=pre-push --format=json" runs
    Then the output contains an entry with id "md-links"
    And that entry reports scope "all-file-type"

  Scenario: An unknown scope value is rejected at parse time
    Given repo-config.yml declares a gate with scope "sometimes"
    When "rhino-cli repo-config validate" runs
    Then it exits non-zero
    And the message names the offending gate id and the allowed scope values

  Scenario: A duplicate gate id is rejected
    Given repo-config.yml declares two gates both with id "md-links"
    When "rhino-cli repo-config validate" runs
    Then it exits non-zero
    And the message names the duplicated id

  Scenario Outline: Every matrix-wired CI gate is declared, whatever its type
    Given the surfaces as shipped by this plan
    When "rhino-cli gate list --surface=ci --format=json" runs
    Then the output contains an entry with id "<id>"
    And that entry reports type "<type>"

    Examples:
      | id                     | type  |
      | repo-config-schema     | check |
      | format-verify-prettier | check |
      | format-verify-rustfmt  | check |

  # The JSON projection feeds the CI matrix, so it contains exactly CI gates
  # whose wiring is not hand-wired. `test-quick` is deliberately hand-wired
  # and is asserted through the textual projection and its workflow job;
  # commit-msg and pre-commit-only gates are listed on their own surfaces.

  Scenario: An unknown type value is rejected at parse time
    Given repo-config.yml declares a gate with type "cleanup"
    When "rhino-cli repo-config validate" runs
    Then it exits non-zero
    And the message names the allowed type values

  Scenario: A mutation may not declare a wiring value
    Given a gate declares type "mutation" and wiring "matrix"
    When "rhino-cli repo-config validate" runs
    Then it exits non-zero
    And the message states that wiring applies to checks only

  Scenario: lockfile-sync regenerates the lockfile and restages it
    Given a staged package.json changes a dependency
    And package-lock.json is stale with respect to it
    When the gate with id "lockfile-sync" runs on surface "pre-commit"
    Then package-lock.json is regenerated
    And the regenerated package-lock.json is staged
    And the commit proceeds with both files in the same commit

  Scenario: lockfile-sync is a no-op when the lockfile is already current
    Given a staged package.json matches package-lock.json
    When the gate with id "lockfile-sync" runs on surface "pre-commit"
    Then package-lock.json is unchanged
    And nothing additional is staged
```

## R-2 — Enumeration for the CI matrix

`gate list` emits a machine-readable surface projection so `pr-quality-gate.yml` can build a job
matrix rather than hand-listing jobs. Parallelism is preserved: one gate, one job.

```gherkin
Feature: Gate enumeration

  Scenario: JSON output drives a GitHub Actions matrix
    Given the registry declares gates on surface "ci"
    When "rhino-cli gate list --surface=ci --format=json" runs
    Then the output is a JSON array
    And every element carries "id", "command", and "scope" keys
    And the array contains exactly the gates declaring surface "ci"

  Scenario: A surface with no declared gates yields an empty array, not an error
    Given no gate declares surface "commit-msg"
    When "rhino-cli gate list --surface=commit-msg --format=json" runs
    Then it exits zero
    And the output is an empty JSON array

  Scenario: An unknown surface name is rejected rather than returning empty
    Given "cron" is not a valid surface name
    When "rhino-cli gate list --surface=cron --format=json" runs
    Then it exits non-zero
    And the message names the four valid surfaces
```

## R-3 — Execution from the hooks

`gate run --surface=<name>` executes every gate declared for that surface, in declaration order,
stopping at the first failure. On pre-commit the first batch-eligible declaration owns one
`lint-staged` batch; staged guard stays before it and direct re-staging mutations stay after it.
`--only` bypasses that aggregate batch and executes one direct leaf. The hooks become invocation
shims with no embedded check list.

```gherkin
Feature: Gate execution

  Scenario: Pre-push runs every gate declared for the pre-push surface
    Given the registry declares gates "md-links" and "env" on surface "pre-push"
    When "rhino-cli gate run --surface=pre-push" runs
    Then both gate commands are invoked
    And they are invoked in declaration order

  Scenario: Execution stops at the first failing gate
    Given the registry declares gates "first" then "second" on surface "pre-push"
    And gate "first" fails
    When "rhino-cli gate run --surface=pre-push" runs
    Then it exits non-zero
    And gate "second" is not invoked

  Scenario: A path-gated check is skipped when its trigger path is untouched
    Given gate "harness-bindings" declares surface "pre-push" with scope "path-gated"
    And its trigger paths do not intersect the changed set
    When "rhino-cli gate run --surface=pre-push" runs
    Then gate "harness-bindings" is not invoked
    And the run exits zero

  Scenario: A path-gated check runs when its trigger path is touched
    Given gate "harness-bindings" declares surface "pre-push" with scope "path-gated"
    And a file under ".claude/agents/" is in the changed set
    When "rhino-cli gate run --surface=pre-push" runs
    Then gate "harness-bindings" is invoked

  Scenario: Execution works identically from a linked worktree
    Given the current tree is a linked worktree under "worktrees/"
    When "rhino-cli gate run --surface=pre-push" runs
    Then repo-config.yml resolves from the current worktree toplevel
    And the run behaves identically to the primary checkout

  Scenario: Rhino CLI kind receives derived files
    Given a rhino-cli gate matches staged files "a.md" and "b.md"
    When "rhino-cli gate run --surface=pre-commit --only=md-naming" runs
    Then the local rhino-cli leaf receives only "a.md" and "b.md" and its exit code is propagated

  Scenario: External kind preserves fixed argv before files
    Given an external gate declares "shellcheck --severity=warning" and matches "tool.sh"
    When "rhino-cli gate run --surface=ci --only=shellcheck" runs
    Then PATH-resolved shellcheck receives "--severity=warning" then "tool.sh"

  Scenario: Nx kind delegates the affected project graph
    Given an nx gate "test:quick" declares scope "affected-projects"
    When "rhino-cli gate run --surface=pre-push --only=test-quick" runs
    Then "npm exec nx -- affected -t test:quick" runs and its exit code is propagated

  Scenario: All supported scopes derive their specified inputs
    Given one fixture registry covers affected-file-type, all-file-type, affected-projects, all-projects, other, and path-gated
    When each gate runs through "gate run --only" on its valid surface
    Then each leaf receives exactly its staged, tracked, affected, complete, empty, or trigger-intersection input contract

  Scenario: Glob lists and excludes are applied before invocation
    Given a file gate has globs "*.md" and "*.yml" and excludes "plans/done"
    When its candidate set contains matching, non-matching, and excluded paths
    Then the leaf receives only matching non-excluded repository-relative paths

  Scenario: An empty scoped match is a successful skip
    Given a file-scoped gate has no path after glob and exclusion filtering
    When that gate runs
    Then it exits zero without invoking the leaf and reports the skip

  Scenario: Only executes exactly one direct leaf
    Given pre-commit declares two batch entries and one direct mutation
    When "gate run --surface=pre-commit --only=md-mermaid" runs
    Then only md-mermaid runs directly with its matching files and no batch or mutation runs

  Scenario: Unknown or duplicate only ids fail before execution
    Given the requested only id is absent or duplicated in the fixture registry
    When "gate run --surface=ci --only=unknown" runs
    Then it exits non-zero before invoking any leaf and names the invalid id

  Scenario: A re-staging mutation stages only its outputs
    Given an unrelated worktree edit exists and a successful restaging mutation changes generated paths
    When the mutation runs through pre-commit
    Then git adds only the mutation output paths and preserves the unrelated edit unstaged

  Scenario: A failed mutation never re-stages output
    Given a restaging mutation returns non-zero after changing a path
    When the mutation runs through pre-commit
    Then the dispatcher exits non-zero and does not git-add that path

  Scenario: Pre-commit has one declaration-positioned batch
    Given staged guard precedes file entries and two direct mutations follow them in declaration order
    When "gate run --surface=pre-commit" runs
    Then staged guard, exactly one lint-staged batch, harness generation, and lockfile sync run in that order
```

## R-4 — Conformance enforcement (the core requirement)

`gate validate` is the mechanism that makes the Gate Composition Rule unbreakable. It fails when a
surface file does not invoke what the registry declares, when the registry omits a check a surface
actually runs, and when a gate violates the composition rule itself.

```gherkin
Feature: Gate conformance validation

  Scenario: A check declared for pre-commit but not for ci violates the composition rule
    Given a gate declares type "check" and surface "pre-commit"
    And that gate declares no surface "ci"
    And that gate carries no carve-out
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message cites the Gate Composition Rule
    And the message names the gate id and the missing surface

  Scenario: A mutation at pre-commit does not require a ci counterpart
    Given a gate declares type "mutation" and surface "pre-commit"
    And that gate declares no surface "ci"
    When "rhino-cli gate validate" runs
    Then it exits zero

  Scenario: The staged-only carve-out exempts a check that cannot have a CI counterpart
    Given gate "env-staged-guard" declares type "check" and surface "pre-commit" only
    And it carries carve-out "staged-only"
    When "rhino-cli gate validate" runs
    Then it exits zero
    And the exemption is reported in "gate list" output

  Scenario: A surface file that stops invoking the registry is caught
    Given the registry declares gates on surface "pre-push"
    And ".husky/pre-push" does not invoke "gate run --surface=pre-push"
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the surface file

  Scenario: A CI workflow that hardcodes a check instead of deriving it is caught
    Given "pr-quality-gate.yml" runs a check command that no registry gate declares
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the undeclared command

  Scenario: A hand-wired gate is asserted present but not matrix-derived
    Given gate "test-quick" declares wiring "hand-wired" on surface "ci"
    And "pr-quality-gate.yml" contains a job invoking "test:quick"
    When "rhino-cli gate validate" runs
    Then it exits zero

  Scenario: A hand-wired gate whose job was deleted is caught
    Given gate "test-quick" declares wiring "hand-wired" on surface "ci"
    And "pr-quality-gate.yml" contains no job invoking "test:quick"
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the gate id and the surface file

  Scenario: A hand-wired gate produces no matrix row
    Given gate "test-quick" declares wiring "hand-wired" on surface "ci"
    When "rhino-cli gate list --surface=ci --format=json" runs
    Then the output contains no entry with id "test-quick"

  Scenario: A hand-wired gate is still listed in text output
    Given gate "test-quick" declares wiring "hand-wired" on surface "ci"
    When "rhino-cli gate list --surface=ci --format=text" runs
    Then the output contains an entry with id "test-quick"
    And that entry is marked as hand-wired
    # text output is for humans auditing completeness; json output feeds the
    # matrix, which must not double-run a job that already exists by hand.

  Scenario Outline: A field applied to the wrong gate type is rejected
    Given a gate declares type "<type>"
    And it carries the field "<field>"
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the gate id and the misapplied field

    Examples:
      | type     | field     |
      | check    | restages  |
      | mutation | carve-out |

  Scenario: A gate declaring no surfaces at all is rejected
    Given a gate declares an empty "surfaces" map
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the gate id
    And the message states that a gate must declare at least one surface

  Scenario: A verifies field naming no existing gate is caught
    Given a gate carries "verifies" naming an id no gate declares
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names both the referring gate id and the orphan id

  Scenario: A hand-edited lint-staged block is caught
    Given the "lint-staged" block in package.json differs from what the registry would emit
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names package.json and instructs to run "gate emit --surface=pre-commit"

  Scenario: The shipped configuration passes
    Given the registry and surfaces as shipped by this plan
    When "rhino-cli gate validate" runs
    Then it exits zero
```

### R-4a — lint-staged is generated from the registry

```gherkin
Feature: Generated lint-staged block

  Scenario: The emitter reproduces the registry's per-file entries
    Given the registry declares per-file gates on surface "pre-commit"
    When "rhino-cli gate emit --surface=pre-commit" runs
    Then the "lint-staged" block in package.json contains one glob key per declared glob
    And each key lists that glob's commands in declaration order

  Scenario: Re-running the emitter is idempotent
    Given "rhino-cli gate emit --surface=pre-commit" has already run
    When it runs a second time
    Then package.json is byte-identical to the first result
    And the block appears exactly once
```

## R-5 — `main-ci.yml` retired without losing checks

Every check that exists **only** in `main-ci.yml` today reaches the PR gate before `main-ci.yml` is
deleted. Deletion follows the fold-in, never precedes it.

```gherkin
Feature: main-ci retirement

  Scenario: Mermaid validation reaches the PR gate before main-ci is deleted
    Given "md mermaid validate" runs only in main-ci.yml
    When the fold-in step completes
    Then "md mermaid validate" is declared on surface "ci"
    And it appears in "gate list --surface=ci --format=json"

  Scenario: Heading-hierarchy validation reaches the PR gate before main-ci is deleted
    Given "md heading-hierarchy validate" runs only in main-ci.yml
    When the fold-in step completes
    Then "md heading-hierarchy validate" is declared on surface "ci"

  Scenario: The specs job stops being pinned to a single project
    Given the PR gate ran "specs:structure-validation" with "--projects=rhino-cli"
    When the rewire completes
    Then the PR gate runs the structural specs validator over the affected project set
    And no surface passes "--projects=rhino-cli" to that target

  Scenario: main-ci.yml is absent and unreferenced
    Given the fold-in is complete
    When the retirement step completes
    Then ".github/workflows/main-ci.yml" does not exist
    And no tracked markdown file references "main-ci"
```

## R-6 — `harness bindings validate` reaches CI

```gherkin
Feature: Binding parity enforced server-side

  Scenario: An unsynced mirror pushed without hooks is caught by CI
    Given a commit changes ".claude/agents/" without regenerating ".opencode/agents/"
    And the commit is pushed with hooks bypassed
    When the PR gate runs
    Then the gate declaring "harness bindings validate" fails
```

## R-7 — Formatting is verified, not silently rewritten

The ratified standard exempts formatters from being _checks_ at pre-commit, where they auto-fix.
This plan expresses that structurally rather than as an exemption: formatters are declared
`type: mutation`, and the composition rule applies only to `type: check`. That exemption does not
justify a `main` branch carrying unformatted files, so a `format-verify-*` check is added on the CI
surface — an ordinary check, needing no carve-out, since the rule runs pre-commit/pre-push ⇒ ci and
never the reverse.

**One verify gate per formatter.** The four repos run up to fourteen formatters (prettier, rustfmt,
gofmt, fantomas, ruff, csharpier, cljfmt, dart, the Elixir script, shfmt, tofu, stylua, clang-format,
buildifier — see [tech-docs §2.2.4](./tech-docs.md#224-the-full-formatter-and-per-file-inventory)).
A single `prettier --check` would verify only prettier-owned file types and leave the other thirteen
languages exactly as unverified as they are today. `gate validate` therefore enforces the pairing
mechanically, so a formatter added later cannot arrive without its check.

```gherkin
Feature: Formatting verification

  Scenario Outline: An unformatted file fails the CI surface, whatever its language
    Given a tracked "<ext>" file is not formatted per its language formatter
    And the commit is pushed directly to main with hooks bypassed
    When the PR gate runs on the push event
    Then the gate with id "<verify-id>" fails
    And the failure names the offending file

    Examples:
      | ext | verify-id              |
      | md  | format-verify-prettier |
      | rs  | format-verify-rustfmt  |
      | go  | format-verify-gofmt    |
      | fs  | format-verify-fantomas |
      | sh  | format-verify-shfmt    |

  Scenario: A formatter without a verifying check fails validation
    Given a gate declares type "mutation" and a formatter command
    And no gate declares a "verifies" field naming that gate id
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And the message names the unverified formatter

  Scenario: gofmt is wrapped because it cannot fail on its own
    Given a tracked ".go" file is not formatted
    When the gate with id "format-verify-gofmt" runs
    Then it exits non-zero
    And the wrapper treats non-empty "gofmt -l" output as failure

  Scenario: The Elixir formatter script gains a check mode that fails
    Given a tracked ".ex" file is not formatted
    When the gate with id "format-verify-elixir" runs
    Then it exits non-zero
    And no tracked file is rewritten

  Scenario: The Elixir check mode passes on formatted sources
    Given every tracked ".ex" and ".exs" file is formatted
    When the gate with id "format-verify-elixir" runs
    Then it exits zero
    And no tracked file is rewritten

  Scenario Outline: Non-standard failure exit codes still fail the gate
    Given a tracked "<ext>" file is not formatted
    When the gate with id "<verify-id>" runs
    Then it exits with code "<code>"
    And the gate treats any non-zero exit as failure

    Examples:
      | ext   | verify-id                | code |
      | fs    | format-verify-fantomas   | 99   |
      | bzl   | format-verify-buildifier | 4    |

  Scenario Outline: No verify gate carries a flag that suppresses failure
    Given the gate with id "<verify-id>"
    When its command is read
    Then it does not contain "<forbidden-flag>"

    Examples:
      | verify-id                | forbidden-flag             |
      | format-verify-elixir     | --no-exit                  |
      | format-verify-csharpier  | --unformatted-as-warnings  |

  Scenario: The dart verify gate does not rewrite files
    Given the gate with id "format-verify-dart"
    When its command is read
    Then it contains "-o none"

  Scenario: Formatters still auto-fix at pre-commit
    Given an unformatted file is staged
    When the pre-commit surface runs
    Then the file is rewritten in place and re-staged
    And the commit is not aborted for formatting alone
```

## R-7a — Each repo declares only the formatters it actually needs

A `git ls-files` audit found **19 declared formatter entries across the four repos that match zero
tracked files** — `ose-public` declaring Go, Elixir, C#, Clojure and Dart formatters for languages it
does not contain; `beaver-nest` declaring nine. Three defects run the other way: `ose-primer` and
the private sibling `shellcheck` shell scripts they never format, and the private sibling has tracked `.tf` files
outside `lint-staged` entirely.

The rule is presence-based: a formatter is declared **if and only if** the repo has at least one
tracked file matching its glob. Entry sets therefore differ per repo; the schema and engine do not
([tech-docs §2.2.4](./tech-docs.md#224-the-full-formatter-and-per-file-inventory)).

```gherkin
Feature: Presence-based formatter declaration

  Scenario Outline: A repo declares no formatter for a language it does not contain
    Given "<repo>" tracks zero "<ext>" files
    When "rhino-cli gate list --format=json" runs in that repo
    Then no gate declares a glob matching "<ext>"

    Examples:
      | repo        | ext   |
      | ose-public  | .go   |
      | ose-public  | .dart |
      | private-sibling | .fs   |
      | private-sibling | .py   |
      | beaver-nest | .lua  |
      | beaver-nest | .tf   |

  Scenario Outline: A repo declares a formatter for every language it does contain
    Given "<repo>" tracks at least one "<ext>" file
    When "rhino-cli gate list --format=json" runs in that repo
    Then exactly one type "mutation" gate declares a glob matching "<ext>"
    And exactly one type "check" gate verifies it

    Examples:
      | repo        | ext  |
      | ose-primer  | .sh  |
      | ose-primer  | .sql |
      | private-sibling | .sh  |
      | private-sibling | .tf  |

  Scenario: Pruning does not breach byte-identity
    Given the four repos declare different formatter entry sets
    When apps/rhino-cli is compared across them
    Then the boundary file set is byte-identical
    And "rhino-cli repo-config validate" exits zero in each repo

  Scenario: Adopting a new language is not blocked by the rule
    Given a repo tracks zero ".go" files
    When a commit introduces the first ".go" file
    Then no gate fails for the absence of a Go formatter
```

## R-8 — `deps:audit` excluded from the registry, given its own named workflow

`deps:audit` is **not** a gate and is **not** in `gates:`. It is non-hermetic — it reads a remote
advisory database that moves independently of the code — so a green commit can turn red with no
repository change. Ratified rule 3 already keeps it out of every gate; this plan keeps it out of the
registry too, because a scheduled job that no composition rule governs, that emits no CI matrix row,
and that no hook invokes is not a surface.

It gets visibility the honest way instead: a dedicated workflow whose name says what it does.
`deps-audit.yml` is replaced by `dependency-vulnerability-audit.yml`
(`name: Dependency Vulnerability Audit`) in all four repos. See
[tech-docs §2.2.3](./tech-docs.md#223-what-is-deliberately-outside-the-registry).

```gherkin
Feature: Dependency audit lives outside the gate registry

  Scenario: deps:audit is absent from the registry entirely
    Given the registry as shipped by this plan
    When "rhino-cli gate list --format=json" runs
    Then the output contains no entry with id "deps-audit"
    And the output contains no entry whose command is "deps:audit"

  Scenario: Excluding it does not weaken the completeness claim
    Given the registry declares no gate for "deps:audit"
    When "rhino-cli gate validate" runs
    Then it exits zero
    And no gate surface invokes "deps:audit"

  Scenario: The old workflow is gone and the new one carries a descriptive name
    Given the rename is complete
    When the ".github/workflows" directory is listed
    Then ".github/workflows/deps-audit.yml" does not exist
    And ".github/workflows/dependency-vulnerability-audit.yml" exists
    And its "name:" field is "Dependency Vulnerability Audit"
    And its schedule and dispatch triggers are unchanged from the workflow it replaces

  Scenario: The new name satisfies the mechanical filename derivation
    Given the workflow "name:" is "Dependency Vulnerability Audit"
    When the naming convention's transformation is applied
    Then the result is "dependency-vulnerability-audit.yml"
    And that matches the filename exactly

  Scenario: One identical name across all four repos
    Given each repo ships the scheduled dependency-audit workflow
    When the "name:" fields are compared across the four repos
    Then they are identical
    And ose-primer no longer ships "Nightly Dependency Audit" inside a file named deps-audit.yml

  Scenario: The naming convention is amended to make the new name legal
    Given "dependency" is not in the cross-cutting domain list
    And "audit" is not in the verb vocabulary
    When the amendment lands
    Then the convention lists both
    And the Cross-cutting workflows table registers the new workflow
    And that table no longer lists main-ci.yml
```

## R-9 — Documentation agrees with the implementation

```gherkin
Feature: Standard and implementation agree

  Scenario: The Gate Composition Rule reflects the retired main gate
    Given main-ci.yml is deleted
    When the SDLC Gate Standard is read
    Then the composition rule reads "(pre-commit ∪ pre-push) == PR gate"
    And the lifecycle stage table lists no main quality gate stage

  Scenario: The stale hook-lifecycle doc is corrected
    Given git-hook-lifecycle.md described a pre-push that no longer exists
    When the rewrite completes
    Then it names no target that does not exist
    And it names no workflow file that does not exist
    And its check list is generated from or verified against the registry

  Scenario: private-sibling gains the hook-lifecycle doc it lacks
    Given private-sibling has no git-hook-lifecycle.md
    When propagation completes
    Then the document exists in private-sibling
```

## R-10 — Cross-repo parity preserved

The `apps/rhino-cli` byte-identity boundary spans **all four repos** with zero carve-outs (extended
from three by R-11; see [tech-docs §2.8.6](./tech-docs.md#286-the-governance-change-this-requires)).
The registry is **data**, not source: gate entry _sets_ may differ per repo (they follow each repo's
actual app and tool set), while the schema and the engine are identical.

```gherkin
Feature: Byte-identity and schema parity

  Scenario: The engine is byte-identical across all four bound repos
    Given the gate engine lands in apps/rhino-cli
    When src/, tests/, Cargo.toml, Cargo.lock, project.json and LICENSE are compared
    Then ose-public, ose-primer, private-sibling and beaver-nest are byte-identical

  Scenario: Registry values may differ per repo but the schema may not
    Given private-sibling declares an "iac-lint" gate that ose-public does not
    When "rhino-cli repo-config validate" runs in each repo
    Then each exits zero
    And each gate entry conforms to the same schema

  Scenario: beaver-nest carries the same guarantee without a fork
    Given beaver-nest has joined the byte-identity boundary
    When the rewire completes
    Then "rhino-cli gate validate" exits zero in beaver-nest
    And "rhino-cli parity manifest validate" exits zero in beaver-nest
```

## R-11 — `rhino-cli` byte-identity is mechanically enforced across all four repos

The
[rhino-cli Byte-Identity Boundary](../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)
is ratified prose that nothing enforces, and it is **already violated**:
`src/application/agents/sync_validator.rs` differs between `ose-public` and the other two bound
repos. This plan extends the boundary to four repos, adds `apps/rhino-cli/tests/` to the file set,
and makes it enforceable.

Enforcement splits on hermeticity, exactly as [R-8](#r-8--depsaudit-excluded-from-the-registry-given-its-own-named-workflow)
splits `deps:audit`: a committed checksum manifest is checked by an ordinary gate, and the cross-repo
comparison — which needs the network and another repo's moving `HEAD` — is a scheduled workflow
outside the registry.

```gherkin
Feature: Byte-identity manifest

  Scenario: An unannounced edit to byte-identical source fails the gate
    Given apps/rhino-cli/parity-manifest.sha256 is committed and current
    And a tracked file in the boundary set is edited
    When the gate with id "parity-manifest" runs
    Then it exits non-zero
    And the message names the file
    And the message states the file is byte-identical across all four repos
    And the message names "rhino-cli parity manifest generate" as the deliberate remedy

  Scenario: The manifest never regenerates itself
    Given a tracked file in the boundary set is edited and staged
    When the pre-commit surface runs
    Then no gate rewrites apps/rhino-cli/parity-manifest.sha256
    And "rhino-cli gate list --surface=pre-commit --format=json" contains no entry
      whose command is "parity manifest generate"

  Scenario: The manifest covers tests/ as well as src/
    Given apps/rhino-cli/tests/agents.rs is edited
    When the gate with id "parity-manifest" runs
    Then it exits non-zero

  Scenario: Untracked files never enter the manifest
    Given an untracked file exists under apps/rhino-cli/tests/fixtures/
    When "rhino-cli parity manifest generate" runs
    Then the untracked file is absent from the manifest
    And the gate with id "parity-manifest" exits zero

  Scenario: Regeneration is idempotent
    Given "rhino-cli parity manifest generate" has run
    When it runs a second time
    Then apps/rhino-cli/parity-manifest.sha256 is byte-identical to the first result

  Scenario: An intentional manifest regeneration is staged before validation
    Given a tracked byte-identity boundary file changes intentionally
    When "rhino-cli parity manifest generate" runs
    And apps/rhino-cli/parity-manifest.sha256 is staged
    And "rhino-cli parity manifest validate" runs
    Then validation evaluates the prospective index
    And the staged manifest matches the boundary files that would be committed

  Scenario: The live three-repo violation is closed
    Given sync_validator.rs carried "opencode-go/wrong" in ose-public
    And it carried "zai-coding-plan/wrong" in ose-primer and private-sibling
    When convergence completes
    Then all four repos carry the identical fixture string
    And the model-mismatch test still fails on a mismatched model
```

## R-12 — Cross-repo drift is audited, not gated

The manifest gate cannot catch coordinated drift: a repo that edits boundary source **and**
regenerates its manifest passes its own gate. Detecting that requires a reference, which requires the
network, which disqualifies it from being a gate under this plan's own hermeticity rule.

```gherkin
Feature: Cross-repo parity audit

  Scenario: The audit workflow is scheduled, never a gate
    Given the workflow rhino-cli-parity-audit.yml
    When its triggers are read
    Then they are "schedule" and "workflow_dispatch" only
    And it carries no "push" or "pull_request" trigger
    And "rhino-cli gate list --format=json" contains no entry invoking it

  Scenario: A downstream repo detects manifest divergence from canonical
    Given ose-public's parity-manifest.sha256 differs from ose-primer's
    When rhino-cli-parity-audit.yml runs in ose-primer
    Then it reports failure
    And the report names each differing path

  Scenario: private-sibling can read canonical without credentials
    Given ose-public is a public repository
    When rhino-cli-parity-audit.yml runs in private-sibling
    Then it fetches ose-public's manifest unauthenticated
    And no private-sibling content is transmitted

  Scenario: The workflow name derives mechanically from its filename
    Given the workflow file rhino-cli-parity-audit.yml
    When its "name" field is lowercased and spaces become hyphens
    Then the result equals the filename without its extension
```

## R-13 — Repo-specific data leaves shared source

Eight of `beaver-nest`'s ten current source divergences are `ose-public`'s app names hardcoded into
byte-identical source. Until that data moves into `repo-config.yml`, byte-identity across four repos
is unreachable. Its general F# environment-scanning and inherited-Git-state isolation fixes must
also flow upstream before canonical is copied down. This requirement is therefore a precondition of
R-11, not a companion to it.

```gherkin
Feature: Repo-specific data lives in configuration

  Scenario: Enumerated shared-data sites contain no real app names
    Given the bounded bindings, frontmatter, coverage, specs-count, specs-coverage and doctor source sites
    When those sites are searched for "ayokoding", "organiclever", "wahidyankf", "ose-be" and "ose-www"
    Then no match remains and unrelated environment-contract examples are outside this extraction

  Scenario: The dead pre-commit pipeline is removed
    Given commands/git_pre_commit.rs is wired to no CLI subcommand
    When it and application/git/pre_commit.rs are deleted
    Then "cargo build --release" succeeds
    And the full test suite passes
    And "rhino-cli --help" lists the same commands as before the deletion

  Scenario: Gate exclusion lists move to the registry
    Given WEBSITE_APP_PREFIXES was a hardcoded const in frontmatter_audit.rs
    When convergence completes
    Then those paths are declared as "args.exclude" on the gate that consumes them
    And the const no longer exists in source

  Scenario: Amazon Q definition name moves to harness configuration
    Given bindings.rs hardcoded the Amazon Q definition name
    When convergence completes
    Then harness.amazonq.agent-name supplies the generated filename and embedded definition name
    And the definition name no longer exists in shared Rust source

  Scenario: beaver-nest's naming exemptions are upstreamed before any copy
    Given beaver-nest exempts ROADMAP.md and SECURITY.md from md naming validate
    And canonical ose-public does not
    When Phase 11 completes
    Then canonical exempts both
    And "md naming validate" passes on a ROADMAP.md fixture in ose-public
    And this holds before any downstream repo copies canonical

  Scenario: F# environment wrapper reads remain detectable after convergence
    Given beaver-nest detects app-owned keys passed to a pure readEnvironment wrapper
    And it excludes the framework-owned DOTNET_RUNNING_IN_CONTAINER signal
    When Phase 11 upstreams the scanner into canonical
    Then canonical retains both behaviors with regression tests
    And the generic Gherkin scenario lands before any downstream copy

  Scenario: Rust test targets ignore inherited Git process state
    Given a rhino-cli test target is invoked with inherited GIT_DIR, GIT_WORK_TREE and GIT_COMMON_DIR
    When Nx launches the Rust test or coverage command
    Then all three inherited variables are cleared for that command
    And a regression test protects the target configuration before any downstream copy
```

## Out of Scope

| Excluded                                              | Rationale                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Emitting per-language CI jobs from the registry       | They need per-language toolchain setup actions; `gate validate` asserts their presence instead                                    |
| Adding `test:integration` / `test:e2e` to any gate    | Ratified rule 3 — uncacheable tiers stay cron-only                                                                                |
| Adding `deps:audit` to a gate surface or the registry | Non-hermetic; excluded by decision — see R-8 and [tech-docs §2.2.3](./tech-docs.md#223-what-is-deliberately-outside-the-registry) |
| Restoring a full-repo sweep                           | Deliberately declined; see [brd.md §Accepted Risk](./brd.md#accepted-risk)                                                        |
| Changing the five controlled scope values             | Ratified vocabulary reused verbatim                                                                                               |
| Blocking a merge on cross-repo parity                 | Non-hermetic; R-12 audits and reports, it does not gate                                                                           |
| Extending byte-identity beyond `apps/rhino-cli`       | The boundary gains `tests/` and one manifest file; no other shared directory is drawn in                                          |

## Product Risks

Product-level risks — UX and feature-interaction risk for the registry's consumers — distinct from
`brd.md`'s business risk (the accepted loss of a full-repo sweep, see
[brd.md §Accepted Risk](./brd.md#accepted-risk)):

- **A malformed `gates:` entry silently misapplies or drops a check.** A maintainer or agent
  authoring a new gate mistypes a scope, type, or surface value. Mitigated by `repo-config validate`
  failing at parse time and naming the offending gate id (R-1).
- **A hand-wired CI job is deleted without updating the registry.** `wiring: hand-wired` gates
  (R-4's `test-quick` scenarios) assert presence rather than generating the job; deleting the job
  without touching `repo-config.yml` would silently lose coverage if `gate validate` did not catch
  it. Mitigated by the corresponding "hand-wired gate whose job was deleted is caught" scenario (R-4).
- **A formatter ships without its verify counterpart, or vice versa.** A new mutation-type formatter
  gate added without a matching `format-verify-*` check leaves a language auto-rewritten but never
  verified on CI; the reverse leaves a check with nothing to enforce. Mitigated by the "formatter
  without a verifying check fails validation" scenario (R-7).
- **A downstream repo's registry data set diverges from what its tracked files actually need**,
  e.g. a repo keeps a formatter entry for a language it no longer tracks, or omits one for a
  language it just added. Mitigated by the presence-based declaration rule and its Gherkin coverage
  (R-7a).
