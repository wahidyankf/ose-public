# Phase 0 — Contract Check

Every contract this plan consumes from plans 02 and 03, re-searched on the synced execution branch
(`origin/main` @ `1c848ae0e`) with `rtk git grep`. Acceptance: every row is `present` or
`renamed (<new name>)`.

| From | Contract                                                                                    | Merged name and location                                                                           | Status  |
| ---- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------- |
| 02   | `PathManifest.phases[]` (`id`, `title`, `kind`, `outcome.can/cannotYet`, `courses`)         | `apps/ayokoding-www/src/features/course-paths/core/schemas.ts` (`PathPhase`)                       | present |
| 02   | `PathManifest.goals`, `assumes`, derived `courseOrder`                                      | `core/schemas.ts`, `shell/course-path-nav.ts#manifestCourseOrder`                                  | present |
| 02   | `PathManifest.restructurePendingIn`, `isPendingSkillsRestructure(manifest)`                 | `core/skills-restructure-allowlist.ts#isPendingSkillsRestructure` (reads `restructurePendingIn`)   | present |
| 02   | `core/path-phases.ts`: `corePhases`, `extensionPhases`, `phaseOfCourse`                     | `apps/ayokoding-www/src/features/course-paths/core/path-phases.ts`                                 | present |
| 02   | `ContentMeta.status` (`"outline"`), `CoursePathClientData.outlineCourseIds`, `OutlineBadge` | `shell/outline-badge.tsx`; `outlineCourseIds` on the client data (`app/[locale]/.../page.tsx:303`) | present |
| 02   | `AssumedCourses`, `PhaseSection`, `PhaseGroup`                                              | `shell/assumed-courses.tsx`, `shell/phase-section.tsx`, `shell/phase-group.tsx`                    | present |
| 03   | `ContentMeta.description`, `category`, `format`, `estimatedHours`; `CourseFormat`           | `features/content/...` frontmatter + `shell/course-meta-row.tsx`                                   | present |
| 03   | `resolveCourseStartSlug(courseNode, isRealPage)`                                            | `apps/ayokoding-www/src/features/content/core/course-start.ts#resolveCourseStartSlug`              | present |
| 03   | `CourseHeader` with `progress?` and `primaryAction?`; `CourseHeaderData.startSlug`          | `shell/course-header.tsx` (props `progress`, `primaryAction`), `shell/course-header-data.ts`       | present |
| 03   | `courseRootIdFromSlug`, `COURSE_CATALOG_SLUG`, `CourseMetaRow`, `fill`/`tf`                 | `shell/course-path-nav.ts`, `features/i18n/core/fill.ts`                                           | present |
| 01   | `PathPositionNumber`; Learn bucket weights Paths 101, Courses 102, Legacy 103               | `shell/path-position-number.tsx`                                                                   | present |

**Merged `PathManifest` field names** (recorded for later phases): `phases` (`PathPhase[]` with
`id`/`title`/`kind` (`"core"`/`"extension"`)/`outcome`/`courses`), `kind`, `outcome`, `goals`,
`assumes`, derived `courseOrder`, `restructurePendingIn`.

**`isPendingSkillsRestructure` allowlist** (the closed list): its predicate is
`manifest.restructurePendingIn !== undefined`. `SKILLS_RESTRUCTURE_ALLOWLIST` accepts exactly
`skills/conventional-accounting` (plan-06), `skills/sharia-accounting` (plan-06),
`skills/conventional-erp` (plan-07), `skills/sharia-erp` (plan-07).

**`CourseHeader` props** confirmed: `progress?: ReactNode` and `primaryAction?: ReactNode` exist;
`CourseHeaderData` carries `startSlug`; `estimatedHours`/`format` are optional for outline courses.

**Result:** no `missing` row. No rename needed.
