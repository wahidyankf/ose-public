# 009 — Rule and Docs Impact

This plan changes rules in one repository: `ose-public` (this repository). No other OSE repository is
affected: the catalog, the metadata, and the gate adapter for AyoKoding live only here. The private
sibling repository is independent and is not consulted or notified.

## Rules this plan adds or changes

Each rule is stated so a reviewer can see when it is followed and when it is broken.

| ID  | Rule (falsifiable)                                                                                                                                                                                                                                             | Canonical home                                                                                                                              | Enforcement disposition                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Every course `_index.md` under `apps/ayokoding-www/content/en/learn/courses/<slug>/` declares `category` (a known id) and `description` (one sentence, 20–120 characters); every course without `status: outline` also declares `format` and `estimatedHours`. | `.agents/skills/apps-ayokoding-www-developing-content/reference/course-metadata.md` (new), linked from the adapter's "Front matter" bullet. | **Covered**: the scenario "Every course in the library carries valid metadata" fails `ayokoding-www:test:unit` (pre-push and PR CI). |
| R2  | A course's `estimatedHours` equals `estimateCourseHours` for its current files.                                                                                                                                                                                | Same reference file; the formula's code home is `src/features/content/core/course-effort.ts`.                                               | **Covered**: the same scenario prints the expected value on drift.                                                                   |
| R3  | A course's tutorial mode is read from its `format` field: `annotated-concept-no-code` selects the no-code sub-mode; `annotated-concept` selects standard mode.                                                                                                 | `repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md` ("Annotated Concept" → Mode).                           | **Gated**: the Tutorial Annotated Concept Quality Gate applies it when judging a course; the enum itself is covered by R1.           |
| R4  | `content/en/learn/courses/_index.md` keeps a frontmatter-only body; the catalog page renders from course metadata. All other `_index.md` bodies still come from `generate-indexes.ts`.                                                                         | `repo-governance/development/quality/gate-adapters/ayokoding-www.md` ("Generated indexes" bullet).                                          | **Covered**: the new `index-generation.feature` scenario (Unit and Integration) and `ayokoding-www:validate-indexes`.                |

### Supersessions and conflicts

- `tutorial-kinds.md` today says "A topic's format designation declares its mode" without naming
  where the designation lives. R3 makes it concrete; it narrows, not contradicts, the existing rule.
- The two `apps-ayokoding-www-authoring-annotated-concept` reference files say to read "the topic's
  format designation (the content plan or syllabus states this explicitly ...)". They change to "the
  course `_index.md` `format` field; for a new course, the content plan states it". The adapter is
  the higher layer; the skill is amended to agree.
- `ayokoding-www.md` says "`_index.md` files come from `generate-indexes.ts`, never from hand edits".
  R4 keeps that true (the generator still owns the file) and adds that course frontmatter metadata
  is hand-authored and preserved by the generator. No conflict.
- No instruction file (`AGENTS.md`, `CLAUDE.md`) changes: these rules bind only AyoKoding content
  work, so the narrowest surfaces are the adapter and the skill.

## Generated harness routes

The skill edits change reference files and `SKILL.md` bodies under `.agents/skills/`. The generated
route `.claude/skills/<skill>/SKILL.md` contains only each skill's `name` and `description`, which do
not change. The delivery still runs:

```bash
rtk ./hippo run --class transactional --resource-tier light --disk-path . -- ./rhino harness adapters generate
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate
```

and records whether any generated file changed (expected: none).

## Docs Propagation

These pages describe what this plan changes and are updated in the same commit as the change:

| File                                                                  | Update                                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/README.md`                                        | One paragraph: course metadata fields, the catalog at `/en/learn/courses`, and the drift guard. |
| `specs/apps/ayokoding/www/behaviours/frontend/course-paths/README.md` | Index `course-catalog.feature` and `course-landing-header.feature`.                             |
| `specs/apps/ayokoding/www/behaviours/frontend/navigation/README.md`   | Index `sidebar-course-categories.feature`.                                                      |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`       | Index `course-metadata.feature`.                                                                |

## C4 Reconciliation

`specs/apps/ayokoding/www/architecture.md` describes one container and six bounded contexts. This
plan adds no actor, container, or bounded context, and no store. The one textual change: the
`content` row's responsibility gains "course metadata validation" (it already lists Markdown
parsing and `content.getBySlug`). The `navigation` row ("sidebar tree") already covers grouping.
Note for the executor: the components table does not list the existing `course-paths` context; that
gap predates this plan and is not fixed here (out of scope; record it in `learnings.md`).
