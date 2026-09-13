# Enforce Identical, Fully-Enforcing rhino-cli Gherkin Across the Three OSE Repos

**Status**: In Progress
**Created**: 2026-07-03
**Authored in**: `ose-public` (this repo)
**Type**: Multi-file plan (5 documents) — **one 3-repo execution plan**
**Predecessors**:

- [`done/2026-07-01__standardize-rhino-cli-sdlc-parity`](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md)
- [`done/2026-07-03__unify-rhino-cli-sdlc-parity`](../../done/2026-07-03__unify-rhino-cli-sdlc-parity/README.md)

> This is a **single comprehensive plan that executes across all three repos** (`ose-public` →
> Phases 0–2, `ose-primer` → Phase 3, `ose-infra` → Phase 4, cross-repo verify + anti-drift gate →
> Phase 5). It is the **third pass** on rhino-cli parity, and its north star is the one thing the
> first two passes both claimed but did not deliver: rhino-cli's **behaviour** is genuinely
> **identical and enforced** in all three repos, via a **byte-identical Gherkin tree** whose scenarios
> **actually execute** — not skipped-by-data.

## Context

The rhino-cli **source** (`apps/rhino-cli/**`) is already 100% byte-identical across `ose-public`,
`ose-primer`, and `ose-infra` (verified: only untracked coverage artifacts, `README.md`, and a stray
generated `.amazonq/` dir differ — none are behaviour). [Repo-grounded]

