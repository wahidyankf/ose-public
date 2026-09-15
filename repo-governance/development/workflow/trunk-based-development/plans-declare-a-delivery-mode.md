---
description: The default-assumption rule for plans, when to declare a Delivery Mode field explicitly, and a worked example.
when_to_use: Use when authoring a plan's Overview and deciding whether it needs an explicit Delivery Mode field.
---

# Plans Declare a Delivery Mode

When creating project plans in `plans/` folder:

- PASS: **Default assumption**: `worktree-to-pr` (repo-wide default) -- a short-lived plan branch in a
  disposable worktree, pushed to a draft PR, merged -- `[AI]` by default -- after the done-definition is met.
- PASS: **Declare the mode explicitly** using a `## Delivery Mode` field only when overriding the
  default (see the [Plans Organization Convention — Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
  for the field syntax and the three-tier precedence).
- **If `main-to-origin-main` is chosen**: document why in the plan and confirm the mode is actually
  permitted under the per-repository restriction. Neither direct-push mode has an executable path in
  `ose-public`; `worktree-to-origin-main` is also unavailable in the private sibling. Only explicitly
  declared `main-to-origin-main` remains there, for stateful IaC needing the primary checkout's real
  secrets/local state or CI-IaC changing its own pipeline, runner, or toolchain provisioning where
  PR self-validation is circular. See
  [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).

**Example plan delivery.md (default mode, no field needed)**:

```markdown
## Overview

All implementation happens on a `worktree-to-pr` plan branch (the repo-wide default -- no
`## Delivery Mode` field needed). Incomplete behaviour reaches `main` only as an internally complete,
tested, inert increment behind a temporary production-disabled feature flag.

**Feature flags**:

- `ENABLE_NEW_PAYMENT_FLOW` - Defaults off in production; both paths pass; removal follows rollout

**Phases**:

1. Phase 1: Add payment models
2. Phase 2: Add payment API (flag OFF)
3. Phase 3: Add payment UI (flag OFF)
4. Phase 4: Integration testing (flag ON in staging)
5. Phase 5: Production rollout (flag ON in production) -- PR merged once green and the hardened preconditions hold (`[AI]` by default)
```
