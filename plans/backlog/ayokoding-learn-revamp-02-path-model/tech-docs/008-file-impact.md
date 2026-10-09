# 008 — File Impact

Paths are relative to the repository root. Markers: `[E]` edited, `[N]` new, `[D]` deleted,
`[G]` generated or recorded evidence (written by running a command or recording a result, never by
hand-editing product code).

```text
apps/
├── ayokoding-www/
│   ├── content/en/learn/
│   │   ├── courses/
│   │   │   └── <105 course folders>/_index.md                  [E] frontmatter only: 62 gain `status: outline`, 43 get revised `prerequisites` (no overlap)
│   │   └── paths/
│   │       ├── _index.md                                       [E] description (drops "manifest ships"); 1 of the 8 edited path pages
│   │       ├── careers/
│   │       │   ├── interview-ready/_index.md                   [E] description
│   │       │   ├── interview-ready/software-engineer/_index.md [E] description + body (removes "Phase 1 prioritizes …")
│   │       │   ├── immediately-effective/_index.md             [E] description
│   │       │   ├── immediately-effective/software-engineer/_index.md [E] description + body
│   │       │   ├── immediately-effective/ai-engineer/_index.md [E] description + body ("for developers who already code")
│   │       │   ├── fundamentally-strong/_index.md              [E] description
│   │       │   └── fundamentally-strong/software-engineer/_index.md [E] description + body
│   │       └── skills/**                                       (unchanged; plans 06 and 07)
│   ├── src/
│   │   ├── app/[locale]/(content)/[...slug]/page.tsx           [E] careers hub strapline only
│   │   └── features/
│   │       ├── content/
│   │       │   ├── core/schemas.ts                             [E] frontmatter `status: z.enum(["outline"]).optional()`
│   │       │   ├── core/types.ts                               [E] `ContentMeta.status?: "outline"`
│   │       │   └── shell/repository-fs.ts                      [E] maps `status` into `ContentMeta`
│   │       ├── i18n/core/translations.ts                       [E] new `paths*` keys, en + id
│   │       └── course-paths/
│   │           ├── core/
│   │           │   ├── schemas.ts                              [E] phases, goals, assumes, `restructurePendingIn`; derived courseOrder; expand then contract
│   │           │   ├── manifest.ts                             [E] exports `PathPhase`, file vs domain types
│   │           │   ├── manifest-integrity.ts                   [E] `checkPathModelIntegrity`, `isCleanPathModel` (R1–R9)
│   │           │   ├── path-core.ts                            [N] `computeCore`
│   │           │   ├── path-phases.ts                          [N] `corePhases`, `extensionPhases`, `phaseOfCourse`
│   │           │   ├── skills-restructure-allowlist.ts         [N] closed allowlist, `isMarkedShape`, `isPendingSkillsRestructure`, `checkMarkerUsage` (plan 07 deletes it)
│   │           │   ├── path-nav.ts                             [E] only if a type import changes; behaviour unchanged
│   │           │   └── prerequisites.ts                        [E] only if a type import changes; behaviour unchanged
│   │           ├── manifests/
│   │           │   ├── README.md                               [E] documents the phases shape; fixes `.yaml` → `.json`
│   │           │   ├── careers/interview-ready/software-engineer.json         [E]
│   │           │   ├── careers/immediately-effective/software-engineer.json   [E]
│   │           │   ├── careers/immediately-effective/ai-engineer.json         [E]
│   │           │   ├── careers/fundamentally-strong/software-engineer.json    [E]
│   │           │   └── skills/{conventional-accounting,sharia-accounting,conventional-erp,sharia-erp}.json [E] mechanical shape + marker
│   │           └── shell/
│   │               ├── course-library.ts                       [E] `outlineCourseIds`
│   │               ├── route-path-data.ts                      [E] passes `outlineCourseIds`
│   │               ├── course-path-nav.ts                      [E] `outlineCourseIds` in `CoursePathData`/`CoursePathClientData`
│   │               ├── manifest-repository.ts                  [E] parses the new file shape
│   │               ├── path-landing.tsx                        [E] phases, outcomes, extension heading, "Before you start"; flat branch for marked manifests
│   │               ├── path-rail.tsx                           [E] phase groups, Outline badge; flat branch for marked manifests
│   │               ├── phase-section.tsx                       [N]
│   │               ├── phase-group.tsx                         [N]
│   │               ├── assumed-courses.tsx                     [N]
│   │               ├── outline-badge.tsx                       [N]
│   │               ├── syllabus-preview.tsx                    [E] first phase instead of first three courses
│   │               └── arc-landing.tsx                         [E] passes the first phase
│   └── tests/unit/
│       ├── features/content/core/schemas.test.ts               [E]
│       ├── features/content/shell/repository-fs.unit.test.ts   [E] `status` mapped into `ContentMeta`
│       ├── features/content/course-frontmatter.unit.test.ts    [N] parse all courses; under-1,000-words guard
│       ├── features/course-paths/
│       │   ├── manifest-fixture.ts                             [N] shared synthetic-manifest builder
│       │   ├── core/schemas.test.ts                            [E]
│       │   ├── core/manifest-integrity.test.ts                 [E]
│       │   ├── core/path-nav.test.ts                           [E]
│       │   ├── core/path-core.test.ts                          [N]
│       │   ├── core/path-phases.test.ts                        [N]
│       │   ├── core/skills-restructure-allowlist.test.ts       [N]
│       │   ├── content/path-copy.unit.test.ts                  [N]
│       │   ├── manifests/legacy-membership.ts                  [N] frozen pre-change course sets
│       │   ├── manifests/manifest-membership.unit.test.ts      [N]
│       │   ├── manifests/legacy-skills-order.ts                [N] frozen pre-change skills order
│       │   ├── manifests/skills-order.unit.test.ts             [N]
│       │   ├── manifests/path-model-integrity.unit.test.ts     [N]
│       │   ├── manifests/careers/*.unit.test.ts                [E] read phases
│       │   ├── manifests/skills/*.unit.test.ts                 [E] read phases
│       │   ├── shell/*.test.tsx, shell/*.test.ts               [E] fixtures via `manifestFixture`; new UI assertions
│       │   ├── shell/phase-section.test.tsx                    [N]
│       │   ├── shell/phase-group.test.tsx                      [N]
│       │   ├── shell/assumed-courses.test.tsx                  [N]
│       │   └── shell/outline-badge.test.tsx                    [N]
│       └── fe-steps/
│           ├── path-phases.steps.tsx                           [N]
│           ├── outline-course-status.steps.tsx                 [N]
│           ├── path-assumes.steps.tsx                          [N]
│           ├── core-closure.steps.ts                           [N]
│           ├── path-copy.steps.ts                              [N]
│           └── <steps for the 5 modified features>             [E] wording and fixtures
└── ayokoding-www-fe-e2e/
    ├── fixtures/manifests/
    │   ├── README.md                                           [E] new shape
    │   ├── careers/interview-ready/backend-track.json          [E]
    │   ├── careers/immediately-effective/backend-track.json    [E]
    │   ├── careers/immediately-effective/frontend-track.json   [E]
    │   ├── careers/fundamentally-strong/generalist-track.json  [E] closure-clean, with an extension phase
    │   └── skills/{e2e-fixture-alpha,e2e-fixture-beta}.json    [E]
    └── tests/e2e/steps/course-paths.steps.ts                   [E] new bindings
specs/apps/ayokoding/www/behaviours/frontend/course-paths/
├── README.md                                                   [E] index of the five new features
├── path-phases.feature                                         [N]
├── outline-course-status.feature                               [N]
├── path-assumes.feature                                        [N]
├── core-closure.feature                                        [N]
├── path-copy.feature                                           [N]
└── <5 modified features>                                       [E] see prd.md "Modified features"
.agents/skills/apps-ayokoding-www-developing-content/
├── SKILL.md                                                    [E] links the new rule module
└── reference/
    ├── README.md                                               [E] index entry
    └── course-status-and-path-model.md                         [N] rules PM1–PM3 (Phase 7; home confirmed at placement)
<generated harness routes for the skill>                        [G] `./rhino harness adapters generate`
repo-governance/conventions/structure/learning-plan-syllabus/learning-bearing-trigger.md [E] one example: `courseOrder` → `phases`
plans/
├── backlog/README.md, in-progress/README.md, done/README.md    [E] promotion and archival index rows
└── in-progress/ayokoding-learn-revamp-02-path-model/           (moves to plans/done/<completion-date>__… at archival)
    ├── delivery.md                                             [E] checkboxes, decision record, worktree identity
    ├── learnings.md                                            [E]
    └── evidence/                                               [G] phase evidence files and screenshots
```

