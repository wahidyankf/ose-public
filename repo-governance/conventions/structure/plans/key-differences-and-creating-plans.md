---
description: Contrasts plans/ against docs/ across location, purpose, and lifecycle, then walks through the seven steps of creating a new plan.
when_to_use: Use when deciding whether new content belongs in plans/ or docs/, or when starting to author a new plan.
---

# Key Differences from Documentation and Creating Plans

## Key Differences from Documentation

Plans differ from `docs/` in several important ways:

| Aspect           | Plans (`plans/`)                      | Documentation (`docs/`)              |
| ---------------- | ------------------------------------- | ------------------------------------ |
| **Location**     | Root-level `plans/` folder            | Root-level `docs/` folder            |
| **Purpose**      | Temporary project planning            | Permanent documentation              |
| **File Naming**  | Kebab-case by purpose                 | Kebab-case describing content        |
| **Lifecycle**    | Move between in-progress/backlog/done | Evolve and update in place           |
| **Audience**     | Project team, stakeholders            | All users, contributors, maintainers |
| **Longevity**    | Temporary (archived in done/)         | Permanent (evolves over time)        |
| **Organization** | By project and status                 | By Diátaxis category                 |

## Creating Plans

1. **Confirm literal authorization**: do not create any `plans/` artifact from Plan Mode,
   discovery, or task planning alone.
2. **Start with the authorized maturity**: use an explicitly requested two-pager for early work or
   a formal plan for mature work.
3. **Formalize when ready**: Promote an authorized two-pager to a full plan folder in `backlog/` when ripe.
4. **Follow naming convention**: Use `[project-identifier]/` format (no date prefix in `backlog/`).
5. **Use the mature core**: Create `README.md`, `brd.md`, `prd.md`, `delivery.md`, `learnings.md`,
   and exactly one reader-led technical form.
6. **Resolve design decisions via structured grilling**: Before writing plan content, resolve all
   open design decisions using the
   [Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md) — structured
   multiple-choice questions with 2-4 concrete options, explicit trade-offs, and exactly one Recommended
   option. Never ask open-ended "what approach?" questions without offering structured options.
7. **Create content**: Write the comprehensive evidence-to-delivery record, including alternatives and prior art.
   Schedule by dependency, order, and resource; plan documents state no time estimates per
   [No Time Estimates](../../../principles/content/no-time-estimates.md).
8. **Update index**: Add the plan to `backlog/README.md`.
