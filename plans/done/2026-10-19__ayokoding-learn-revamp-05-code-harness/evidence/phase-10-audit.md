# Phase 10 Evidence — Preliminary Plan-Execution End-to-End Delivery Completeness Audit

Plan: `ayokoding-learn-revamp-05-code-harness`. Auditor role: plan-checker
(swe-developer). Date: 2026-10-18/19. Worktree:
`worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`.

Scope per delivery.md Phase 10 (Plan Archival, first box): the approved scope,
every PRD requirement (FR-1 to FR-16, NFR-1 to NFR-8), and every scenario of
the 13 new feature files — each traced to as-built artifacts, automated proof,
manual proof, the parity table, the rule propagation record, and knowledge
capture. Only final-delivery proof (tick boxes, commit, push, PR, merge,
post-merge CI/dispatch, cleanup) may remain pending. This file is the only
change made by this audit: no code, spec, or plan doc was edited.

## Verdict

- Requirements: **24 supported / 0 missing / 0 unsupported** (FR 16/16, NFR 8/8).
- Scenarios: **63/63 present, bound, and green** (64 expanded pickles with the
  static-mode outline; 18 E2E-bound, 45 e2e-exempt with integration proof).
- No row is missing or unsupported, so **no phase reopens. Return: DONE.**
- Two Phase-10 final-delivery items remain pending (not requirement gaps, see
  §7): the 198 unticked checklist boxes and the uncommitted tree / unopened PR.

## 1. Row-per-requirement verdicts

