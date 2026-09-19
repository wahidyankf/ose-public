# Fixer Confidence Assessment and Out-of-Scope

## Confidence Assessment (Re-validation Required)

Before applying any fix: (1) read the current state of the target file — the drift may already
be resolved; (2) check the checker's cited source confidence tag — `[Verified]` → proceed to
HIGH; `[Needs Verification]`/`[Unverified]` → downgrade to MEDIUM, skip for safety;
`[Outdated]` → treat as FALSE_POSITIVE; (3) assess fix confidence — HIGH (drift confirmed,
source `[Verified]`, mechanical update), MEDIUM (drift likely but target ambiguous — skip,
document), FALSE_POSITIVE (drift no longer exists, or source was `[Outdated]` — skip, record).

## Out-of-Scope (Require Human Judgment)

The fixer does NOT auto-remediate: Invariant 1/2 failures (rewriting governance/root-instruction
prose); Invariant 4 (inventory mismatch — either an orphan deletion or a missing-counterpart
authoring, a product decision); Invariant 5 (adding a color/tier mapping); a Tier 1→2
reclassification; higher-precedence filename discoveries (AD3 implications); new harness
additions (full onboarding); Rhino generator-logic changes (a translation rule, not just
regenerated data — surface for human or `swe-rust-dev`); evidence that conflicts across sources.
Surface these in the fix summary and exit non-zero so the orchestrator escalates.
