# Phase 7 Evidence — Rules (rules-maker, 2026-10-18)

Plan `ayokoding-learn-revamp-05-code-harness`, branch `ayokoding-learn-revamp-05-code-harness`,
worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`. Input tech-docs/011; workflow
Rules Propagation (001/002/003). Full record: `local-tmp/ayokoding-learn/plan-05/rules-placement.md`
(§1 frozen inputs … §10 final status `landed`).

Docs half: owned by `docs-fixer` (delivery.md Docs Propagation section) — this file covers rules
only; the docs-fixer appends the docs half.

## 1. Changed paths (15: 14 modified + 1 new)

New: `.agents/skills/apps-ayokoding-www-developing-content/reference/code-example-harness.md`
(HC1–HC7 + workflow + worked example, 735 words).
Modified: that skill's `SKILL.md` (+link section) and `reference/README.md` (+index row); the four
`tutorial-{by-example,primer,annotated-concept,in-the-field}-quality-gate.md` (exact tech-docs/011
sentence + ownership row, plus budget-funded tightening, §5);
`gate-adapters/ayokoding-www.md` (boundary sentence + "Example Harness", HC8);
`command-line-interface/009-tiers-here.md` (`ose-cli` removed, supervisor-status sentence);
`nx-targets/domain-work-naming-for-governance-targets.md` (`examples:check` row);
`nx-targets/execution-model.md` (gate sentence); `nx-targets/tag-convention-current-tags-and-examples.md`
(`ayokoding-cli` row, matches `project.json` tags verbatim);
`github-actions-workflow-naming/filename-grammar-and-vocabulary.md` (`examples-check` verb +
`quality-gate` amendment); `repository-adapter/adopter-decisions.md` (Go integration selection →
`a separate test directory`); `repository-adapter/project-applicability.md` (CLI README link +
`golang` version-source closure repair). `repo-config.yml` already carried the CLI entry (verified,
no edit). Rebased onto plans 01–04 skill landings (R1–R3, PM1–PM3, metadata — no contradiction, §3
of the placement record).

## 2. Enforcement proof — all twelve outputs

Scratch `local-tmp/ayokoding-learn/plan-05/content/` (fixture copies + `sim-proof` with the green
`ex-01-sim` unit only); binary `apps/ayokoding-cli/dist/ayokoding-cli`; Docker 24.0.2. Every break
was restored and diffed byte-identical before its pass run.

HC2 break — `examples validate --content <scratch> --course green-python` → exit 1:

```text
green-python learning/extra/code:0: ayokoding.layout.unplaced-code: code folder learning/extra/code is not a canonical unit
green-python learning/extra/code/ex-01-hello/run.yaml:1: ayokoding.layout.misplaced-run-spec: run spec learning/extra/code/ex-01-hello/run.yaml sits outside a canonical unit folder
```

HC2 fix (unit moved back) → exit 0, no output.

HC3 break — `examples sync --content <scratch> --course green-python` → exit 1:

```text
green-python learning/lessons/hello.md:3: ayokoding.sync.mismatch: fence body line 2 differs: expected "print(\"middle\")" found "print(\"MIDDLE\")"
```

HC3 fix (fence restored, diff-clean vs testdata) → exit 0, no output.

HC5 break — `examples run --content <scratch> --course green-python` → exit 1:

```text
green-python learning/code/ex-02-range main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
green-python learning/code/ex-01-hello/run.yaml:1: failed ayokoding.examples.nondeterministic: run "main" differs between executions at line 4: first "1792338872.267078", second "1792338872.4748318"
```

HC5 fix (file restored, diff-clean) → exit 0:

```text
green-python learning/code/ex-01-hello main: passed
green-python learning/code/ex-02-range main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
```

HC6 break — `examples run --content <scratch> --course sim-proof` → exit 1:

```text
sim-proof learning/code/ex-01-sim/run.yaml:1: failed ayokoding.examples.stdout-mismatch: run "main" stdout differs at line 1: expected "seeds: 64 passed, 0 failed (of 64)", actual ""
```

HC6 fix (summary line restored, diff-clean) → exit 0: `sim-proof learning/code/ex-01-sim main: passed`.

HC7 break — `examples validate --content <scratch> --course static-course` → exit 1:

```text
static-course learning/code/ex-09-static/run.yaml:3: ayokoding.runspec.missing-static-note: static mode needs a note stating what the static run proves
static-course learning/code/ex-09-static/run.yaml:3: ayokoding.runspec.unknown-static-reason: static reason "" must be one of cloud, cluster, ios, android, windows
```

HC7 fix (`static.reason`/`static.note` restored, diff-clean) → exit 0, no output.

HC1 break — `examples check --content <scratch> --course green-python` → exit 1:

```text
green-python learning/code/ex-01-hello main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
green-python learning/code/ex-02-range:0: failed ayokoding.layout.missing-run-spec: unit learning/code/ex-02-range has no run.yaml
0 of 4 applicable courses covered
```

HC1 fix (`run.yaml` restored, diff-clean) → exit 0:

```text
green-python learning/code/ex-01-hello main: passed
green-python learning/code/ex-02-range main: passed
green-python learning/code/ex-03-env main: passed
green-python learning/code/ex-04-immutable main: passed
1 of 4 applicable courses covered
```

Dispositions: HC1/HC2/HC3/HC7 `gated`; HC5/HC6 `gated` in part (double run + S6–S7 proven above),
rest judged; HC4 and HC8's judged half `unenforced by decision` (recorded with reasons in the
placement record §4/§8). Note: the table's `green-kata` HC1 example was replaced — kata ships no
lessons, so its baseline `check` is already red on `ayokoding.sync.unreferenced-unit`.

## 3. Verification results

- `ADAPTERS-GEN` exit 0; `ADAPTERS-VALIDATE` exit 0 ("validation is clean"). Generated paths
  (10, digest-only): the `skill/apps-ayokoding-www-developing-content` digest refresh in the
  `.claude`/`.codex`/`.commandcode`/`.opencode` agent catalog+provenance and `.claude` skill
  catalog+provenance (from the SKILL.md link edit).
- `CLI-QUICK` (`ayokoding-cli:test:quick`) exit 0.
- `WWW-QUICK` (`ayokoding-www:test:quick`) exit 0 (Nx cache hit; Nx printed a "flaky task" notice
  for the cached task — no www file changed in this run).
- `LINT-MD` scoped to this run's 15 files: 0 errors. Repo-wide `LINT-MD`: 5 errors, all
  pre-existing (mtimes 03:24–10:07 UTC, before Phase 7) and all in ownership-forbidden paths:
  `apps/ayokoding-cli/tests/testdata/courses/broken-sync/learning/lessons/sync.md:31`
  (MD046), `evidence/phase-2-validate.md:124-125` (MD009, MD047),
  `evidence/phase-5-fixtures.md:138` (MD032), `evidence/phase-5-plan-app.md:128` (MD022).
  Handed to the parent: 5-minute fix, none touchable by rules-maker.
- Word budgets (`./rhino governance word-budget validate`): exit 0, no violations (final counts in
  placement record §9).
- Changed rule text reread for closure; placement record reconciled with `git status` — every
  changed path accounted for, no neighbor touched.

## 4. Rules Quality Gate (2 cycles)

- Cycle 1 (self-audit vs the 9 gate questions): F1 mandated gate text breached 750 (measured
  779–784) → repaired by allowed one-direction shortening + contract-dedup (§5), validator green;
  F2 HC1 kata example unusable → green-python proof; F3 adapter 749 → 746; F4 repo-wide lint red
  in forbidden paths → handover, not a rule finding. Q1–Q9 hold; all cross-links resolve.
- Cycle 2 (re-audit): no open blocking finding in this run's surfaces.
- Verdict: `PASS_WITH_FINDINGS` (one noted row: F4, parent-owned).

## 5. Budget tightening log (original → tightened; obligations kept)

Shared in all four gates: contract-role list ("a read-only checker, a frozen ledger, …" →
bare list); Entry dropped the contract-owned "No cycle waits for a person" (owned by
003-verdicts-ledger-and-relations.md:44; Human Review link stays); thresholds paragraph
("…come from…adapter…it holds…Each threshold lives only there" → "…live only in…adapter…For
this kind: …"); "`max-cycles` value, or a missing" → without comma; boundary intro
"…owners instead." → "…owners."; "no tool of its own owns" → "no tool owns"; front matter
descriptions ("with product thresholds from an adapter, in at most three bounded cycles" →
"with adapter product thresholds, in ≤3 bounded cycles") and when_to_use ("when someone
explicitly asks…" → "when explicitly asked…: …").
Per file: by-example — intro head ("states only the By Example specifics of …"), "with every
other example removed, it still runs" → "standing alone, it runs", "on the code lines" →
"on code lines", "come before any dependency" → "come first:", "grouped coherently" →
"grouped"; primer — scope bullet ("its dependent topics", rationale clause removed, CRITICAL
kept), "while an example … is not" → "unless … needs it", "features together" → "features",
"rules of the [Gate]: its parts" → "[Gate] per-example rules: its parts", "are grouped" →
"group"; annotated-concept — intro head, "contains no code block at all, which is a finding
when broken" → restructured (severity + condition kept), "self-contained and runs" →
"self-contained, runs", "with sound names and a rise" → "soundly named, rising", "a visual
relationship" → "a visual", "any part the adapter adds" → "any adapter-added part";
in-the-field — intro head + scene ("of production practice in one working scenario" →
"production practice in one working scenario"), "fails in practice" → "fails", "is still
enough" → "still suffices", "rather than hardcoded values" → ", never hardcoded", "helps a
reader follow" → "helps follow", "Of the set as a whole," → "Of the set,".
Mandated tech-docs/011 sentence + ownership row byte-exact in all four files.

## 6. Handover

- Parent (main thread): the 5 pre-existing `LINT-MD` errors above need a 5-minute fix in
  `testdata/` + three evidence files (outside rules-maker ownership); the Nx "flaky task" notice
  on the cached `WWW-QUICK` is recorded but unexplained.
- `docs-fixer`: delivery.md Docs Propagation section + the docs half of this evidence file are
  yours; rules half above is complete. Canonical rule homes: skill module (HC1–HC7), gate
  adapter Example Harness (HC8).

---

## 7. Docs half (docs-fixer, 2026-10-18)

Input: delivery.md Phase 7 Docs Propagation section; the
[Docs Propagation](../../../../repo-governance/workflows/quality/docs-propagation.md) workflow;
tech-docs/011 Docs Propagation table. Ownership: `docs/**`, stale-statement fixes only in
`apps/ayokoding-www/README.md` and `apps/ayokoding-cli/README.md`, plus this append. This run
touched nothing outside that set (other worktree modifications predate it: rules-maker paths,
sibling agents' `apps/ayokoding-cli/**`, and `.markdownlint*` config).

### 7.1. Table rows

| File                                                            | Table change                                                               | Status                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/reference/monorepo-structure.md`                          | `apps/ayokoding-cli` entry                                                 | `resolved` — Current Apps row added (Go + Cobra harness); `lang:` values gained `go` (stale omission, same edit)                                                                                                                                        |
| `docs/reference/system-architecture/applications.md`            | `ayokoding-cli` entry                                                      | `resolved` — new `CLI Tools` section (purpose, Go + Cobra, run command, location)                                                                                                                                                                       |
| `docs/reference/system-architecture/ci-cd.md`                   | Examples check in PR gate; monthly full run; cadence rule                  | `resolved` — new `AyoKoding Examples Check Workflows` section (PR-gate `since` selection with 1-or-4 shard plan, monthly `17 3 1 * *` full run, never-daily cadence rule; all verified against the two workflow files and `pr-quality-gate.yml`)        |
| `docs/reference/code-coverage.md`                               | `ayokoding-cli` 99% deterministic-core floor                               | `resolved` — floor over `internal/domain/...` + `internal/application/...` via `coverage-gate.sh` (`COVERAGE_MINIMUM=99`), verified against the script                                                                                                  |
| `docs/reference/project-dependency-graph.md`                    | `ayokoding-cli` node; `dependsOn`-only relation to `ayokoding-www`         | `resolved` — mermaid CLI-ecosystem node + dotted `dependsOn` edge, `ayokoding-www` row now task-level-only, new CLI Tools table row; the "no CLI dependency" paragraph narrowed to `implicitDependencies` (verified against `project.json` `dependsOn`) |
| `apps/ayokoding-www/README.md`                                  | `examples:check` target, `full` configuration, harness contract link       | `resolved` — command added to Checks and tests plus one paragraph (default `since` selection, `--configuration=full`, link to CLI README contract); no restructure                                                                                      |
| `apps/ayokoding-cli/README.md`                                  | Usage, exit statuses, prerequisites, code map, BDD layers, omitted targets | `resolved` with no edit — verified each item present (usage, exit statuses 0/1/2/124–141, Go + Docker prerequisites, targets incl. "No target is omitted" reasoning, contract link); no stale statement found                                           |
| `apps/README.md`                                                | Tools table row                                                            | `not-resolved` — outside docs-fixer ownership (only www + cli READMEs allowed); handed to readme-fixer/parent                                                                                                                                           |
| `apps/ayokoding-cli/CONTRIBUTING.md` (table: `CONTRIBUTING.md`) | Per-table content                                                          | `not-resolved` — not a README, outside ownership; handed to readme-fixer/parent                                                                                                                                                                         |
| `specs/apps/ayokoding/README.md`                                | Two logical owners                                                         | `not-resolved` — `specs/` forbidden; handed to parent                                                                                                                                                                                                   |
| `.github/workflows/README.md`                                   | The two new workflows                                                      | `not-resolved` — `.github/` forbidden; handed to parent                                                                                                                                                                                                 |

### 7.2. Stale-statement search

Searched `docs/` and `apps/*/README.md` (plus `apps/README.md` for completeness) for
`no gate runs tutorial code`, `compiles or runs`, `ayokoding-cli` described as Rust, and
`ose-cli`: zero hits. `docs/` never mentioned `ayokoding-cli` before this run, so every
`docs/` edit above is additive; both product READMEs are fresh (Go + Cobra throughout) with
no stale sentence to repair beyond the table-required www addition.

### 7.3. Verification

- `LINT-MD` scoped to this run's six files (`markdownlint-cli2`, repo config): 0 errors.
- Changed docs text reread for closure; cross-links resolve (`apps/ayokoding-cli/README.md`
  from www README, CLI README to `specs/apps/ayokoding/cli/`).
- No `repo-governance/`, `.agents/`, `specs/`, `.github/`, `project.json`, plan-doc, or
  product-body change from this run.

### 7.4. Status

`partial`: six table rows landed (five `docs/` edits + www README addition), the CLI README
verified no-change, four rows out of ownership handed over (`apps/README.md`,
`CONTRIBUTING.md`, `specs/apps/ayokoding/README.md`, `.github/workflows/README.md`).
Nothing committed, pushed, or moved.

### 7.5. Handover rows landed by the plan executor

All four handed-over rows are now `resolved` (LINT-MD 0 errors on all four files):

- `apps/README.md`: Tools table gains the `ayokoding-cli` row.
- `apps/ayokoding-cli/CONTRIBUTING.md`: pointer to README for usage, exit statuses,
  prerequisites, targets, and contract (no duplication).
- `specs/apps/ayokoding/README.md`: two logical owners (`www` + `cli`), with the `cli/`
  contract entry and both implementing-project links (verified `specs/apps/ayokoding/cli/`
  exists).
- `.github/workflows/README.md`: new `Course example checks` family row naming both
  workflow files (verified against `pr-quality-gate.yml` `has-ayokoding-examples` output).

Docs Propagation status: `landed`.