| ID    | Verdict   | As-built artifacts                                                                                                                                                                                                                                                 | Automated proof (evidence)                                                                                                                                                             | Manual / other proof                                                                                                   |
| ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-1  | supported | `apps/ayokoding-cli/internal/adapters/cli/root.go` wires `examples` (validate, sync, run, coverage, check, affected) + `toolchains` (list, build); flags `--course/--since/--all/--shard/--seed/--record/--write/--min-percent/--output/--color` per tech-docs/002 | `evidence/phase-1-skeleton.md` (contract RED→GREEN), `phase-6-selection.md` (selection/coverage/check gates green)                                                                     | phase-8 checks 1–5, 8–10 exercise every command by hand, all MATCH                                                     |
| FR-2  | supported | `internal/domain/runspec` strict decoding (`KnownFields`), `internal/domain/layout`, `internal/application` Validate; finding codes `ayokoding.layout.*`, `ayokoding.runspec.*`                                                                                    | `evidence/phase-2-validate.md` (all AC RED→GREEN, CLI-QUICK/INTEGRATION/BEHAVIOUR exit 0)                                                                                              | phase-8 check 15: 6678 validate findings over real content                                                             |
| FR-3  | supported | `internal/domain/anchors` parser, sync classes + pure rewrite, `sync --write` idempotent                                                                                                                                                                           | `evidence/phase-4-sync.md` (RED→GREEN per class; `--write` twice-clean)                                                                                                                | phase-8 check 7: 106 preview findings on `just-enough-python`                                                          |
| FR-4  | supported | `internal/domain/containerplan`, `internal/adapters/containers`, `internal/application/run*.go`; pinned images, run twice, exit/stdout/stderr compare                                                                                                              | `evidence/phase-5-containers.md`, `phase-5-fixtures.md`, `phase-5-gate.md`; `phase-5-125-fix.md` (local-digest→bare-tag fix, RED→GREEN)                                                | phase-8 checks 8–9 (green-python 4 passed; failing-run 9 failed lines); SMOKE re-run PASS (35 passed, 0 failed)        |
| FR-5  | supported | No-network default; per-unit internal network shared with declared services only; cleanup removes containers + networks                                                                                                                                            | unit argv tests + `TestRunCleansTrackedResourcesOnInterrupt`; phase-5 evidence                                                                                                         | phase-8 checks 8/13: leftover `docker ps`/`network ls` headers only                                                    |
| FR-6  | supported | Double-execution compare → `ayokoding.examples.nondeterministic` with first differing line                                                                                                                                                                         | `evidence/phase-5-gate.md` (nondeterministic unit RED→GREEN); HC5 break/fix in `phase-7-rules-and-docs.md`                                                                             | — (deterministic fake + real runs agree line-for-line)                                                                 |
| FR-7  | supported | `mode: static` accepts only `cloud/cluster/ios/android/windows` + non-empty note, no services                                                                                                                                                                      | `evidence/phase-2-validate.md` + static-mode scenarios bound, integration green                                                                                                        | phase-8 SMOKE covers `windows-static` toolchain                                                                        |
| FR-8  | supported | S7 summary-line rule (last stdout line, total ≥ 32); `run --seed N` sets `AYOKODING_SEED`, replays, skips expected-output compare                                                                                                                                  | `internal/application/run_simulation_test.go`; `evidence/phase-5-gate.md`; HC6 break/fix in phase-7                                                                                    | phase-8 check 10: `--seed 17` replay MATCH (slug variance is stale doc text, note 2)                                   |
| FR-9  | supported | `--record` writes missing expected-output files only                                                                                                                                                                                                               | `evidence/phase-5-gate.md` (record scenario RED→GREEN)                                                                                                                                 | phase-8-adjacent opt-in proof in `phase-6-ci.md` (byte-flip → stdout-mismatch)                                         |
| FR-10 | supported | `examples affected` + `--since/--all/--course/--shard K/N`; catalog change → full mode                                                                                                                                                                             | `evidence/phase-6-selection.md` (BDD integration exit 0; behaviour-coverage 13 features/64 scenarios exit 0)                                                                           | `phase-6-ci.md` opt-in proof; phase-8 SMOKE `--all` selects 27/27                                                      |
| FR-11 | supported | No `run.yaml` → skipped, reported `inert`, never a finding, exit 0                                                                                                                                                                                                 | inert-courses scenarios bound; `phase-6-selection.md` gates green                                                                                                                      | phase-8 check 6: `0 opted-in courses; nothing to run`, no container started                                            |
| FR-12 | supported | `examples coverage`: units, covered, fences, anchored, illustration, static, `covered`, applicable percentage; `--min-percent N` exits 1                                                                                                                           | `evidence/phase-6-selection.md` (100% static coverage over `internal/domain/finding`; coverage-gate exit 0)                                                                            | phase-8 check 15 scope: 182 courses, 126 applicable, 56 inert                                                          |
| FR-13 | supported | `toolchains/catalog.yaml` embedded via `toolchains.go` (`go:embed`) behind `catalog.Load(fs.FS)`; 27 `sha256:` pins, 0 `pending`; unpinned → refuse exit 2; `toolchains build` content-hash tags                                                                   | `evidence/phase-2-validate.md` (catalog model), `phase-3-catalog.md` (no PENDING digest; every derived image builds), `phase-34-wiring.md`                                             | phase-8 check 3: `--version` prints catalog hash `85b49aa7…`                                                           |
| FR-14 | supported | Statuses 0/1/2/124–127/130/141, JSON error bodies, colour/`NO_COLOR`, reserved flags, error codes (`ayokoding.usage.*`, `ayokoding.env.*`, `ayokoding.internal.panic`)                                                                                             | `evidence/phase-1-skeleton.md` (exit mapping, panic, colour, SIGINT→130, SIGPIPE→141); F1 stdin fix in `phase-8-review.md` + `CLI-QUICK` exit 0                                        | phase-8 checks 1–5, 11–14 all MATCH (13: 130 on the run where INT fired)                                               |
| FR-15 | supported | `apps/ayokoding-www/project.json` `examples:check` (+`full` config); new `_reusable-ayokoding-www-examples-check.yml` (affected shards) + `ayokoding-www-examples-check.yml` (monthly `17 3 1 * *`, 4 shards); PR-gate `examples-plan`/`examples` jobs             | `evidence/phase-6-ci.md` (EXAMPLES-CHECK exit 0 affected + full; LINT-WORKFLOWS exit 0; SCRIPT-TESTS 128/128)                                                                          | post-merge monthly dispatch still pending (Phase 10 push section)                                                      |
| FR-16 | supported | HC1–HC8 in tech-docs/011 surfaces: skill module `reference/code-example-harness.md` (new) + SKILL.md/reference index; 4 tutorial gates; `gate-adapters/ayokoding-www.md` (HC8); CLI tier record; Nx + workflow-naming + repository-adapter records                 | `evidence/phase-7-rules-and-docs.md` (HC2/HC3/HC5/HC6/HC7 break→fix with byte-identical restore; ADAPTERS-GEN/VALIDATE exit 0; Rules Quality Gate `PASS_WITH_FINDINGS`, cycle 2 clean) | 5 docs/reference files + `apps/README.md` + `specs/apps/ayokoding/README.md` + workflows README updated (docs half §7) |
| NFR-1 | supported | Inert path starts no container, contacts no registry                                                                                                                                                                                                               | integration fake-CLI log empty; `phase-6-ci.md`                                                                                                                                        | phase-8 check 6: `docker ps` empty, exit 0                                                                             |
| NFR-2 | supported | JSON payload carries no time/duration/absolute path; double-render byte-compare unit test                                                                                                                                                                          | `phase-1-skeleton.md` determinism test green                                                                                                                                           | —                                                                                                                      |
| NFR-3 | supported | `.golangci.yml` strict + NilAway + architecture tests + 99% floor + `-race`                                                                                                                                                                                        | `CLI-QUICK` exit 0 post-F1-fix (`phase-8-review.md`, `phase-8-manual-cli.md` re-runs)                                                                                                  | —                                                                                                                      |
| NFR-4 | supported | No secret in specs/catalog/logs; unprivileged; only temp-copy mount; argv unit tests                                                                                                                                                                               | PR leak review pending at push (Phase 10); push leak review not yet run — final-delivery proof                                                                                         | phase-7 secret/sensitivity gate: learnings clean                                                                       |
| NFR-5 | supported | Run timeout ≤ 600s, service readiness ≤ 120s, ≤ 20 runs/unit; no retry loops                                                                                                                                                                                       | Validation rules + unit tests (`phase-2/phase-5` evidence)                                                                                                                             | —                                                                                                                      |
| NFR-6 | supported | `AYOKODING_CONTAINER_CLI` replaces the container command                                                                                                                                                                                                           | Integration tests use the fake CLI                                                                                                                                                     | phase-8 check 12: `AYOKODING_CONTAINER_CLI=does-not-exist` → 127 MATCH                                                 |
| NFR-7 | supported | Words (`passed`/`failed`/`inert`), never colour alone                                                                                                                                                                                                              | `NO_COLOR` scenario bound + green                                                                                                                                                      | phase-8 check 11: 0 ESC bytes, `failed` labels MATCH                                                                   |
| NFR-8 | supported | No daily run; monthly + catalog-change full runs, ≤ 4 shards                                                                                                                                                                                                       | Workflow review in `phase-6-ci.md` (cron verbatim, shard logic `[1]`/`[1,2,3,4]`)                                                                                                      | monthly dispatch pending post-merge (Phase 10)                                                                         |

