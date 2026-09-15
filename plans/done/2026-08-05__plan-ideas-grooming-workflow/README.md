# Plan: Author and Propagate the `plan-ideas-grooming` Workflow

## Context

`plans/ideas/` across the four OSE repos (`ose-public`, `ose-primer`, the private sibling,
`beaver-nest`) has grown into a flat, unorganized pile of two-pager idea briefs — 52 files in
`ose-public`, 44 in `beaver-nest`, 21 in the private sibling, 6 in `ose-primer` `[Repo-grounded]`
(counted 2026-08-05). Nothing merges near-duplicate ideas, nothing classifies them by
urgency/importance, and nothing decides which repo an idea should actually live in. A direct
`diff` confirms `rhino-cli-env-backup-scripts.md` is **byte-identical** across `ose-public`,
the private sibling, and `beaver-nest` `[Repo-grounded]` — the same idea, filed three times, with no
mechanism reconciling that duplication or deciding which repo should own it.

This plan does **not** perform that reorganization. It authors a new, reusable **workflow
document** — `plan-ideas-grooming.md` — that defines how the reorganization should happen: merge
near-duplicate ideas, split ideas that bundle unrelated concerns, classify by Eisenhower quadrant,
reshape into strict two-pager compliance, correct cross-repo residency per three placement rules
(generalizable → `ose-public`, secrets-bearing → the private sibling only, single-repo-only → that repo
only), and **rename** an idea-doc's filename when it no longer matches its content (post-merge/
split, non-kebab-case, or a residency-driven context change). The name draws the direct analogy to
Scrum's "backlog grooming" — periodically refining, reorganizing, splitting, merging, and pruning
backlog items — which is a closer semantic match to what this workflow does than the more generic
"maintenance" working name it started with. This plan authors that workflow once in `ose-public`,
then propagates it — using the same content-copy propagation pattern already used for other
`repo-governance/` documents in this codebase — to all four repos, so the workflow can be invoked
from any of them. **Running the workflow against the four repos' live `plans/ideas/` content is
explicitly out of scope for this plan** — that is a separate, future invocation.

Because no existing workflow type describes "a recurring sweep/reorganization over already-existing
docs, with no iterate-to-zero-findings loop and no new plan as terminal deliverable," this plan
also amends [`workflow-naming.md`](../../../repo-governance/conventions/structure/workflow-naming.md)
to add a fifth Type Vocabulary token, `grooming`, before the workflow file itself can be named
compliantly.

## Scope

**In scope**:

- Add the `grooming` type token to `workflow-naming.md`'s Type Vocabulary (definition, updated
  enforcement regex, updated examples) — `ose-public` only, this is the source-of-truth convention.
- Author `repo-governance/workflows/plan/plan-ideas-grooming.md` in `ose-public` — a new workflow
  document following the house pattern of `plan-execution.md` / `plan-planning.md`, specifying all
  seven capabilities: merge, split, Eisenhower-classify, reshape, cross-repo relocate, **rename**,
  and link-integrity rewrite (the rename case folded into the same rewrite-step design, not a
  separate mechanism — see `tech-docs.md` DD-7).
- Update `repo-governance/workflows/README.md` in `ose-public` — add the new workflow to the
  Available Workflows table, the Type Vocabulary table, and the Plan workflow family bullet list.
- Propagate the same conceptual amendments (adapted, not blind-copied, since `workflow-naming.md`
  and `workflows/README.md` already carry real per-repo drift — confirmed by `diff`, 12–292 lines
  of difference depending on the file and repo `[Repo-grounded]`) to `ose-primer`, the private sibling,
  and `beaver-nest`.
- Propagate `plan-ideas-grooming.md` itself as a byte-identical copy to all three sibling
  repos — it is brand-new content with no existing drift to reconcile, and is authored
  machine-path-agnostic so an identical copy is correct in every repo.

**Out of scope** (see `brd.md` / `prd.md` for the full non-goals lists):

- Actually running `plan-ideas-grooming` against any repo's live `plans/ideas/` folder.
- Merging, splitting, reclassifying, relocating, or renaming any existing idea brief.
- Creating the Eisenhower quadrant subfolders (`q1-urgent-important/` etc.) under any repo's
  `plans/ideas/`.
- Any change to `plans/ideas/README.md` in any repo.
- Running `npm run generate:bindings` or any harness-sync command.

**Affected repos**: `ose-public` (source of truth, authored first), `ose-primer`, the private sibling,
`beaver-nest` (propagation targets).

## Approach Summary

