---
description: Per-repository availability of direct-push modes, and why no selection signal makes one available in ose-public.
when_to_use: Use when a plan or invocation might call for pushing directly to origin main, to confirm the repository allows it.
---

# Standard 2: Direct Push Modes Are Explicit Selections, Not Inferred — and Are Repo-Restricted

`worktree-to-origin-main` and `main-to-origin-main` push directly to `origin main` with no PR. Before
any selection signal is even relevant, check repository availability first: in `ose-public`,
`main` is branch-protected against direct pushes (including for admins) — **neither
direct-push mode has an executable path there, full stop**. Every plan uses `worktree-to-pr`. See
[Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
for the full rule — this is the current binding constraint, and it applies before any
selection-signal or content-restriction test.

No selection signal changes this. An invocation argument or a plan's `## Delivery Mode` field naming
a direct-push mode selects nothing available here, so the agent uses the `worktree-to-pr` default.
The agent must not infer a direct-push intent from:

- The size or risk of the change.
- A desire to "save time" or "skip review".
- Past sessions in which direct push was used.

Markdown-only content and standing go-ahead do not create an exception.