## 2. Scenario-by-scenario confirmation (13 feature files, 63 scenarios)

Counts below are `Scenario:`/`Scenario Outline:` lines in the as-built file vs
the prd.md BDD Delta Map; E2E-bound = scenarios without `@e2e-exempt`;
exemptions each carry the `# Exemption(e2e): …; alternative-proof:
ayokoding-cli:test:integration / <title>` comment. Bindings live in
`apps/ayokoding-cli/tests/bdd/` (`Strict: true` godog suite; every new step
failed as `unknown step` at RED and passes at GREEN per the phase evidence).
Green runs: `CLI-INTEGRATION` exit 0, `CLI-E2E` exit 0, `CLI-BEHAVIOUR` exit 0
(13 features, 64 expanded scenarios = 63 + 1 outline row) on `--skip-nx-cache`
re-runs recorded in `evidence/phase-8-manual-cli.md`; `SMOKE` exit 0
(35 passed, 0 failed, 27/27 covered).

| Feature file                                 | Scenarios                                                                                                                                      | E2E-bound | Bindings                         | Green                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------- | ---------------------------------------------- |
| `cli-contract/command-line-contract.feature` | 9 (Help; Bare invocation; Version; Unknown flag; JSON error; NO_COLOR; Internal failure ⓔ; Interrupt ⓔ; Closed pipe)                           | 7         | `tests/bdd` unit+integration+e2e | unit ✓ integration ✓ e2e ✓ (ⓔ via integration) |
| `examples/inert-courses.feature`             | 3 (No opted-in course; Changed course inert ⓔ; Preview by name ⓔ)                                                                              | 1         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/content-layout.feature`            | 4 (Flat example; Unplaced code; Missing run spec; Misplaced run spec — all ⓔ)                                                                  | 0         | `tests/bdd`                      | unit ✓ integration ✓                           |
| `examples/run-spec-validation.feature`       | 6 (Unknown key; Unknown toolchain; Path escape; Timeout range; Missing invariant; Complete spec passes — all ⓔ)                                | 0         | `tests/bdd`                      | unit ✓ integration ✓                           |
| `examples/markdown-file-sync.feature`        | 8 (Identical passes; Mismatch ⓔ; Missing file ⓔ; Line range ⓔ; Unanchored/illustration ⓔ; Output anchor ⓔ; Unreferenced unit ⓔ; Write repairs) | 2         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/example-execution.feature`         | 7 (Output matches; Exit mismatch ⓔ; Stdout mismatch ⓔ; Stderr mismatch ⓔ; Timeout ⓔ; Record missing-only ⓔ; Service by name)                   | 2         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/determinism.feature`               | 4 (No network; Fixed env ⓔ; Nondeterministic; Immutable files)                                                                                 | 3         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/static-mode.feature`               | 3 (Validator only; Outline needs-reason-and-note ⓔ = 2 pickles; Services rejected ⓔ)                                                           | 1         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/simulation-runs.feature`           | 4 (Summary required ⓔ; ≥32 seeds ⓔ; Seed replay; Expected-failing passes ⓔ)                                                                    | 1         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `examples/selection.feature`                 | 4 (Affected only; Catalog change → full; Shards; No selection usage error — all ⓔ)                                                             | 0         | `tests/bdd` (`phase6_test.go`)   | unit ✓ integration ✓                           |
| `examples/coverage-report.feature`           | 4 (Covered; Not applicable; Below minimum; Illustrations+static — all ⓔ)                                                                       | 0         | `tests/bdd` (`phase6_test.go`)   | unit ✓ integration ✓                           |
| `examples/environment-failures.feature`      | 4 (127 missing CLI; 126 not-executable ⓔ; 125 runtime-down ⓔ; 124 service-unready ⓔ)                                                           | 1         | `tests/bdd`                      | unit ✓ integration ✓ e2e ✓                     |
| `toolchains/toolchain-catalog.feature`       | 3 (Unpinned stops CLI; List names id/kind/version; Tag changes with recipe — all ⓔ)                                                            | 0         | `tests/bdd`                      | unit ✓ integration ✓                           |
| **Total**                                    | **63**                                                                                                                                         | **18**    | all in `tests/bdd`               | **all green**                                  |

ⓔ = `@e2e-exempt` with exemption comment + named integration proof.

## 3. Delivery checklist boxes (`delivery.md`)

`grep -c`: **198 `[ ]` boxes, 0 ticked — every box in Phases 0–10, the Commit
Guidelines, and the promotion section is unticked.** This audit lists that
state as required; it is Phase-10 final-delivery bookkeeping, not a requirement
gap: per the plan itself ("Checked boxes alone are not proof"), completion is
evidenced by the per-phase evidence files in §4, all present with RED→GREEN
records. This auditor is forbidden from editing `delivery.md`, so ticking
belongs to the Phase 10 owner at archival.

## 4. Quality-gate evidence (all present)

`phase-0-baseline.md` (5 green baselines, Docker 24.0.2, both preconditions),
`phase-1-skeleton.md`, `phase-2-validate.md`, `phase-3-catalog.md`,
`phase-34-wiring.md`, `phase-4-sync.md`, `phase-5-containers.md`,
`phase-5-fixtures.md`, `phase-5-gate.md`, `phase-5-125-fix.md` (resolves the
gate's 125-cluster blocker; corroborated by phase-8 SMOKE PASS),
`phase-5-gherkin.md`, `phase-5-plan-app.md`, `phase-6-ci.md`, `phase-6-gherkin.md`,
`phase-6-selection.md`, `phase-7-rules-and-docs.md` (rules + docs halves, quality
gate `PASS_WITH_FINDINGS`), `phase-8-content-baseline.md`,
`phase-8-manual-cli.md`, `phase-8-review.md` (swe-reviewer 1 cycle, F1 fixed
with 2 regression tests), `phase-9-learnings.md`. Final local gates re-run in
Phase 8: CLI-INTEGRATION, CLI-BEHAVIOUR, CLI-E2E, SMOKE all exit 0; leftover
containers/networks empty. Two handed-over blips retired: phase-6 `WWW-QUICK`
shed → `WWW-QUICK` exit 0 recorded in phase-7; phase-7's 5 `LINT-MD` findings
sit in repo-config-excluded paths (`plans/done/**`,
`apps/ayokoding-cli/tests/testdata/courses/broken-sync/**` — verified the
linter loads 0 files for them), so the `LINT-MD` gate is unaffected.

## 5. Manual assertions (committed-evidence status)

All 15 tech-docs/008 checks recorded in `phase-8-manual-cli.md` (13 MATCH, 2
documented variances: check 8 fixture growth 2→4 units and check 10's
nonexistent slug — both stale expected-column text, no CLI bug, no spec
impact); per-course baseline table in `phase-8-content-baseline.md` (182
courses, 126 applicable, 56 inert); review in `phase-8-review.md`. "Committed"
is pending only in the Phase-10 sense: the whole tree including `evidence/` is
still uncommitted (see §7), which the push/PR steps resolve — the files exist
with full command/exit/output records.

## 6. Parity table, rule propagation, knowledge capture

- Parity: `tech-docs/002-cli-project-and-hippo-parity.md` hippo-parity table;
  applied in Phase 1 (`phase-1-skeleton.md`); `toolchains.go` embed,
  `catalog.Load(fs.FS)`, architecture import tests all per parity rows.
- Rule propagation: full record `phase-7-rules-and-docs.md` (+ scratch
  `local-tmp/ayokoding-learn/plan-05/rules-placement.md`, gitignored by
  design); 15 paths (1 new skill module + 14 edits); bindings regenerated
  (`ADAPTERS-GEN`/`ADAPTERS-VALIDATE` exit 0; catalog+provenance digests in
  `.claude`/`.codex`/`.commandcode`).
- Knowledge capture: `learnings.md` carries the explicit none-escape (`No
generalizable learnings — …`) with terminal-state section; triage evidence
  `phase-9-learnings.md`; cross-plan handoffs (M1–M11, 1,124 mismatches,
  plan-13 100% end, plan-14 commands, D18) reported to parent, merge commit
  pending.

## 7. Pending final-delivery proof (not gaps; owned by Phase 10 push/merge steps)

1. Tick the 198 boxes (§3) at archival.
2. Commit (plan dir currently untracked `??`; ~435 changed paths), push leak
   review, push, open the PR, exact-head quality gate + leak-review pass,
   merge, post-merge CI + monthly dispatch, cleanup.
3. NFR-4's PR leak review and FR-15/NFR-8's post-merge dispatch can only exist
   after the push — they are final-delivery proof by construction.