1. Author the `grooming` type token and the workflow document once, in `ose-public`, committed and
   pushed directly to `origin/main` (this plan's own Delivery Mode is `main-to-origin-main` — no
   worktree, no PR, no PR-Review Maker→Fixer Cycle; see "Worktree and Delivery Mode" below).
2. Propagate the (adapted) convention amendment, the (adapted) workflow catalog entry, and the
   (byte-identical) new workflow file to the three sibling repos, each as its own direct
   commit-and-push to that repo's `origin/main` — following the existing content-copy propagation
   pattern this codebase already uses for other `repo-governance/` documents, and using the same
   `main-to-origin-main` mode as `ose-public`'s own authoring step.
3. Each propagation is independent of the other two (no shared files, no ordering dependency
   between siblings) but depends on `ose-public`'s change having landed on `origin/main` first,
   since propagation copies the _finalized_ content, not a pre-push draft.

See [`brd.md`](./brd.md) for business rationale, [`prd.md`](./prd.md) for product requirements and
Gherkin acceptance criteria, [`tech-docs.md`](./tech-docs.md) for architecture and the detailed
design of the workflow document itself, and [`delivery.md`](./delivery.md) for the phased
delivery checklist.

## Resolved Design Decisions (from grilling)

| #   | Decision                                 | Resolution                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Workflow type token                      | Add a new `grooming` token to `workflow-naming.md`'s Type Vocabulary rather than reusing `execution`/`planning`/`quality-gate`/`setup` — named after Scrum's "backlog grooming," a closer semantic match than the earlier "maintenance" working name.                                                                                       |
| 2   | Filename / typo                          | `plan-ideas-grooming.md` — the original "mantenance" typo is moot; the workflow was renamed to `grooming` for semantic accuracy (see Decision 1).                                                                                                                                                                                           |
| 3   | Plan scope                               | Author-only, with mandatory 4-repo propagation of the workflow doc + convention amendment. No live reorganization in this plan.                                                                                                                                                                                                             |
| 4   | Eisenhower folder names                  | `q1-urgent-important/`, `q2-not-urgent-important/`, `q3-urgent-not-important/`, `q4-not-urgent-not-important/` — numbered so `ls` sorts them in matrix order.                                                                                                                                                                               |
| 5   | Urgency rubric                           | Falsifiable: urgent = names/blocks/risks an active `plans/in-progress/`/`plans/backlog/` plan, OR documents an already-observed live defect/incident/drift — not hypothetical or aspirational.                                                                                                                                              |
| 6   | Importance rubric (plan-maker proposal)  | Falsifiable: important = affects ≥2 repos, a security/secrets concern, a data-integrity/loss risk, a currently-blocking CI gate, or a rule an existing checker enforces. Everything else is not-important.                                                                                                                                  |
| 7   | Cross-repo move safety model             | Create-in-destination-first, verify landed, then delete from source — duplication is the safe failure mode, loss is not.                                                                                                                                                                                                                    |
| 8   | Delivery Mode                            | `main-to-origin-main` for **both** this authoring plan (explicit user override of the repo default, applying to `repo-governance/` changes too) **and** the future `plan-ideas-grooming` workflow's own runs (documented default, with a `delivery-mode` input override for a caller who wants `worktree-to-pr` for a specific invocation). |
| 9   | Recurrence                               | The workflow states a concrete re-run trigger (file-count threshold OR elapsed-time threshold, whichever comes first) rather than reading as a disguised one-off migration.                                                                                                                                                                 |
| 10  | Relocation / merge-split autonomy        | Autonomous execution with a logged, auditable rationale ledger — no per-file human confirmation gate, consistent with idea docs being explicitly low-stakes per `plans/ideas/README.md`.                                                                                                                                                    |
| 11  | Provenance preservation                  | A one-line relocation note appended to the moved doc's existing provenance blockquote.                                                                                                                                                                                                                                                      |
| 12  | Link/reference integrity (incl. renames) | The workflow itself rewrites links as an explicit step (intra-repo relative-path fixes; cross-repo relative-to-absolute-GitHub-URL conversion), not left to `md links validate` to catch after the fact — the **rename** capability (the seventh capability, added mid-grilling) is folded into this same step, never a separate mechanism. |

## Worktree and Delivery Mode

This plan uses no worktree — see [`delivery.md`](./delivery.md)'s `## Worktree` section for the
explicit no-worktree declaration and `## Delivery Mode: main-to-origin-main` for the full direct
local-`main`-to-`origin/main` delivery model, in all four repos.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
