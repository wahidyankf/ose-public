---
description: The five-step Red/Run/Green/Refactor/Promote cycle for treating a manual verification script like an automated test.
when_to_use: Use when a behaviour cannot or should not be automated and needs a written, repeatable manual verification script instead.
---

# Manual verification is part of TDD

Manual verification is not a hand-wavy "click around and see." When TDD is applied to manual
work, the failing test is a **written, dated, repeatable verification script** that captures
the exact steps and expected observations. Treat it like an automated test:

1. **Red (write the script)**: Author a step-by-step script in the plan's `delivery.md` (or a
   linked checklist) — preconditions, steps, expected observations. Mark each expected
   observation as a discrete check. The script is "red" because the implementation does not
   yet satisfy it.
2. **Run the script**: Execute the steps using Playwright MCP for UI, `rtk curl` for HTTP APIs,
   or whatever boundary tool fits. Confirm each expected observation fails (right reason).
3. **Green (implement)**: Make the minimum change needed for every check in the script to
   pass. Re-run the entire script. Every check must pass.
4. **Refactor**: Clean up the implementation; re-run the script to confirm it still passes.
5. **Promote when feasible**: If the script can be automated cheaply (Playwright spec,
   integration test), automate it as part of the same delivery item. Manual scripts that
   cover a recurring behaviour are technical debt — automate them.

See [Manual Behavioural Verification Convention](../../quality/manual-behavioural-verification.md)
for the script structure and tooling defaults (real-browser UI proof, `rtk curl` for HTTP APIs, and
protocol-native wire clients for non-HTTP APIs).
