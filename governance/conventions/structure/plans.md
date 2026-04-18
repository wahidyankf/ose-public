---
title: "Plans Organization Convention"
description: Standards for organizing project planning documents in plans/ folder
category: explanation
subcategory: conventions
tags:
  - conventions
  - plans
  - project-planning
  - organization
created: 2025-12-05
updated: 2025-12-05
---

# Plans Organization Convention

<!--
  MAINTENANCE NOTE: Master reference for plans organization
  This convention is referenced by:
  1. plans/README.md (brief landing page with link to this convention)
  2. AGENTS.md (summary with link to this convention)
  3. .claude/agents/plan-maker.md (reference to this convention)
  When updating, ensure all references remain accurate.
-->

This document defines the standards for organizing project planning documents in the `plans/` folder. Plans are temporary, ephemeral documents used for project planning and tracking, distinct from permanent documentation in `docs/`.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Flat structure with three clear states (backlog, in-progress, done). No complex nested hierarchies or status tracking systems.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The `YYYY-MM-DD__[project-identifier]/` date-prefix naming convention makes chronological order explicit. File location (backlog/, in-progress/, done/) indicates status - no hidden metadata or databases required.

## Purpose

This convention establishes the organizational structure for project planning documents in the `plans/` directory. It defines how to organize ideas, backlog, in-progress work, and completed projects using date-based folder naming and standardized lifecycle stages.

## Scope

### What This Convention Covers

- **Plans directory structure** - ideas.md, backlog/, in-progress/, done/ organization
- **Folder naming pattern** - `YYYY-MM-DD__[project-identifier]/` format
- **File organization** - What files belong in each folder
- **Lifecycle stages** - How plans move from ideas → backlog → in-progress → done
- **Project identifiers** - How to name projects consistently

### What This Convention Does NOT Cover

- **Plan content format** - How to write plans (covered by plan-checker agent)
- **Project management methodology** - This is file organization, not PM process
- **Task tracking** - Covered by the [plan-execution workflow](../../workflows/plan/plan-execution.md) (orchestrated directly by the calling context)
- **Deployment scheduling** - Covered in deployment conventions

## Overview

The `plans/` folder serves as the workspace for project planning activities:

- **Purpose**: Temporary project planning and tracking
- **Location**: Root-level `plans/` folder (not inside `docs/`)
- **Lifecycle**: Plans move between subfolders as work progresses
- **Format**: Structured markdown documents following specific naming and organization conventions

**Key Distinction**: Plans are temporary working documents that eventually move to `done/` and may be archived, while `docs/` contains permanent documentation that evolves over time.

## ️ Folder Structure

The `plans/` folder is organized into four main components:

```
plans/
├── ideas.md         # Quick 1-3 liner ideas not yet formalized into plans
├── backlog/         # Planned projects for future implementation
├── in-progress/     # Active plans currently being worked on
└── done/            # Completed and archived plans
```

### Subfolder Purposes

