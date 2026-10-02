---
description: Lists the principles and conventions this workflow implements, for governance-alignment auditing.
when_to_use: Use when auditing this workflow's governance alignment or citing which principle or convention a rule traces to.
---

# Principles Implemented/Respected

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Every cross-repo deviation is explicitly surfaced, decided, and recorded. No implicit alignment
  is permitted.
- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**:
  Two grill sessions and an optional research step before authoring ensure plans are built on
  verified, negotiated decisions rather than assumptions about what other repos need.
- **[Documentation First](../../../principles/content/documentation-first.md)**:
  Plans are the terminal deliverable. The rationale doc in each repo's `docs/explanation/` tree
  makes every decision inspectable by future contributors.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  Survey, matrix construction, research, plan authoring, and quality gating are all orchestrated
  steps, not manual handoffs.
- **[No Time Estimates](../../../principles/content/no-time-estimates.md)**: Workflow describes
  what is produced and what decisions are required, never how long each step takes.

## Conventions Implemented/Respected

- **[Plans Organization Convention](../../../conventions/structure/plans.md)**: Fixed mature core
  plus exactly one reader-led technical form; stage-aware folder naming (no date prefix in `backlog/` or
  `in-progress/`; completion-date prefix in `done/` only); worktree specification in each plan's
  `delivery.md`.
- **[Worktree Path Convention](../../../conventions/structure/worktree-path.md)**: Worktrees land
  at `worktrees/<objective-slug>/` in the repo root.
- **[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)**:
  Steps 3 and 5 grill sessions present 2-4 concrete options per question; one option is marked
  Recommended; open-ended questions without options are forbidden.
- **[Commit Messages Convention](../../../development/workflow/commit-messages.md)**: Conventional
  Commits format; thematic splits; imperative mood; no period at end.
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use
  GitHub-compatible markdown with `.md` extensions and relative paths.
- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Lowercase kebab-case
  for all plan files and rationale docs created by this workflow.
- **[No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md)**: No
  system secret enters any plan file or rationale doc created by this workflow.
- **[Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md)**:
  External research delegated to `web-researcher` in Step 4 when the research-needed flag
  is set.
- **[Plans Organization Convention §Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)**:
  each per-repo plan authored in Step 6 declares its own `## Delivery Mode` field, resolved
  independently per repo via the three-tier precedence; divergence across repos is recorded as a
  deviation-matrix row like any other per-repo difference — distinct from this workflow's own
  planning-phase `mode` input.
