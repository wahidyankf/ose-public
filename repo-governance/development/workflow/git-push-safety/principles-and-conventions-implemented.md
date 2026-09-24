---
description: The principles and companion conventions the Git Push Safety Convention implements and respects.
when_to_use: Use when tracing why force-push and hook-bypass approval requirements exist back to the principles and conventions they respect.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Force-push and hook-bypass operations alter remote history or skip quality gates. The consequences cannot be undone without coordination — they are exactly the kind of irreversible decision that demands human judgment before execution, not autonomous action by a machine.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: The need to force-push or bypass hooks is almost always a symptom of a deeper problem (diverged history, a failing check, a missing rebase). This convention redirects attention to the root cause rather than normalizing the shortcut as an acceptable routine action.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Implicit permission — "the user approved a force-push earlier, so subsequent ones are also approved" — is the silent assumption this convention forbids. Each instance requires a fresh, visible confirmation so the risk is never hidden.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](../../quality/code.md)**: The pre-push hook runs `typecheck`, `lint`, and `test:quick` as mandatory quality gates. Using `--no-verify` bypasses these gates and must not be treated as a routine shortcut by agents or automation.

- **[Commit Message Convention](../commit-messages.md)**: Conventional Commits format, checked by review, keeps history accurate. Force-pushing rewrites that history; only the user can decide when that trade-off is justified.
