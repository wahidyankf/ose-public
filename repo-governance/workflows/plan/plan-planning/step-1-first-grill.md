---
description: Specifies the ten decisions the first grill session must resolve before research begins, and the hard gate on proceeding.
when_to_use: Use when running the first grill session of plan-establishment, or when checking which decisions must be confirmed before Step 2.
---

# Step 1. First Grill — Scope, Constraints, Push Target (Sequential, Hard Gate)

Invoke the `grill-me` Skill to resolve all open design decisions before research begins.

**Orchestrator action**:

Invoke the `grill-me` Skill (`.agents/skills/grill-me/SKILL.md`). Present Step 0 findings.
Every question in this grill MUST follow the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md), present
2-4 concrete, mutually exclusive options with explicit trade-offs, mark exactly one option
Recommended, and use the harness's native interactive multiple-choice tool when available
(markdown fallback otherwise). Open-ended questions without options are FORBIDDEN.

Resolve ALL of the following:

1. **Scope**: What is the exact behaviour to adopt? What is explicitly out-of-scope?
2. **Affected files**: Which governance files, agents, or workflows will change?
3. **Conflicts**: Does any current convention already address this, conflict with it, or need
   updating?
4. **Constraints**: Backwards compatibility, multi-harness binding implications (if the plan
   touches `.claude/agents/`, `.opencode/agents/`, or `repo-governance/` paths, confirm that
   changes remain vendor-neutral per the
   [Governance Vendor-Independence Convention](../../../conventions/structure/governance-vendor-independence.md)),
   tool dependencies
5. **Plan identifier**: What slug should the plan folder use (e.g., `add-foo-convention`)?
6. **Target stage**: Confirm `target-stage` (default `in-progress`). If `backlog`, the plan lands
   at `plans/backlog/<identifier>/`; if `in-progress`, at
   `plans/in-progress/<identifier>/`. Skip this question if the caller already passed
   `target-stage` explicitly (e.g., a parent workflow). Record — resolves `<plan-dir>` for all
   later steps.
7. **Push target**: Confirm where the finished plan should be pushed (default: `origin main`).
   Record — used verbatim in Step 7 without re-asking.
8. **PR vs. direct push — Delivery Mode**: Confirm which of the four
   [Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) options — `worktree-to-pr`
   (default), `worktree-to-origin-main`, `main-to-origin-main`, or `main-to-pr` — governs this
   plan's own future execution. Record the answer so Step 4 instructs `plan-maker` to declare it
   explicitly in the plan's `## Delivery Mode` field; an unmarked field falls through to the
   three-tier precedence (invocation argument > plan field > `worktree-to-pr` default) resolved
   later by [plan-execution.md Step 0](../plan-execution/enter-worktree-preconditions-and-work-branch.md#0-enter-the-designated-worktree-sequential-hard-gate).
   Choosing a `*-to-pr` mode means the plan requires exact-head/base PR CI, one clean current-head
   [`pr-leak-review`](../../pr/pr-leak-review.md), and applicable finite surface gates before merge;
   broad semantic review appears only on direct user request.
9. **Definition of done**: What must the finished plan contain for the user to consider it ready?
10. **Research needed**: Are there external claims (library versions, third-party best practices,
    API behaviour) that require verification before writing?

**Do NOT proceed to Step 2** until:

- All design-decision branches are resolved
- Push target, target stage, and plan identifier are explicitly confirmed
- Definition of done is agreed upon
- Whether research is needed is established (determines Step 2 skip condition)

**Output**: Push target confirmed. Target stage confirmed (`<plan-dir>` resolved). Plan identifier
confirmed. All decisions resolved. Research-needed flag set.

**On failure to resolve**: Do not proceed. Remain in grill until resolved or user cancels.