The problem is entirely in the **Gherkin behaviour tree**, which lives at
`specs/apps/rhino/behavior/rhino-cli/gherkin/` — **outside** the `apps/rhino-cli` byte-identity
boundary. Because nothing gates it, it drifted, and a fresh audit (2026-07-03, this plan's pre-work)
found two compounding failures:

1. **The tree is not identical.** `ose-public` (51 `.feature` files) and `ose-infra` (51, byte-identical
   to public) agree; **`ose-primer` (30) is stale** — ~9 files content-diverged, ~23 missing, and 2
   files present only in primer that describe **renamed/removed** command surfaces
   (`env/env-validate.feature`, `repo-governance/repo-governance-gherkin-keyword-cardinality.feature`).
   This is the same "claimed-identical vs actually-diverged" gap the
   [second-pass plan](../../done/2026-07-03__unify-rhino-cli-sdlc-parity/README.md) existed to close —
   it closed it for infra but left primer half-synced. [Repo-grounded]

2. **Over half the behaviour is not enforced.** Of **228** cucumber scenarios in `ose-public`,
   **121 (53%) are skipped-by-data**, not executed: `repo_governance` **61/61** and `workflows`
   **4/4** are entirely hollow, `docs` skips **43/69**, `agents` skips **13/28**. Root cause: the
   [union synthesis](../../done/2026-07-03__unify-rhino-cli-sdlc-parity/audit/feature-union.md) renamed
   commands, but the step-definition strings in the byte-identical `tests/*.rs` still target the **old**
   command names, so cucumber-rs marks the steps _undefined → skipped_ (not failed) and the suite exits 0. **CI is green while the tool's behaviour is under-half tested.** A further **16 `.feature` files**
   in 4 dirs (`ddd/`, `git/`, `specs/`, `test-coverage/`) are bound to **no** test binary at all — pure
   spec, never executed. [Repo-grounded]

Per the user directive: _"the goal is to make sure all rhino-cli in all 3 repos is identical, including
its commands and behaviour; the behaviour should be enforced via Gherkin files in specs; the Gherkin
specs should be all the same and identical in all 3 repos; and all behaviour should have its own
Gherkin files."_

## Scope

**In scope:**

- **De-hollow the canonical tree** (`ose-public`) — every skipped-by-data scenario is made to
  **actually execute and pass** by aligning the step-definition vocabulary in `apps/rhino-cli/tests/*.rs`
  to the **real, current** command names, and by wiring the 4 currently-unbound feature dirs
  (`ddd/`, `git/`, `specs/`, `test-coverage/`) to cucumber test binaries so their scenarios run.
- **Gap-fill coverage** — every **leaf rhino-cli command** owns **≥ 1 real enforcing scenario**
  (coverage model: **per-command-group + gap-fill** — keep the domain-grouped layout, guarantee
  coverage). Known gaps to close: `specs gherkin-cardinality` (no feature today), and the two
  behaviours behind primer's stale files re-expressed against current command names.
- **Align feature-dir names to command groups** — rename mismatched feature dirs so each maps to its
  command group (`gherkin/docs/` → `gherkin/md/`, `gherkin/agents/` → `gherkin/harness/`, plus any other
  mismatch found in Phase 0) and retarget the `feature_dir()` bindings in `tests/*.rs`.
- **Byte-identical Gherkin tree across all three repos** — all `.feature` files **and** their
  behaviour-tree `README.md` files under `specs/apps/rhino/behavior/rhino-cli/gherkin/` are 100%
  byte-identical across `ose-public`, `ose-primer`, `ose-infra`. `ose-public` is canonical (already
  matched by infra); primer is brought into line; any de-hollow source change propagates to all three.
- **rhino-cli source stays byte-identical** — the `tests/*.rs` step-def edits + regenerated
  golden-master propagate identically to all three (zero carve-outs preserved).
- **Anti-drift gate** — extend the existing cross-repo rhino-cli byte-identity boundary
  ([SDLC Gate Standard](../../../docs/reference/sdlc-gate-standard.md)) to explicitly cover the Gherkin
  tree, and add a verification step to the
  [multi-repo parity workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
  so the tree can never silently diverge again.
- **Re-place `repo-config validate` at pre-commit (staged) + PR gate + main gate; remove from pre-push**
  (Decision 8) — the schema-parity gate currently runs only at **pre-push** in all three. Move it to:
  (1) `.husky/pre-commit` staged-gated (fires only when `repo-config.yml` is staged), (2)
  `.github/workflows/pr-quality-gate.yml`, (3) `.github/workflows/main-ci.yml`; and **remove** it from
  `.husky/pre-push`. Byte-identical across all three repos, following the existing lockfile-sync
  staged-gating pattern.

**Out of scope** (carried forward from the predecessor plans' divergence policy):

- Validator **logic/behaviour changes** — this plan aligns step vocabulary and coverage, it does not
  change what any validator decides. Where a scenario is de-hollowed, the assertion it gains is the one
  it always described.
- The higher **C4 architecture docs** under `specs/apps/rhino/` (`product/`, `system-context/`,
  `components/`, `containers/`) — identity scope is the Gherkin `.feature` files + their behaviour-tree
  `README.md` only. C4 prose may carry repo-specific framing.
- Each repo's app/language set, infra-only IaC gates, and the self-hosted runner label (CI-workflow
  layer allowed-divergence) — never inside `apps/rhino-cli`.
- `repo-config.yml` per-repo **data values** (identical **schema** already enforced by the
  schema-parity gate).

## Approach Summary

1. **Phase 0** — fresh re-audit committed as evidence (command census, hollow-scenario census,
   unbound-dir census, cross-repo diff); clean green baseline recorded in all three repos.
2. **Phase 1 (`ose-public`, canonical)** — de-hollow: align `tests/*.rs` step vocab to real commands so
   all 121 skipped scenarios execute; wire the 4 unbound dirs; gap-fill uncovered commands (incl.
   `specs gherkin-cardinality`); regenerate the golden-master. Acceptance: **0 skipped scenarios**,
   suite green.
3. **Phase 2 (`ose-public`)** — freeze the canonical Gherkin tree + updated `apps/rhino-cli` as the
   propagation source; record a manifest.
4. **Phase 3 (`ose-primer`)** — propagate canonical `apps/rhino-cli` + Gherkin tree; assert byte-identity
   and a fully-enforcing (0-skip) suite.
5. **Phase 4 (`ose-infra`)** — propagate + verify (already feature-identical to public; picks up the
   de-hollow source changes + any gap-fill).
6. **Phase 5** — cross-repo byte-identity verification; extend the SDLC parity gate + parity workflow;
   commit + push all three to `main`; CI green.

## Confirmed Decisions (user-ratified 2026-07-03)

Resolved via structured pre-write grilling:

1. **Coverage model** = **per-command-group + gap-fill** — keep the domain-grouped layout
   (`env/`, `agents/`, `repo-governance/`, …); guarantee every leaf command has ≥ 1 **real enforcing**
   scenario and de-hollow all skipped ones. (Not a strict 1-file-per-command reshuffle.)
2. **Anti-drift** = **extend the SDLC parity gate** — bring the Gherkin tree into the existing
   cross-repo rhino-cli byte-identity boundary (doc + parity-workflow verification step); no new runtime
   command.
3. **Identity scope** = the Gherkin `.feature` files **and** their behaviour-tree `README.md` files are
   byte-identical; C4 architecture docs are left alone.
4. **Feature-dir naming** = rename feature dirs to **match their command group** (confirmed:
   `gherkin/docs/` → `gherkin/md/`, `gherkin/agents/` → `gherkin/harness/`; Phase 0 produces the full
   rename mapping for any other mismatched dir) and retarget the `feature_dir()` bindings in
   `tests/*.rs`. This removes the dir-name↔command-name mismatch that itself drives the hollow-skips.
5. **Test tiers** = keep **both** `test:unit` and `test:integration` for rhino-cli, both real:
   - `test:unit` = **in-process + mocked I/O seam** — introduce a filesystem/git abstraction
     (functional-core/imperative-shell) in rhino-cli core; step defs call core validators in-process with
     mocked deps (no subprocess, no real git). Fast + deterministic → runs in the pre-push `test:quick`
     gate (which today runs `test:unit --lib` only, so the behaviour suite is **currently ungated at
     pre-push**).
   - `test:integration` = **temp-fixture isolation** — the current style (spawn the built binary via
     `assert_cmd` against temp-dir + fake-git fixtures), retained as the heavier tier.
     `repo-config.yml` keeps `rhino-cli levels: [unit, integration]`.
6. **Fail-on-skip** = configure the cucumber harness so an undefined/skipped step **fails** the run
   (`.fail_on_skipped()` or equivalent). This makes de-hollowing self-enforcing: after it, any hollow
   scenario is a red build, not a silent skip.
7. **`@covers` completeness (rhino-cli)** = every rhino-cli scenario carries its `@unit`/`@integration`
   level tag(s) and a matching `// @covers` marker at each, so `specs behavior-coverage validate` passes
   meaningfully for rhino-cli. (Repo-wide `@covers` rollout is a **separate follow-on plan** that assumes
   this plan is done.)
8. **repo-config gate placement** = `repo-config validate` runs at **pre-commit** (staged-gated when
   `repo-config.yml` changes) + the **PR quality gate** + the **main quality gate**, and is **removed from
   pre-push**. Byte-identical across all three repos.
9. **NO DEFER, NO SHORTCUT (hard rule)** = the hollow scenarios exist precisely because the prior plans
   deferred work and took the skip-by-data shortcut. This plan forbids both. Every scenario in scope is
   **fully implemented and passing** before its phase gate — no scenario is skipped, `@wip`-tagged,
   marked-without-a-real-test, stubbed, "temporarily" left, or deferred to a follow-up. No `⚠️`
   "functionally-equivalent" waivers. The **0-skipped** gate is absolute: a scenario that cannot be made
   to pass means its behaviour is fixed or the scenario is corrected — never parked. If genuine new scope
   is discovered, it is added to this plan and completed here, not deferred out.

Standing decisions inherited from predecessors: `ose-public` is canonical; `apps/rhino-cli` keeps
**zero carve-outs** (100% byte-identical); golden-master regenerated post-synthesis; each phase gate
asserts the touched repo passes its own full gate before pause.

## Navigation

- [brd.md](./brd.md) — why this matters (business rationale)
- [prd.md](./prd.md) — what "done" looks like (personas, user stories, Gherkin acceptance criteria)
- [tech-docs.md](./tech-docs.md) — verified current state, canonical model, de-hollow mechanism,
  anti-drift design, per-repo file impact, diagrams, rollback
- [delivery.md](./delivery.md) — the phased execution checklist

## Related

- [First plan](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md) — SDLC gate mechanics
- [Second plan](../../done/2026-07-03__unify-rhino-cli-sdlc-parity/README.md) — canonical union synthesis
- [SDLC Gate Standard](../../../docs/reference/sdlc-gate-standard.md) — rhino-cli byte-identity boundary
- [plan-multi-repo-parity-planning workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
- [AGENTS.md §Related Repositories](../../../AGENTS.md) — the three-repo parity model

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
