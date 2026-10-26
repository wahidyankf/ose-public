---
description: What the Git Push Default Convention covers — delivery-mode push behaviour and checklist authoring — and what it explicitly defers to companion conventions.
when_to_use: Use when determining whether a git-push question is governed by this convention or by one of its companions.
---

# Scope

## What This Convention Covers

- Default push and PR-opening behaviour for every delivery mode.
- Linear history maintenance before every push, whether to a PR branch or to `origin main`.
- Agent behaviour in all plan contexts: `plan-maker`, `plan-checker`, `plan-quality-gate`, and the
  plan-execution workflow.
- Delivery checklist authoring — plan documents must declare a `## Delivery Mode` field only when
  overriding the default, and must tag git-mechanical steps correctly for the resolved mode.
- Retroactive compliance — preexisting violations fixed when encountered.

## What This Convention Does NOT Cover

- Force-push and `--no-verify` safety rules: governed by the
  [Git Push Safety Convention](../git-push-safety.md), including its worktree-to-PR pre-authorization.
- PR merge authority, exact-head PR CI, optional semantic review, and the done-definition once a PR
  is opened: governed by the [PR Merge Protocol Convention](../pr-merge-protocol.md).
- The full four-mode vocabulary and the precedence algorithm itself: defined once, canonically, in the
  [Plans Organization Convention — Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode).
