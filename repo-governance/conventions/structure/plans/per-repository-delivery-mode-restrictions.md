---
description: States which delivery modes are actually available in ose-public and the private sibling given each repo's branch-protection state.
when_to_use: Use when confirming which delivery modes are actually permitted in the specific repository a plan targets.
---

# Per-Repository Delivery Mode Restrictions (HARD RULE)

The four-mode table and the content restriction above state what is theoretically possible; this
subsection states what is **actually allowed per repository**, and is the narrower, binding rule.
Direct push to `origin main` is a scarce, protected capability going forward — not a convenience
available wherever a plan finds it easier.

- **`ose-public`**: `main` is branch-protected against direct pushes, **including for
  repository admins** — verified live via a legacy `/branches/main/protection` check. Note that a
  repo whose protection is expressed as a repository _ruleset_ is misreported as unprotected by that
  legacy endpoint alone, so check the rulesets API too before concluding a repo is unprotected.
  `worktree-to-origin-main` and `main-to-origin-main` are therefore **unavailable** here — no
  credential or role can push to `main` outside a merged PR.
- **The private sibling**: `worktree-to-pr` is likewise the required mode for **every plan except** two
  qualifying categories. Only `main-to-origin-main` is available for either category;
  `worktree-to-origin-main` remains unavailable. The first category is stateful infrastructure as
  code (Terraform, Ansible, and equivalent state-changing infra work) needing the real `.env`
  credentials or local infrastructure state that exist only in the primary checkout — never in a
  worktree provisioned fresh from `origin/main` — per the
  [secret- and state-dependent infra operations rule](../../../workflows/plan/plan-execution/enter-worktree-preconditions-and-work-branch.md#0-enter-the-designated-worktree-sequential-hard-gate).
  The second category is CI-IaC changing the repository's own pipeline, runner, or toolchain
  provisioning where PR self-validation is circular. Both categories are narrower than the general
  `.md`-only / explicit-go-ahead content restriction above: the exception is granted for one of
  these **two stated reasons specifically** — infrastructure secrets/state or CI-pipeline
  self-validation circularity — not for any `.md`-only plan-docs change or ad-hoc go-ahead. A
  non-IaC, non-CI-IaC, plan-docs-only change in the private sibling uses `worktree-to-pr` like everything
  else — the old two-condition test no longer applies there.
  **The private sibling's own branch-protection state is unverified as of this PR** — its rules API returned
  `403 Upgrade to GitHub Pro` when checked live, so this rule's restriction there rests on a
  convention-enforced (not independently confirmed mechanically-enforced) footing until it is checked
  with sufficient API access.

See [Per-Repository Delivery Mode Restrictions — Enforcement and File Naming](./per-repository-restrictions-enforcement-and-file-naming.md) for `main-to-pr`'s status in `ose-public` and the enforcement rules.
