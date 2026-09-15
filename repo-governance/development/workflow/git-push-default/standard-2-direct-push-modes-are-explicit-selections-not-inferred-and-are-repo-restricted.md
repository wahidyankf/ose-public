---
description: Per-repository availability of direct-push modes and the explicit selection signals required for the sole private main-to-origin-main IaC or CI-IaC exceptions.
when_to_use: Use when a plan or invocation might call for pushing directly to origin main, to confirm the repository allows it and a valid selection signal is present.
---

# Standard 2: Direct Push Modes Are Explicit Selections, Not Inferred — and Are Repo-Restricted

`worktree-to-origin-main` and `main-to-origin-main` push directly to `origin main` with no PR. Before
either signal below is even relevant, check repository availability first: in `ose-public`,
`main` is branch-protected against direct pushes (including for admins) — **neither
direct-push mode has an executable path there, full stop**.

In the private sibling, `worktree-to-origin-main` is also unavailable. Only `main-to-origin-main` remains
available, and only for either stateful IaC work needing the primary checkout's real secrets/local
state or CI-IaC work changing the repository's own pipeline, runner, or toolchain provisioning where
PR self-validation is circular. Every other plan, in both repositories, uses `worktree-to-pr`. See
[Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
for the full per-repository rule — this is the current binding constraint, and it applies before the
selection-signal and content-restriction tests below.

Where `main-to-origin-main` remains available, it applies only when explicitly selected — via an
invocation argument or a plan's `## Delivery Mode` field — and when one of those two private
categories applies. Explicit selection never makes `worktree-to-origin-main` available. Absent a
valid selection and category, the agent uses the `worktree-to-pr` default.

```bash
# main-to-origin-main — <private-sibling> named IaC or CI-IaC exception only
# Run from the non-bare primary checkout; the plan records ## Worktree as N/A.
git add <files>
git commit -m "fix(scope): description"
git push origin main
```

Signals that constitute an explicit direct-push selection:

- An invocation argument naming `main-to-origin-main` for eligible private-sibling IaC or CI-IaC work.
- A `## Delivery Mode` field declaring `main-to-origin-main` with the eligible category and rationale.

No other signal constitutes an implicit selection of a direct-push mode. The agent must not infer a
direct-push intent from:

- The size or risk of the change.
- A desire to "save time" or "skip review".
- Past sessions in which direct push was used.

An explicit signal is necessary but not sufficient: the private change must be either named IaC
(real secrets/local state) or named CI-IaC (pipeline, runner, or toolchain provisioning whose PR
self-validation is circular). Markdown-only content and standing go-ahead do not create another
exception. Valid main-based plans use the primary checkout and record `## Worktree` as
`Not applicable (N/A)`; all others use `worktree-to-pr`.
