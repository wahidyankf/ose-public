# 008 — File Impact

Markers: `[N]` new, `[E]` edited, `[D]` deleted. Paths are repository-relative. Phase 0 refreshes this
tree against `origin/main` after plans 02 and 03 merge and records differences in the phase evidence.

```text
apps/ayokoding-www/
├── README.md                                                    [E] "How the app is shaped": learning-progress feature
├── next.config.ts                                               [E] spread learnHomeRedirects
├── content/en/learn/
│   ├── _index.md                                                [E] add description (body stays generated)
│   └── overview.md                                              [D]
├── src/
│   ├── app/[locale]/(content)/[...slug]/page.tsx                [E] skip "learn" in static params; Learn home, lesson, header, roadmap dispatch
│   ├── redirects/learn-home.ts                                  [N]
│   ├── features/learning-progress/
│   │   ├── core/progress-schema.ts                              [N]
│   │   ├── core/progress-state.ts                               [N]
│   │   ├── core/lesson-sequence.ts                              [N]
│   │   ├── core/course-location.ts                              [N]
│   │   ├── core/lesson-path-context.ts                          [N]
│   │   ├── core/progress-derivations.ts                         [N]
│   │   ├── core/next-step.ts                                    [N]
│   │   ├── shell/progress-storage.ts                            [N]
│   │   ├── shell/use-learning-progress.ts                       [N]
│   │   ├── shell/lesson-sequences.ts                            [N] server-only loaders
│   │   ├── shell/progress-meter.tsx                             [N]
│   │   ├── shell/course-status-label.tsx                        [N]
│   │   ├── shell/progress-placeholder.tsx                       [N]
│   │   ├── shell/storage-notice.tsx                             [N]
│   │   ├── shell/lesson-context-provider.tsx                    [N]
│   │   ├── shell/context-bar.tsx                                [N]
│   │   ├── shell/lesson-nav.tsx                                 [N]
│   │   ├── shell/course-progress-summary.tsx                    [N]
│   │   ├── shell/course-progress-action.tsx                     [N]
│   │   ├── shell/continue-learning-card.tsx                     [N]
│   │   ├── shell/reset-progress-control.tsx                     [N]
│   │   └── shell/learn-home.tsx                                 [N]
│   ├── features/course-paths/shell/
│   │   ├── path-roadmap.tsx                                     [N]
│   │   ├── roadmap-progress-card.tsx                            [N]
│   │   ├── roadmap-phase.tsx                                    [N]
│   │   ├── roadmap-course-card.tsx                              [N]
│   │   ├── phase-progress.tsx                                   [N] client part of RoadmapPhase
│   │   ├── course-card-status.tsx                               [N] client part of RoadmapCourseCard
│   │   ├── path-card-progress.tsx                               [N] client part of LearnPathCard
│   │   ├── learn-path-card.tsx                                  [N]
│   │   ├── careers-arc-sections.tsx                             [N]
│   │   ├── path-landing.tsx                                     [E] render PathRoadmap
│   │   ├── path-card.tsx                                        [E] hub sections use LearnPathCard; hero unchanged
│   │   ├── category-landing.tsx                                 [E] careers arc sections; skills cards
│   │   ├── arc-landing.tsx                                      [E] LearnPathCard
│   │   ├── course-page-path-content.tsx                         [E] forward lesson prop
│   │   └── phase-section.tsx (plan 02)                          [D] only if no caller remains after Phase 4
│   ├── features/content/shell/course-page-content.tsx           [E] lesson prop → ContextBar, LessonNav
│   └── features/i18n/core/translations.ts                       [E] keys in 004 (en and id)
└── tests/
    ├── unit/features/learning-progress/*.unit.test.ts           [N] see 006
    ├── unit/features/learning-progress/*.test.tsx               [N] component tests
    ├── unit/features/course-paths/shell/*.test.tsx              [N]/[E] roadmap, cards, landings, route-data shape
    ├── unit/redirects/learn-home.unit.test.ts                   [N]
    ├── unit/fe-steps/{progress-store,lesson-navigation,path-roadmap,learn-home,course-landing-progress,learning-progress-accessibility}.steps.tsx [N]
    ├── unit/fe-steps/{navigation,static-delivery,category-landing…}.steps.tsx [E] U1, U3, U6
    └── integration/fe-steps/static-delivery.steps.ts            [E] U6
apps/ayokoding-www-fe-e2e/
├── fixtures/manifests/careers/fundamentally-strong/generalist-track.json [E] only if needed (006 Fixtures)
├── fixtures/manifests/skills/<allowlisted-id>.json              [N] only if needed (006 Fixtures)
├── fixtures/manifests/README.md                                 [E] fixture purposes
└── tests/e2e/steps/
    ├── {progress-store,lesson-navigation,path-roadmap,learn-home,course-landing-progress,learning-progress-accessibility}.steps.ts [N]
    ├── support/complete-course.ts                               [N] completeCourseThroughUi helper
    └── {content-rendering,resizable-sidebar,common,static-delivery,responsive,course-paths,navigation}.steps.ts [E] U1, U3, U6
specs/apps/ayokoding/www/behaviours/frontend/
├── learning-progress/README.md                                  [N]
├── learning-progress/progress-store.feature                     [N]
├── learning-progress/lesson-navigation.feature                  [N]
├── learning-progress/learn-home.feature                         [N]
├── learning-progress/course-landing-progress.feature            [N]
├── learning-progress/learning-progress-accessibility.feature    [N]
├── course-paths/path-roadmap.feature                            [N]
├── course-paths/category-landing-arc-chooser.feature            [E] U3
├── course-paths/README.md                                       [E] list path-roadmap.feature
├── navigation/navigation.feature                                [E] U1
├── i18n/locale-redirects.feature                                [E] U2
└── README.md (frontend index, if it lists folders)              [E] add learning-progress/
plans/backlog/ayokoding-learn-revamp-04-learning-experience/      [E] status, evidence, learnings during execution
```

