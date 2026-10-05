---
description: Reasons a plan might declare a non-default Delivery Mode, and why direct-main delivery is unavailable in ose-public.
when_to_use: Use when deciding whether a plan's change justifies overriding the worktree-to-pr default.
---

# When Plans Override the Default Mode

Specify a non-default `## Delivery Mode` field in a plan if:

- **Trivial, well-understood change**: size and simplicity are supporting safety conditions, not an
  eligibility category. Neither direct-push mode has an executable path in `ose-public`. See
  [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).
- **External integration**: Working with a third party that requires a specific branch/PR shape.
- **Compliance**: A regulatory requirement adds a review process beyond the standard PR CI gate.

No example plan override is given: a direct-push example, or a `worktree-to-origin-main` example,
would fail this repo's own `plan-checker` gate on sight.
