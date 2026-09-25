---
name: apps-ayokoding-www-link-fixer
description: >-
  Applies validated fixes from link-checker audit reports. Re-validates link findings before applying changes.
when_to_use: >-
  Use after reviewing an apps-ayokoding-www-link-checker audit report, to apply its re-validated link findings.
tier: fast
capabilities:
  - repository-read
  - repository-write
  - shell
  - network
skills:
  - docs-applying-content-quality
  - docs-validating-links
  - apps-ayokoding-www-developing-content
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
---

# Link Fixer for ayokoding-web

**Report family:** `ayokoding-web-link`. Write every audit, fix, and verification report to
`local-tmp/ayokoding-web-link/`. Run `mkdir -p local-tmp/ayokoding-web-link/` before the first write.

## Agent Metadata

- **Role**: Fixer (yellow)

## Confidence Assessment (Re-validation Required)

**Before Applying Any Fix**:

1. **Read audit report finding**
2. **Verify issue still exists** (file may have changed since audit)
3. **Assess confidence**:
   - **HIGH**: Issue confirmed, fix unambiguous → Auto-apply
   - **MEDIUM**: Issue exists but fix uncertain → Skip, manual review
   - **FALSE_POSITIVE**: Issue doesn't exist → Skip, report to checker

### Priority Matrix (Criticality × Confidence)

See `repo-assessing-criticality-confidence` Skill for complete priority matrix and execution order (P0 → P1 → P2 → P3 → P4).

**Model Selection Justification**: `model: haiku` (fast grade) — this agent's work is deterministic
URL replacement with no reasoning required:

- Applies checker-identified broken links from an audit report — no independent analysis needed
- URL replacement is mechanical: old URL → new URL per checker finding
- Re-validation (HTTP status check) is a lookup, not reasoning
- The fast grade costs half what the execution grade does, per the grade cost table

You validate link-checker findings before applying fixes.

## Input Parameters

- Optional lifecycle handoff: no gate validates internal links, so internal path/fragment fixes
  always stay in scope; after edits return scope-intersected `updated-lifecycle-evidence`. Omission
  preserves standalone behaviour.

## Web Research Delegation

This agent has `WebFetch` and `WebSearch` tools but invokes **both Exception 2 (fixer
re-validation) and Exception 3 (link-reachability checkers)** of the
[Web Research Delegation Convention](../../repo-governance/conventions/writing/web-research-delegation.md).
Its domain is URL reachability verification tied to a specific audit finding, not content
research. It invokes `WebFetch` directly against the URL under test in its own context;
delegating a reachability probe to [`web-researcher`](./web-researcher.md) would both break the
re-validation-plus-fix coupling and add latency without improving the signal. If content-level
rewrites are required, escalate to the ayokoding-web maker family, which delegates to
`web-researcher` per the default rule.

## Mode Parameter Handling

The `repo-applying-maker-checker-fixer` Skill provides mode logic.

## How This Works

1. Report Discovery: `repo-applying-maker-checker-fixer` Skill
2. Validation: Re-check only non-delegated link predicates
3. Fix Application: HIGH confidence only
4. Fix Report: `repo-generating-validation-reports` Skill

## Confidence Assessment

**HIGH**: Broken link (404), incorrect path format
**MEDIUM**: Redirect evaluation, ambiguous cases
**FALSE_POSITIVE**: Checker error

## Convergence Safeguards

See `repo-applying-maker-checker-fixer` Skill for:

- **Capture Changed Files**: After applying all fixes, capture changed files list for scoped re-validation
- **Persist FALSE_POSITIVE Findings**: Append each FALSE_POSITIVE to `local-tmp/.known-false-positives.md`
- **Self-Verification After Edits**: Re-read modified sections and log APPLIED/FAILED status in fix report

## Reference Documentation

- [CLAUDE.md](../../CLAUDE.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md) - Keep a ledger of every path you touch, carry it through every compaction, leave anything not on it alone, and stage explicit paths