## Steps Opening the Removed Overview Page (U6)

Found on 2026-10-09 with a search for `learn/overview`; Phase 0 repeats the search on `origin/main`.

| File                                                                     | Line        | Change                                               |
| ------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/content-rendering.steps.ts`   | 6           | open `/en/learn/courses/backend-essentials/overview` |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/resizable-sidebar.steps.ts`   | 11, 69, 123 | `DOCS_PAGE` and its comments                         |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/common.steps.ts`              | 13          | same replacement                                     |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/static-delivery.steps.ts`     | 5           | `lessonUrl`                                          |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/responsive.steps.ts`          | 48          | same replacement                                     |
| `apps/ayokoding-www/tests/unit/fe-steps/static-delivery.steps.tsx`       | 49–72       | the real-route sample and `lessonUrl`                |
| `apps/ayokoding-www/tests/integration/fe-steps/static-delivery.steps.ts` | 35          | prerender manifest lookup                            |

Unit tests that use `learn/overview` only as a synthetic slug inside mocks (for example
`tests/unit/be-steps/helpers/mock-content.ts`, `reader.unit.test.ts`, `service-getbyslug-cache.unit.test.ts`,
`accessibility.steps.tsx`, `mobile-nav-runtime-path-data.test.tsx`, `course-rehome-redirects.steps.tsx`
line 219) do not read the real file and stay unchanged. If the replacement page lacks a property a step
needs (for example enough sidebar height), the executor picks another stable course page and records
why.

## Rule-Impact Classification

| Surface checked                                           | Finding                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-governance/**`, `AGENTS.md`, `CLAUDE.md`            | No rule names `/en/learn/overview`, the Learn home layout, or browser progress.                                                                                                                                                                                                 |
| `.agents/skills/apps-ayokoding-www-developing-content/**` | `reference/canonical-content-tree-shape.md` requires `overview.md` in topic and track folders. `learn/` is neither, so deleting `learn/overview.md` does not violate it. Its claim that Next.js needs a direct `.md` page is stale (reported as a follow-up, not changed here). |
| `.agents/agents/**`                                       | No agent instruction depends on the Overview page or on progress.                                                                                                                                                                                                               |
| `repo-config.yml`, harness bindings                       | No change.                                                                                                                                                                                                                                                                      |

Result: **no normative rule surface changes**; no binding regeneration is needed. Delivery Phase 9
re-runs these searches on the execution branch and records the result, then runs Docs Propagation for
`apps/ayokoding-www/README.md`, the spec READMEs, and the fixtures README.
