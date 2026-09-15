---
description: States that main-to-pr is unused despite being technically available, the plan-checker enforcement for invalid delivery-mode fields, and the file-naming rule for files inside a plan folder.
when_to_use: Use when checking why main-to-pr is never selected, or when naming a file inside a plan folder.
---

# Per-Repository Delivery Mode Restrictions — Enforcement and File Naming

Continues [Per-Repository Delivery Mode Restrictions (HARD RULE)](./per-repository-delivery-mode-restrictions.md).

`main-to-pr` is not blocked by protection in `ose-public` — it still opens a PR — but
is not used either: every plan here uses **`worktree-to-pr`**, with no exception. The
[Plan-Docs-Only Carve-Out](../../../workflows/plan/plan-planning/plan-docs-only-carve-out.md#the-plan-docs-only-carve-out-superseded--retired-in-ose-public)
and the `.md`-only condition of the content restriction above are **retired** here — direct push is
disallowed by this rule regardless of file content.

**Why this is a hard rule**: a direct push bypasses the branch-protected PR route and its exact-head
`Quality gate`. The only private bypass uses the primary checkout for one of two narrow technical
reasons: infrastructure secrets/state that cannot leave it, or CI-IaC self-validation circularity.
This closes the gap between "convenient" and "actually necessary" that the old `.md`-only carve-out
left open everywhere.

**Enforcement**: `plan-checker` flags any `ose-public` `## Delivery Mode` other than
`worktree-to-pr` as **HIGH**, including `main-to-pr`; no invocation branch may bypass the declared
designated worktree. In the private sibling, `worktree-to-origin-main` is also invalid; a private
`main-to-origin-main` selection is valid only for the binding stateful IaC or CI-IaC categories.

## Important Note on File Naming

Files inside plan folders use descriptive kebab-case names or short industry-standard acronyms (e.g., `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`). The folder structure provides sufficient context, so the filename only needs to describe its purpose.
