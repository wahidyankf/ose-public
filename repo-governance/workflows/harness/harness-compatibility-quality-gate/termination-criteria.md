---
description: The pass/partial/fail conditions by mode level, and the consecutive-pass and below-threshold-findings notes.
when_to_use: Use when checking whether a completed run's status is correctly determined.
---

# Termination Criteria

**Success** (`pass`):

- `lax`: Zero CRITICAL findings on 2 consecutive checks (HIGH/MEDIUM/LOW may exist)
- `normal`: Zero CRITICAL/HIGH findings on 2 consecutive checks (MEDIUM/LOW may exist)
- `strict`: Zero CRITICAL/HIGH/MEDIUM findings on 2 consecutive checks (LOW may exist)
- `ocd`: Zero findings at all levels on 2 consecutive checks

**Partial** (`partial`):

- Threshold-level findings remain after max-iterations safety limit
- Fixer reported out-of-scope findings that require human resolution

**Failure** (`fail`):

- Technical errors during check or fix (e.g., `web-researcher` unreachable, binding
  file unreadable, `Rhino` build failure)

**Note**: Below-threshold findings are reported in the final audit but do not prevent
success status. Success requires two consecutive zero-finding validations (consecutive pass
requirement).
