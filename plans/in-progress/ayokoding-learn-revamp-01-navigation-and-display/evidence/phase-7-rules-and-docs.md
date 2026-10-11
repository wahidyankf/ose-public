# Phase 7 Evidence — Rules and Docs Propagation

> All placement detail (inventory, falsifiability, existing-rule check, conflicts, placement
> decision, eviction outcome, disposition, generation records, final status) lives in
> `local-tmp/ayokoding-learn/plan-01/rules-placement.md` (never committed).

## Demo outputs (evidence paths, never committed)

| Judgement            | File                                                             | Result                                   |
| -------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| R1 violating         | `local-tmp/ayokoding-learn/plan-01/r1-violating.out`             | exit 1, names `46 · Distributed Systems` |
| R1 conforming        | `local-tmp/ayokoding-learn/plan-01/r1-conforming.out`            | exit 0, 8/8 passed                       |
| R2 violating         | `local-tmp/ayokoding-learn/plan-01/r2-violating.out`             | exit 1, internal-marker offender         |
| R2 conforming        | `local-tmp/ayokoding-learn/plan-01/r2-conforming.out`            | exit 0, 8/8 passed                       |
| Word budget          | `local-tmp/ayokoding-learn/plan-01/phase7-word-budget.out`       | 3031 files, no findings                  |
| Harness generate     | `local-tmp/ayokoding-learn/plan-01/phase7-adapters-generate.out` | exit 0, current                          |
| Harness validate     | `local-tmp/ayokoding-learn/plan-01/phase7-adapters-validate.out` | exit 0, clean                            |
| Markdown lint (tree) | `local-tmp/ayokoding-learn/plan-01/phase7-lint-md.out`           | 7933 files, 0 errors                     |

## Quality-gate verdicts

- `rules-checker` run `ses_ed43fff48ffeWuT5HsiTrEx147` — verdict and findings: (recorded below on
  completion)
- `harness-checker` run `ses_ed43fdbacffesqYd00xtnPZwNs` — **zero findings**, with live-gate
  evidence (tamper tests on a disposable copy fail as expected); every generated diff is one digest
  line for `skill/apps-ayokoding-www-developing-content`, fully explainable by the canonical edit.
  The actual generated-path set is the ten `.claude/{agents,skills}`, `.codex/agents`,
  `.commandcode/agents`, and `.opencode/agents` catalog+provenance files (the caller's first list
  named nonexistent `.codex/skills/*` mirrors and was corrected per the checker's input discrepancy
  finding). Upstream-convention currency is not required for this phase's evidence (checker's
  recorded decision).

## Docs Propagation status

`status: landed` — spec READMEs describe every new/retired feature file of the phase; no stale
statement found in `docs/`, the app READMEs, or the fixtures manifest README.