**backlog/** - Planning Queue

- Contains plans that are ready for implementation but not yet started
- Plans are fully structured with requirements, tech docs, and delivery sections
- Each subfolder has a `README.md` listing all plans in backlog

**in-progress/** - Active Work

- Contains plans currently being executed
- Plans being actively worked on by the team
- Limited to a small number of concurrent plans (prevents context switching)
- Each subfolder has a `README.md` listing all active plans

**done/** - Completed Work

- Contains completed and archived plans
- Plans are moved here when implementation is finished
- Serves as historical record of project evolution
- Each subfolder has a `README.md` listing all completed plans

## Ideas File

**Location**: `plans/ideas.md` (root level of plans/ folder)

**Purpose**: Capture quick ideas and todos that haven't been formalized into full plan documents yet.

### Characteristics

- **Lightweight**: Simple markdown file with bullet points or numbered lists
- **Quick Capture**: Each idea should be 1-3 lines maximum
- **No Structure**: No formal plan structure required
- **Brainstorming**: Ideas that need more thought before becoming formal plans

### Format

```markdown
# Ideas

Quick ideas and todos that haven't been formalized into plans yet.

- Add OAuth2 authentication system with Google and GitHub providers
- Implement real-time notification system using WebSockets
- Create admin dashboard for user management and analytics
- Optimize database queries for better performance
```

### Difference from backlog/

- **ideas.md**: 1-3 liner quick captures without detailed structure
- **backlog/**: Full plan folders with structured requirements, tech-docs, and delivery files

### Promoting an Idea to a Plan

When an idea is ready for formal planning:

1. Create a new plan folder in `backlog/` with `YYYY-MM-DD__[project-identifier]/` format
2. Create the standard plan files (README.md or multi-file structure)
3. Remove or check off the idea from `ideas.md`
4. The idea now has a structured plan with requirements, technical docs, and delivery timeline

## Plan Folder Naming

**CRITICAL**: Every plan folder MUST follow this naming pattern:

```
YYYY-MM-DD__[project-identifier]/
```

### Naming Rules

- **Date Format**: ISO 8601 format (`YYYY-MM-DD`)
- **Date Meaning**:
  - In `backlog/` and `in-progress/`: Plan creation date
  - In `done/`: Updated to completion date when moved
- **Separator**: Double underscore `__` separates date from identifier
- **Identifier**: Kebab-case (lowercase with hyphens)
- **No Spaces**: Use hyphens instead of spaces
- **No Special Characters**: Only alphanumeric and hyphens in identifier

### Examples

**Good**:

- `2025-11-24__init-monorepo/`
- `2025-12-01__auth-system/`
- `2026-01-15__mobile-app-redesign/`
- `2025-12-05__payment-integration/`

**Bad**:

- `2025-11-24_init-monorepo/` (single underscore)
- `init-monorepo/` (missing date)
- `2025-11-24__Init Monorepo/` (capital letters, spaces)
- `2025-11-24__init_monorepo/` (underscores in identifier)

## Plan Contents

Plans can use either **single-file** or **multi-file** structure depending on size and complexity.

### Structure Decision

**Multi-File Structure** (default — five documents):

- Use for any plan with substantive business intent, product scope, and technical design to record
- Five separate files: `README.md`, `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`
- Each file owns one concern (see Content-Placement Rules below), so diffs stay narrow per PR and cross-reviewers can find the section relevant to their concern without skimming an omnibus file
- Use for complex, large-scale plans, and any plan where the business rationale deserves its own file

**Single-File Structure** (exception for trivially small plans, ≤ 1000 lines total):

- Use only when combined business rationale + product scope + tech-docs + delivery ≤ 1000 lines AND the plan is simple enough that collapsing all five concerns into one README does not hide them
- All content in a single `README.md` file
- Simpler for one-shot edits, quick config changes, and similarly scoped work
- If the plan grows past 1000 lines or the author can foresee the plan growing mid-execution, promote to the multi-file layout before execution begins

**Decision Rule**: Default to the five-document multi-file layout. Collapse to single-file only when the plan is trivially small AND a condensed BRD + condensed PRD can both fit comfortably in the README without crowding out the technical sections.

### Single-File Structure

```
2025-12-01__feature-name/
└── README.md                # All-in-one plan document
```

**README.md sections** (mandatory, in order):

1. **Context** — project description, background, non-technical framing
2. **Scope** — in-scope + out-of-scope; affected subrepos / apps named explicitly
3. **Business rationale (condensed BRD)** — why this matters, business goals, affected roles, success metrics (gut-based reasoning OK; judgment calls labeled; fabricated KPIs forbidden; internet citations inline with excerpt + URL + access date)
4. **Product requirements (condensed PRD)** — user stories (`As a … I want … So that …`), Gherkin acceptance criteria, product scope
5. **Technical approach** — architecture, design decisions, implementation approach
6. **Delivery checklist** — phased `- [ ]` items with one concrete action per checkbox
7. **Quality gates** — local gates + CI gates that must pass
8. **Verification** — how to confirm the plan is done

If the author cannot comfortably fit both the condensed BRD and condensed PRD sections into the README without crowding out the technical sections, promote the plan to the five-document multi-file layout before execution begins.

### Multi-File Structure

```
2025-12-01__feature-name/
├── README.md                # Plan overview and navigation
├── brd.md                   # Business Requirements Document
├── prd.md                   # Product Requirements Document
├── tech-docs.md             # Technical documentation and architecture
└── delivery.md              # Step-by-step delivery checklist
```

**File purposes**:

- **README.md**: High-level overview and navigation — Context, Scope (with affected subrepos / apps named explicitly), Approach Summary, and links to the other four files. First file a reader opens; first file checkers parse for scope.
- **brd.md** — **Business Requirements Document**: business goal and rationale ("why are we doing this"), business impact, affected roles, business-level success metrics, business-scope Non-Goals, business risks and mitigations. Content-placement container, not a sign-off artifact — code review is the only approval gate in this repo.
- **prd.md** — **Product Requirements Document**: product overview, personas, user stories (`As a … I want … So that …`), acceptance criteria in Gherkin, product scope (in-scope + out-of-scope features), product-level risks.
- **tech-docs.md**: architecture, design decisions with rationale, file-impact analysis, mechanics, dependencies, risks, rollback. No step-by-step checklist.
- **delivery.md**: sequential, ticked checklist of executable steps (`- [ ]`), organized by phase if needed. Plan-execution workflow reads this file to drive execution; `plan-execution-checker` reads it to verify completion.

### Content-Placement Rules (brd.md vs prd.md)

Authoritative split between `brd.md` and `prd.md`. These rules are normative for `plan-maker` / `plan-checker` / `plan-fixer` — the agents share one definition to avoid drift.

> **Solo-maintainer framing**: BRD and PRD are **content-placement containers**, not sign-off artifacts. This repo has one maintainer collaborating with AI agents; code review (the PR) is the only approval gate. The convention MUST NOT introduce sponsor sign-off, stakeholder approval ceremonies, or role-based gates.

**Goes in `brd.md` (business perspective)**:

- Business goal and rationale ("why are we doing this")
- Business impact (pain points, expected benefits)
- Affected roles (which hats the maintainer wears; which agents consume the file) — **not** sign-off mapping
- Business-level success metrics. BRD does not require every claim to be data-driven — gut-based reasoning is acceptable **when the logic supports the claim**. What is NOT acceptable: fabricated numeric targets (percentages, durations, counts) presented as already-measured facts when no baseline exists. Options when writing a success metric:
  1. **Observable fact** (preferred): cite a grep/git/agent-round-trip check that verifies on demand (e.g., "zero plans using the deprecated layout after migration").
  2. **Cited measurement**: reference an existing dashboard, prior measurement, or external data source. When you cite data pulled from the internet, include the data itself in the plan (specific number, quote, excerpt) alongside the URL and the access date. URL-only citations are not enough — links rot.
  3. **Qualitative reasoning**: state the structural claim plainly without a number.
  4. **Judgment call / gut target**: allowed, but MUST be explicitly labeled (e.g., "_Judgment call:_ we expect review time to drop; no baseline measured").
- Business-scope Non-Goals
- Business risks and mitigations

**Goes in `prd.md` (product perspective)**:

- Product overview (what is being built)
- Personas (hats the maintainer wears; agents that consume the file) — **not** external stakeholder roles
- User stories (`As a … I want … So that …`)
- Acceptance criteria in Gherkin
- Product scope (in-scope features, out-of-scope features)
- Product-level risks (UX, feature interaction)

**Ambiguous cases**: When a concern is genuinely cross-cutting (e.g., a success criterion is both a business-level fact and a product acceptance criterion), place the **factual claim or judgment** in `brd.md` and the **testable scenario** in `prd.md`, cross-linking between them. Do not duplicate the full content. If the BRD side is a judgment call rather than a measured fact, label it as such — do not fabricate a number and pretend it was measured.

### Granular Checklist Items in delivery.md

Every checkbox in `delivery.md` must represent exactly one concrete, independently verifiable action. Multi-step work hidden behind a single checkbox defeats the purpose of a checklist: it makes progress invisible and creates ambiguity about what "done" means.

**Rule**: One checkbox = one concrete action. If completing the item requires multiple distinct steps, split it into multiple checkboxes.

**Bad** (too coarse — hides multiple steps):

```markdown
- [ ] Implement coverage merging with all formats and tests
```

**Good** (granular — each item is independently completable):

```markdown
- [ ] Create `internal/testcoverage/merge.go` with format-agnostic merge logic
- [ ] Implement `CoverageMap` type for normalized per-line data
- [ ] Add parsers to return `CoverageMap` from each format
- [ ] Write unit tests for merge logic (same format, cross-format, overlapping)
```

**Test for granularity**: Each checkbox must pass this test — can you verify it is done without completing anything else on the list? If the answer is no, the item is too coarse.

**Acceptance Criteria**: All user stories in `prd.md` (or the condensed PRD section of a single-file plan's `README.md`) must include testable acceptance criteria using Gherkin format. See [Acceptance Criteria Convention](../../development/infra/acceptance-criteria.md) for complete details.

### Important Note on File Naming

Files inside plan folders use descriptive kebab-case names or short industry-standard acronyms (e.g., `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`). The folder structure provides sufficient context, so the filename only needs to describe its purpose.

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

## Working with Plans

### Creating Plans

1. **Start with an idea**: Capture quick idea in `ideas.md` (1-3 lines)
2. **Formalize when ready**: Create plan folder in `backlog/` when idea is mature
3. **Follow naming convention**: Use `YYYY-MM-DD__[project-identifier]/` format
4. **Choose structure**: Single-file (≤1000 lines) or multi-file (>1000 lines)
5. **Create content**: Write overview, requirements, tech docs, and delivery sections
6. **Update index**: Add plan to `backlog/README.md`

### Starting Work

1. **Move folder**: Move plan folder from `backlog/` to `in-progress/`
2. **Update index**: Update both `backlog/README.md` and `in-progress/README.md`
3. **Git commit**: Commit the move with appropriate message
4. **Begin execution**: Start implementing according to delivery checklist

### Completing Work

1. **Verify completion**: Ensure all deliverables and acceptance criteria met
2. **Update date**: Optionally update folder name date to completion date
3. **Move folder**: Move plan folder from `in-progress/` to `done/`
4. **Update index**: Update both `in-progress/README.md` and `done/README.md`
5. **Git commit**: Commit the move with completion message
6. **Archive**: Plan is now archived for historical reference

### Plan Index Files

Each subfolder (`backlog/`, `in-progress/`, `done/`) has a `README.md` that:

- Lists all plans in that category
- Provides brief description of each plan
- Links to each plan folder
- Updated whenever plans are added, moved, or removed

## Diagrams in Plans

Files in `plans/` folder should use **Mermaid diagrams** as the primary format (same as all markdown files in the repository).

**Diagram Standards**:

- **Primary Format**: Mermaid diagrams for all flowcharts, architecture diagrams, sequences
- **ASCII Art**: Optional, only for simple directory trees or rare edge cases
- **Orientation**: Prefer vertical (top-down or bottom-top) for mobile-friendly viewing
- **Colors**: Use color-blind friendly palette from [Color Accessibility Convention](../formatting/color-accessibility.md)

**Why Mermaid**:

- Renders properly in GitHub and most markdown viewers
- Version-controllable (text-based)
- Easy to update and maintain
- Supports multiple diagram types (flowchart, sequence, class, ER, etc.)

For complete diagram standards, see [Diagram and Schema Convention](../formatting/diagrams.md).

## Relative Link Paths in Plan Files

Plan files sit three directory levels deep from the repository root: `plans/` → `in-progress/` (or `backlog/` or `done/`) → `YYYY-MM-DD__identifier/`. Any markdown file inside a plan folder must use `../../../` to reach root-level directories such as `governance/`, `docs/`, `apps/`, or `libs/`.

### Correct Path Depth

| Target from a plan file                     | Correct prefix |
| ------------------------------------------- | -------------- |
| `governance/conventions/structure/plans.md` | `../../../`    |
| `docs/how-to/organize-work.md`              | `../../../`    |
| `apps/a-demo-be-golang-gin/README.md`       | `../../../`    |
| Sibling file in the same plan folder        | `./`           |

### Example

A plan at `plans/in-progress/2026-03-27__my-feature/README.md` links to the AI Agents Convention:

```markdown
<!-- PASS: Three levels up to reach repo root, then down into governance/ -->

[AI Agents Convention](../../../governance/development/agents/ai-agents.md)
```

```markdown
<!-- FAIL: Only two levels up — resolves to plans/governance/ (does not exist) -->

[AI Agents Convention](../../governance/development/agents/ai-agents.md)
```

### Why Three Levels

The plan subfolder adds a third level of nesting that `docs/` files at two levels deep (e.g., `governance/conventions/structure/plans.md`) do not have. Forgetting this extra level produces a path that points into the `plans/` directory tree instead of the repository root.

Use the verification tip from the [Linking Convention](../formatting/linking.md#verification-tip): start at the plan file's location, count each `../` as one directory up, and confirm you reach the repo root before descending into the target directory.

## Related Documentation

**Decision Guides**:

- [How to Organize Your Work](../../../docs/how-to/organize-work.md) - Decision guide for choosing between plans/ and docs/

**Related Conventions**:

- [Acceptance Criteria Convention](../../development/infra/acceptance-criteria.md) - Writing testable acceptance criteria using Gherkin format
- [Diátaxis Framework](./diataxis-framework.md) - Organization of `docs/` directory
- [File Naming Convention](./file-naming.md) - Naming files within `docs/` (not applicable to plans/)
- [Diagram and Schema Convention](../formatting/diagrams.md) - Standards for Mermaid diagrams

**Development Guides**:

- [AI Agents Convention](../../development/agents/ai-agents.md) - Standards for AI agents (including `plan-maker`, `plan-checker`, `plan-fixer`, `plan-execution-checker`)

## Best Practices

### Keep Plans Focused

- One plan per project or major feature
- Break large initiatives into multiple plans
- Each plan should have clear, achievable scope

### Update Plans as You Go

- Plans are living documents during execution
- Update technical docs when making design decisions
- Check off deliverables as completed
- Add notes about challenges or learnings

### Use Ideas File Liberally

- Capture ideas quickly without overthinking
- Don't worry about perfect wording
- Review ideas periodically and promote mature ones to plans
- Archive or delete ideas that are no longer relevant

### Maintain Indices

- Always update subfolder README.md when moving plans
- Keep descriptions current and accurate
- Remove completed plans from in-progress index promptly

### Archive Completed Plans

- Don't delete completed plans - move them to `done/`
- Completed plans serve as historical record
- Review past plans to learn from successes and challenges
- Use completed plans as templates for similar future work

## Examples

### Example: Small Plan (Single-File)

```
2025-12-05__add-user-search/
└── README.md                # ~400 lines total
```

**README.md structure**:

```markdown
# Add User Search Feature

## Context

Brief description and background...

## Scope

In-scope features, out-of-scope items, affected apps...

## Business Rationale (condensed BRD)

Why this matters, affected roles, success metrics (observable facts preferred; judgment calls labeled)...

## Product Requirements (condensed PRD)

User stories (As a … I want … So that …), Gherkin acceptance criteria, product scope...

## Technical Approach

API design, database changes, implementation notes...

## Delivery Checklist

Phased `- [ ]` items, one action per checkbox...

## Quality Gates

`nx affected -t typecheck lint test:quick spec-coverage`, markdown lint, manual verification...

## Verification

How to confirm done...
```

### Example: Large Plan (Multi-File)

```
2025-12-05__migrate-to-microservices/
├── README.md                # ~100 lines (overview + navigation)
├── brd.md                   # ~150 lines (business goal, impact, affected roles, success metrics)
├── prd.md                   # ~250 lines (personas, user stories, Gherkin acceptance criteria, product scope)
├── tech-docs.md             # ~800 lines (architecture + API specs + file impact analysis)
└── delivery.md              # ~200 lines (phased rollout plan)
```

### Example: Ideas File

```markdown
# Ideas

Quick ideas and todos that haven't been formalized into plans yet.

## Authentication & Security

- Add OAuth2 support for Google and GitHub
- Implement API rate limiting
- Add 2FA support for admin accounts

## Performance

- Optimize database queries with proper indexing
- Add Redis caching layer
- Implement CDN for static assets

## User Experience

- Add dark mode toggle
- Implement keyboard shortcuts
- Add progressive web app support
```

---

**Last Updated**: 2026-04-18