## Skills Paths (Decision 39)

The four skills manifests change only in shape: one `all-courses` phase holding today's order, an
empty `assumes`, and the `restructurePendingIn` marker. Their path pages, the skills category landing,
`category-landing.tsx`, `ramp-milestone-strip.tsx`, and `path-card.tsx` do not change. In total this
plan edits 8 path pages: the hub `paths/_index.md`, 3 career arc pages, and 4 career path pages.

## Not Changed

- `content/id/**` (series decision 35).
- `apps/ayokoding-www/next-env.d.ts` — the dev server may rewrite it; never commit that change.
- Behaviour-coverage configuration: the new features follow the existing exemption-comment pattern,
  so no coverage config edits are expected. If a coverage target rejects the pattern, fix the binding,
  not the config.
- The E2E fixture path pages `skills/e2e-fixture-alpha/_index.md` and `skills/e2e-fixture-beta/_index.md`.
- `apps/ayokoding-cli/` (plan 05 owns it).
- Every page under `apps/ayokoding-www/content/en/learn/paths/skills/**`, `category-landing.tsx`,
  `ramp-milestone-strip.tsx`, `path-card.tsx`, and their tests (plans 06 and 07).

The unit-test tree above names files at their current locations. If plan 01 has moved any of them,
follow plan 01's location and record the move in the phase notes.
