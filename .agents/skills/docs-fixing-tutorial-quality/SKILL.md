---
name: docs-fixing-tutorial-quality
description: Domain-specific methodology for docs-tutorial-fixer — re-validating docs-tutorial-checker findings on pedagogical structure, then applying fixes only for objective issues (missing sections, LaTeX delimiters, naming, frontmatter) while flagging subjective narrative/style findings for manual review. Use when applying validated fixes from a tutorial audit report.
---

# Fixing Tutorial Quality

## Overview

This Skill packages `docs-tutorial-fixer`'s domain-specific re-validation and fix methodology
for tutorial pedagogical findings, distinct from the generic maker-checker-fixer mechanics
covered by `repo-applying-maker-checker-fixer` and `repo-assessing-criticality-confidence`.

## Reference Modules

- [Confidence Assessment and Domain Examples](reference/confidence-and-mode-handling.md) —
  the quick-summary workflow and tutorial-specific HIGH/MEDIUM/FALSE_POSITIVE examples
- [HIGH-Confidence Validation Checks](reference/tutorial-validation-checks.md) — the four
  objective re-validation checks with their exact bash patterns
- [MEDIUM-Confidence Subjective Checks](reference/medium-confidence-checks.md) — the four
  subjective-quality categories that always route to manual review
- [Safeguards and Output Format](reference/safeguards-and-output.md) — refusal conditions,
  the required output shape, and convergence safeguards

## Core Principles

- **Objective issues only get HIGH confidence** — missing sections, LaTeX delimiters, naming
  patterns, and frontmatter fields are binary; everything about narrative flow,
  diagram placement, content balance, or writing style is subjective and MEDIUM at best.
- **Re-implement the checker's exact patterns** — use the same bash re-validation snippets as
  `docs-tutorial-checker` so results stay consistent; a mismatch signals a checker bug.
- **Never auto-apply subjective quality improvements.**

## Related Skills

- `repo-applying-maker-checker-fixer` — the generic maker-checker-fixer pattern and mode logic
- `repo-assessing-criticality-confidence` — the generic criticality × confidence priority matrix
- `repo-generating-validation-reports` — report file naming and UUID-chain conventions
