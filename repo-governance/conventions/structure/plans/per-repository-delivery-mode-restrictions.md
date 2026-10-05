---
description: States which delivery modes are actually available in ose-public given its branch-protection state.
when_to_use: Use when confirming which delivery modes are actually permitted in this repository.
---

# Per-Repository Delivery Mode Restrictions (HARD RULE)

The four-mode table and the content restriction above state what is theoretically possible; this
subsection states what is **actually allowed in this repository**, and is the narrower, binding rule.
Direct push to `origin main` is a scarce, protected capability going forward — not a convenience
available wherever a plan finds it easier.

- **`ose-public`**: `main` is branch-protected against direct pushes, **including for
  repository admins** — verified live via a legacy `/branches/main/protection` check. Note that a
  repo whose protection is expressed as a repository _ruleset_ is misreported as unprotected by that
  legacy endpoint alone, so check the rulesets API too before concluding a repo is unprotected.
  `worktree-to-origin-main` and `main-to-origin-main` are therefore **unavailable** here — no
  credential or role can push to `main` outside a merged PR.

This rule governs `ose-public` alone; the
[Related Repositories Convention](../related-repositories.md#independent-repositories) states how this
repository relates to the others.

See [Per-Repository Delivery Mode Restrictions — Enforcement and File Naming](./per-repository-restrictions-enforcement-and-file-naming.md) for `main-to-pr`'s status in `ose-public` and the enforcement rules.
