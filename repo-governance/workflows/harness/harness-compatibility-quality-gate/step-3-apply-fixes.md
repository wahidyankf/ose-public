---
description: The fixer's auto-fixable scope (parity sync drift, catalog updates, spec updates) versus what it must flag for human resolution.
when_to_use: Use when determining what the fixer can safely apply automatically versus what requires human judgment.
---

# Step 3: Apply Fixes (Sequential, Conditional)

Apply validated fixes from the audit report based on mode level.

**Agent**: `harness-compatibility-fixer`

- **Args**: `report: {audit-report-N}, approved: all, mode: {input.mode},
EXECUTION_SCOPE: harness-compat,
delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {current-lifecycle-evidence}`
- **Output**: `{fix-report-N}` plus `{updated-lifecycle-evidence}` with only predicates affected
  by changed files invalidated
- **Condition**: Threshold-level findings exist from step 2
- **Depends on**: Step 2 completion

**Auto-fixable scope** (fixer applies at HIGH confidence):

- Catalog field updates where web-research evidence is unambiguous (e.g., a harness ships
  native `AGENTS.md` support and the catalog still marks it Tier 2)
- Tier reclassification (Tier 2 → Tier 1) backed by a dated, cited web source
- Stale verification dates in the catalog (bumps to current date when content unchanged)
- Mechanical binding file updates (frontmatter field additions/renames, file relocations
  within the dotdir, permission schema updates where the new schema is unambiguous)
- Spec updates in `the upstream Rhino specification corpus` where a harness convention change alters Rhino
  behaviour the specs document (Gherkin scenarios under `behaviour/`, container/component
  descriptions, README claims) — the fixer edits the affected spec files to stay consistent
  with the catalog and binding changes

**Out-of-scope for automated fixing** (fixer flags and surfaces for human resolution):

- Every predicate named by an exact delegated gate ID, including registered vendor, binding,
  ownership, catalog-conformance, and duplication checks

- **Parity Invariants 1, 2** (governance prose, AGENTS.md/CLAUDE.md vendor-audit violations):
  rewriting load-bearing prose requires human judgment per the convention's Migration Guidance
- **Parity Invariant 4** (inventory mismatch): an orphan in `.opencode/` may need deletion OR a
  missing `.claude/` counterpart may need authoring — either choice has product implications
- **Parity Invariant 5** (color-map or tier-map gap): adding a new color/tier requires a
  decision about role mapping that a fixer cannot make mechanically
- Tier 1 → Tier 2 reclassification (requires authoring a new generated bridge and updating
  the pre-push guard corpus)
- Higher-precedence filename discoveries (AD3 implications require human judgment per the
  [Multi-Harness Binding Convention](../../../conventions/structure/multi-harness-binding.md))
- New harness additions (full onboarding involves catalog row, binding directory decision,
  and Rhino implementation)
- Rhino **generator-logic** changes (a translation rule, not just regenerated data): only
  the checksum-pinned Rhino release is active and validated — surfaced as a human or an upstream-maintainer task
  agent authorship task

**On out-of-scope findings**: Surface with full context in the orchestrator's user-visible
status; do not loop further until the human resolves.

**Success criteria**: Fixer applies all in-scope fixes without errors; out-of-scope findings
are surfaced clearly.

**On failure**: Log errors, proceed to step 4 for verification.

After every applied fix, compare changed files with the ledger's predicate inputs and invalidate
only affected evidence. Do not rerun a delegated check to restore it.
