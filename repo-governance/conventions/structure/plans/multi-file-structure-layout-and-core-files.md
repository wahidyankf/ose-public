---
description: Shows the fixed core, one reader-led technical shape, and the purpose of the core formal-plan documents.
when_to_use: Use when scaffolding a multi-file plan folder or clarifying what belongs in README.md, brd.md, or prd.md.
---

# Mature Formal-Plan Structure

```
<plan-identifier>/
├── README.md                # Plan overview and navigation
├── brd.md                   # Business Requirements Document
├── prd.md                   # Product Requirements Document
├── tech-docs.md             # Technical documentation and architecture (one allowed form)
├── delivery.md              # Step-by-step delivery checklist
├── learnings.md             # Transient running log of generalizable learnings
└── evidence/                # (optional) committed testing evidence — screenshots, API wire results
    ├── phase-1-homepage-en-1280px.png
    └── phase-2-api-health.txt
```

Replace `tech-docs.md` with `tech-docs/README.md` plus mapped companion documents when distinct
reader jobs, cohesive technical subjects, or ownership boundaries justify the split. Never keep
both forms. Numeric line counts do not decide the shape.

**File purposes**:

- **README.md**: High-level overview and navigation — Context, Scope (with affected subrepos / apps named explicitly), Approach Summary, and links to every core file and technical companion. First file a reader opens; first file checkers parse for scope.
- **brd.md** — **Business Requirements Document**: business goal and rationale ("why are we doing this"), business impact, affected roles, business-level success metrics, business-scope Non-Goals, business risks and mitigations. Content-placement container, not a sign-off artifact — code review is the only approval gate in this repo.
- **prd.md** — **Product Requirements Document**: product overview, personas, user stories (`As a … I want … So that …`), acceptance criteria in Gherkin, product scope (in-scope + out-of-scope features), product-level risks. **For UI-bearing plans** (those that add or change user-facing screens or components under `apps/` or `libs/`), `prd.md` additionally contains the complete **UI-design-funnel record**: the inline low-fidelity ASCII wireframes (Diverge stage, ≥ 2 named alternatives, at least mobile + desktop where they differ), the high-fidelity mockup embeds via `![]()` image links referencing the plan's `assets/` folder (Narrow stage finalists), the named selection (Select stage), and the rationale table (Justify stage). **For learning-bearing plans** (those whose delivery checklist authors or restructures course, tutorial, or curriculum content), the selected technical form additionally requires a `## Corpus Disposition` declaration and the plan's `syllabus/` folder record; in directory form, `tech-docs/README.md` maps the owning companion. See the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md) and [UI Mockups in Plan Docs — Placement](../../formatting/diagrams/ui-mockups-placement-hard-rule-requirements.md#placement--the-ui-lives-in-prdmd-hard-rule-requirements-and-enforcement).

See [Multi-File Structure — Additional File Purposes](./multi-file-structure-additional-file-purposes.md) for `tech-docs.md`, `delivery.md`, `learnings.md`, and `evidence/`.
