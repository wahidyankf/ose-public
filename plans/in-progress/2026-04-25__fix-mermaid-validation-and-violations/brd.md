# BRD — Fix Mermaid Violations

## Business Problem

**Problem 1 — Direction-blind validator (rhino-cli bug)**

The `width_exceeded` rule in `apps/rhino-cli/internal/mermaid/validator.go` always
checks `span` (max nodes per rank level) regardless of graph direction. This is correct
for `graph TD`/`TB`/`BT` where span = horizontal width on screen. It is **wrong** for
`graph LR`/`RL` where span = vertical height and `depth` (number of rank columns) is the
horizontal dimension that causes overflow.

Consequence: the validator fires false positives on LR diagrams that are vertically
tall but horizontally fine, while silently passing LR diagrams that are horizontally
overflowing. Every `width_exceeded` count in the current audit may include false
positives; every passing LR diagram with deep rank chains is a silent false negative.

Fixing this is a prerequisite for the doc fixes — applying topological changes to
diagrams that are not actually overflowing wastes effort and can hurt readability.

**Problem 2 — Violations in docs/**

A large number of real violations exist across `docs/`. A 2026-04-25 pre-Phase-0 audit
(direction-blind validator, MaxWidth=3) found 102 files failing. The authoritative count
is always discovered by running `go run ./apps/rhino-cli/main.go docs validate-mermaid` —
the direction-aware Phase 0 fix will reclassify some diagrams, so the Phase 1 file list
must be re-discovered after Phase 0. The pre-push hook runs
`rhino-cli validate:mermaid --changed-only`, validating every changed `.md` file in each
push — not scoped to `governance/` or `.claude/` only. Violations in `docs/` files that
are not being pushed do not block pushes today; however, any `docs/` file included in a
push is validated. After Phase 0 updates the CLI flag defaults (MaxWidth=4,
MaxDepth=unlimited), the hook will automatically apply the same thresholds as the plan
targets — no hook change required. Wide diagrams in untouched files still render poorly
on GitHub and in VS Code preview, undermining documentation quality.

**Problem 3 — Fix strategies undocumented in governance**

The fix strategies discovered and validated in this plan (direction flip, sequential
chaining, diagram splitting, label shortening) exist only in `tech-docs.md` — a plan
document that moves to `plans/done/` on completion. After archival, this institutional
knowledge is effectively invisible to future contributors. The existing governance
convention at `governance/conventions/formatting/diagrams.md` documents diagram syntax
and style but has no section on width constraints (span/depth, direction-aware rules) or
how to fix violations when they occur. Contributors encountering a `width_exceeded` error
have no canonical reference to consult.

## Business Goals

1. Deliver a direction-aware validator that fires on the correct dimension per graph
   orientation, eliminating both false positives and false negatives.
2. Achieve zero validator errors across all `docs/` files on `main`.
3. Improve diagram readability across GitHub, IDE previews, and any generated doc site.
4. Establish a clean baseline so future violations are caught at the push boundary.
5. Propagate validated fix strategies into `governance/conventions/formatting/diagrams.md`
   so future contributors have a canonical, always-available reference.

## Affected Roles

| Role                    | Hat worn                                                                    |
| ----------------------- | --------------------------------------------------------------------------- |
| Contributor / committer | Running pre-push hook; wanting clean validator output on future hook scopes |
| Documentation reader    | Reading diagrams in GitHub preview or VS Code; needing non-overflowing view |
| Plan executor           | Running the delivery checklist; fixing files batch-by-batch                 |

## Scope

- **In scope**:
  - `apps/rhino-cli/internal/mermaid/validator.go` — direction-aware width check and
    updated `DefaultValidateOptions()` (MaxWidth 3→4, MaxDepth 5→math.MaxInt)
  - `apps/rhino-cli/internal/mermaid/validator_test.go` — direction-aware test cases
  - `apps/rhino-cli/cmd/docs_validate_mermaid.go` — update CLI flag defaults
    (`--max-width` 3→4, `--max-depth` 5→0 where 0 means no limit)
  - All markdown files in `docs/` with `width_exceeded` or `label_too_long` violations
    after the Phase 0 re-audit. (`governance/` audited clean — no violations.)
  - `governance/conventions/formatting/diagrams.md` — add direction-aware width
    constraints and fix strategy guide (Phase 2, via `repo-rules-maker`)
- **Out of scope**: Other app source code, specs, test data files, generated files.

## Non-Goals

- Not fixing `complex_diagram` warnings as a separate concern — they disappear
  automatically after MaxDepth is set to math.MaxInt. Warnings do not affect exit code.
- Not adding new threshold parameter types beyond `MaxWidth`, `MaxDepth`, and `MaxLabelLen`.
- Not changing the pre-push hook to scan all `docs/` files unconditionally — the existing
  `--changed-only` behavior already validates any `docs/` file included in a push, which
  is sufficient coverage for this plan's batch delivery model.
- Not improving diagram visual quality beyond passing the validator rules.

## Success Criteria

1. `nx run rhino-cli:test:quick` passes including direction-aware test cases.
2. `go run ./apps/rhino-cli/main.go docs validate-mermaid` exits 0 with zero `✗` lines
   after all Phase 1 batches committed to `main`.
3. The `validate:mermaid` Nx target (pre-push hook) passes without explicit flags,
   confirming CLI flag defaults in `docs_validate_mermaid.go` reflect new thresholds
   (MaxWidth=4, MaxDepth=0/unlimited).
4. `governance/conventions/formatting/diagrams.md` contains a "Flowchart Width
   Constraints" section and a "Width Violation Fix Strategy Guide" section, and the
   `repo-rules-quality-gate` passes in strict mode after Phase 2 changes.

## Risks

| Risk                                                               | Likelihood | Mitigation                                                                      |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| Direction fix changes which docs files fail — Phase 1 scope shifts | High       | Phase 0 mandatory re-audit before starting Phase 1; batch lists are provisional |
| Diagram restructuring breaks semantic meaning                      | Medium     | Re-read surrounding prose; preserve all node relationships                      |
| Label truncation loses important context                           | Medium     | Move dropped detail into prose immediately before/after the diagram             |
| Wide diagrams need splitting — increases doc length                | Low        | Acceptable trade-off; shorter focused diagrams are more scannable               |
| Direction-aware fix introduces regression on TD diagrams           | Low        | Existing `validator_test.go` TD cases must still pass after the change          |
