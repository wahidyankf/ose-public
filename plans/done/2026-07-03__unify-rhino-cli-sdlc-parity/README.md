# Unify rhino-cli, SDLC & Repo Structure Across the Three OSE Repos (Second Pass)

**Status**: Done
**Created**: 2026-07-02
**Completed**: 2026-07-03
**Authored in**: `ose-public` (this repo)
**Type**: Multi-file plan (5 documents) — **one giant 3-repo execution plan**
**Predecessor**: [`done/2026-07-01__standardize-rhino-cli-sdlc-parity`](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md)

> This is a **single comprehensive plan that executes across all three repos** (`ose-public` →
> Phases 0–2, `ose-primer` → Phase 3, `ose-infra` → Phase 4, cross-repo verify → Phase 5), exactly
> like the first plan. It is a **second pass** whose north star is closing the gap between the first
> plan's _claimed_ `"identical"` end-state and the _actual_ divergence a fresh audit found.

## Context

The [first plan](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md) standardized the
SDLC gate **mechanics** and the rhino-cli **target set / command set** across `ose-public`,
`ose-primer`, and `ose-infra`. It archived on 2026-07-01 with a large set of items marked done and a
handful marked deferred/`⚠️` ("functionally equivalent, mechanism differs, documented").

A fresh verification sweep (2026-07-02, this plan's Phase 0 pre-work) found that:

1. **Most of the first plan's _deferred_ items are already resolved** by post-archival follow-up
   commits (primer's echo-stubbed `specs:behavior:coverage` are now real; infra's env-guard is now the
   Rust command; `harness duplication` was re-wired; `cucumber` is now a dependency; `test:specs`
   landed; the domain-scoping gate is wired).
2. **But the headline `"identical"` claim is stale.** rhino-cli is _not_ identical across the three
   repos (three different points of a functional-core refactor: public 155 src files, primer 231,
   infra 235; infra differs from public in 100 of ~155 files with a different module-naming scheme and
   a `cli.rs` 132 lines longer). SDLC wiring is byte-identical between public and primer but
   **ose-infra diverges throughout** (`npx nx`/`npm run` wrappers instead of direct `cargo run`,
   inline tool-lint instead of lint-staged, Title-Case workflow names, missing CI jobs). Several
   smaller gaps and **two latent bugs** remain (see [tech-docs §2](./tech-docs.md#2-current-state-verified-2026-07-02)).
3. **A second, deeper sweep corrected the cucumber current-state.** The `.feature` trees diverge
   _structurally_ (public 41 files with `ddd`/`specs` dirs unique to it — public and primer share
   `workflows`, which only infra lacks; primer 26 and infra 22 additionally carry
   `contracts`/`java`/`test-coverage` dirs public lacks) — so all three repos already ship `.feature`
   specs and `tests/*.rs`; only the `[[test]]` cucumber-harness registration is primer-only, and primer
   is on the _older_ cucumber `0.22.1` while public/infra are on `0.23.0`. The canonical BDD surface is
   therefore the **reconciled union** of all three trees (migrated to `0.23.0`), not a copy of
   primer's.

This second pass **re-audits against reality, ignores stale "done" notes, and drives all three repos
to a genuinely `"identical"` structure** — including the rhino-cli source itself, not just its target
set — so that working cross-repo is truly identical. Per the user directive: _"the rhino-cli should
also be 'identical', because the overall structure of the repo will be 'identical'."_

## Scope

**Same surface as the first plan** (see [first-plan scope](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md#scope))
— every rhino-cli command, the full SDLC surface (commit-msg, pre-commit, pre-push, PR quality gate,
main-branch CI, env/markdown/specs/governance validation, CRON test+deploy pipelines), Nx target
names, per-project target contents, specs C4 structure, unified `repo-config.yml`, harness bindings,
and canonical GitHub CI — **plus** the following second-pass additions:

- **rhino-cli source `"identical"`** (new, load-bearing) — the Rust source, `Cargo.toml`,
  `Cargo.lock`, `project.json`, and an `apps/rhino-cli/LICENSE` file of `apps/rhino-cli` converge to
  one canonical form **100% byte-identical across all three repos, zero carve-outs** (infra
  relicensed to MIT; repo-specific inputs data-driven from `repo-config.yml`). The canonical source
  carries the **union of all three command surfaces**, so every repo's binary holds the full command
  superset (repo-inapplicable verbs are dormant, not absent). See
  [tech-docs §4](./tech-docs.md#4-rhino-cli-source-identity-standard).
- **cucumber-rs BDD harness in all three** — primer's harness structure (`tests/*.rs` + fixtures +
  golden-master) becomes canonical **migrated to `0.23.0`**, and the `.feature` surface becomes the
  **reconciled union** of all three repos' trees — present + passing identically in all three (public +
  infra currently declare the dep but don't register the `[[test]]` harness).
- **Full `namedInputs.specs` rollout** — every Nx-registered project in every repo (not the current
  16/29, 20/26, 6/8, counted against the full `nx show projects` graph — which includes the
  `*-contracts` projects rooted under `specs/apps/*/containers/contracts/`, invisible to a
  directory-only `apps`/`libs` scan) wires the specs input so a specs-only change is caught at
  pre-push/PR, not just main-ci.
- **`repo-config.yml` schema-parity gate** — a new `rhino-cli repo-config validate` command that
  strict-deserializes `repo-config.yml` against the byte-identical canonical schema, giving all three
  configs an identical key set as an emergent property (values may differ), so the byte-identical
  source can safely read config keys without silent runtime breakage. Wired at **pre-commit**
  (fast path, fires only when `repo-config.yml` is staged) and pre-push/PR (defense-in-depth).
- **Governance/docs convergence** — the reference docs, governance conventions, and `AGENTS.md`
  sections describing the standard stay identical across the three repos.
- **Latent-bug fixes** (root-cause, per repo policy) — the `.opencode/agent/` (singular) trigger-path
  bug that silently disables the agent-naming validator in public+primer; the missing
  `gherkin-cardinality` PR-gate step in public. Both are **dry-run in Phase 0** before being armed.
- **Zero `⚠️` tolerated, zero descope** — every `⚠️` "functionally-equivalent mechanism divergence"
  row from the first plan's parity table converges to one identical mechanism, and **no phase
  (including Phase 4 / infra) may be descoped** — byte-identity is non-negotiable.

**Out of scope** (legitimate divergence — carried forward from the first plan's
[divergence policy](./tech-docs.md#7-divergence-policy-allowed-vs-drift)):

- Which deployable apps each repo has, and therefore which per-app CRON deploy workflows exist.
- Which programming-language gates run (public = content/web; primer = polyglot demo backends;
  infra = coralpolyp + IaC).
- Infra-only IaC gates (terraform / ansible / yamllint) and the self-hosted runner label — the
  runner label is CI-workflow-layer allowed-divergence, **not** part of `apps/rhino-cli`.
- `apps/rhino-cli` has **zero carve-outs** — it is 100% byte-identical across all three repos
  (`src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`). infra's rhino-cli is relicensed
  to MIT (Decision 3) and every repo-specific input (env-validation scan paths) is data-driven from
  `repo-config.yml` (Decision 5), so nothing in `apps/rhino-cli` legitimately differs.
- `repo-config.yml` per-repo **data values** (domain-areas, ddd-areas, env-validation scan paths)
  differ; its **schema (key set — enforced by the schema-parity gate), header comment, and harness
  list** are identical.
- Validator _behaviour_ (this plan standardizes wiring + source shape, not validator logic).
- **No new drift-enforcement tooling** — an automated parity check is explicitly _not_ built this
  pass (mission = verify-&-closeout, not tooling). Noted as a possible future follow-up.

## Approach Summary

1. **Phase 0** — fresh re-audit committed as evidence; primer behavior-baseline snapshot (round-trip
   guard); dry-run of the two fixed validators before arming; clean baseline in all three repos.
2. **Phase 1** — synthesize the **canonical rhino-cli** in `ose-public` as the **union** of all three
   command surfaces (pull primer's cucumber migrated to `0.23.0` + testcoverage, and infra's real IaC
   validators, back into public; drive all repo-specific behaviour from `repo-config.yml`; add the
   schema-parity gate + `apps/rhino-cli/LICENSE`; keep a synthesis ledger + file-accounting ledger;
   regenerate the golden-master; fix the two latent bugs); finalize the canonical SDLC/docs standard.
3. **Phase 2** — converge `ose-public`'s own remaining gaps (full `namedInputs.specs`,
   `coverage.projects` registry, stale orphan spec, `gherkin-cardinality` PR-gate step).
4. **Phase 3** — propagate to `ose-primer` (copy canonical rhino-cli union superset + bump cucumber to
   `0.23.0`; assert the round-trip guard; `.opencode/agents` path; `*.cs/.clj/.dart` mechanism; full
   `namedInputs.specs`).
5. **Phase 4** — propagate to `ose-infra` (**largest workstream, required — no descope**: regenerate
   rhino-cli to canonical; `npx nx`/`npm run` → direct `cargo run`; inline tool-lint → lint-staged;
   add missing CI jobs; workflow renames; 6 projects' missing targets; full `namedInputs.specs`; wire
   cucumber). Gated behind a full pre-push + PR-gate verification.
6. **Phase 5** — cross-repo byte-identity verification + archival.

## Confirmed Decisions (user-ratified 2026-07-02)

### First grill (morning)

Five decisions were grilled one-by-one and ratified:

1. **Canonical rhino-cli** = synthesize best-of-three in `ose-public` (pull primer's cucumber +
   testcoverage, and infra's real IaC validators, back into public), then propagate public→primer→infra.
2. **Infra rhino-cli** = full port to canonical, isolated as gated **Phase 4** (see Decision 7 —
   required, not descopable).
3. **Infra rhino-cli license** = **relicense to MIT** — the CLI is dev tooling, not the proprietary
   `coralpolyp` app. No license carve-out.
4. **C#/Clojure/Dart formatters** = **native tools inline** (`dotnet csharpier format` / `cljfmt fix`
   / `dart format`); primer + infra converge to public's mechanism (drop `scripts/format-*.sh`).
5. **Env-validation scan paths** = **data-driven from `repo-config.yml`** so `project.json` is
   byte-identical everywhere. Combined with (3), `apps/rhino-cli` has **zero carve-outs** — 100%
   byte-identical across all three repos.

### Second grill (deeper pass)

Ten further decisions were grilled one-by-one and ratified after a fact-recheck against the working
tree (see [tech-docs §5.2](./tech-docs.md#52-second-grill-decisions-user-ratified-2026-07-02-second-pass)):

1. **Cargo.lock** stays in byte-identity — verified achievable (isolated crate, own lockfile, no
   `[workspace]`).
2. **Ban descope** — byte-identity is non-negotiable; the Phase 4 escape hatch is removed.
3. **Round-trip guard = both** — behavior baseline + file-accounting ledger guard primer ⊇ current-primer.
4. **Synthesis tiebreak = most-evolved-wins default**; deviations logged in the synthesis ledger.
5. **Config schema-parity gate** — new `rhino-cli repo-config validate` command, wired at pre-commit
   (fires when `repo-config.yml` is staged) and pre-push/PR; gives identical key sets across all three
   `repo-config.yml` as an emergent property of validating against the shared schema.
6. **Arm dormant gates via Phase 0 dry-run** — existing violations become explicit remediation items first.
7. **MIT `LICENSE` scoped to `apps/rhino-cli/`**, identical file in all three repos.
8. **Golden master regenerated post-synthesis** — guards Phases 3–4 propagation, not the synthesis.
9. **Mid-plan pause invariant** — each phase gate asserts the touched repo passes its own full gate before pause.
10. **Cucumber = level up to `0.23.0`**; canonical `.feature` tree = reconciled union of all three.

**No open questions remain.** The only sanctioned divergence anywhere is each repo's app/language set,
its infra-only IaC gates, and the self-hosted runner label (CI-workflow layer) — never inside
`apps/rhino-cli`.

## Navigation

- [brd.md](./brd.md) — why this matters (business rationale)
- [prd.md](./prd.md) — what "done" looks like (personas, user stories, Gherkin acceptance criteria)
- [tech-docs.md](./tech-docs.md) — verified current state, canonical standard, source-identity model,
  divergence policy, phase design
- [delivery.md](./delivery.md) — the phased execution checklist

## Related

- [First plan (predecessor)](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md)
- [AGENTS.md §Related Repositories](../../../AGENTS.md) — the three-repo parity model
- [plan-multi-repo-parity-planning workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
- [repo-governance/development/infra/nx-targets.md](../../../repo-governance/development/infra/nx-targets.md)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
