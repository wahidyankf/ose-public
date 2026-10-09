# 008 — File Impact

## File-Impact Analysis

```text
.
├── apps/ayokoding-www/
│   ├── README.md [E] — mention course metadata, the catalog page, and the drift test
│   ├── content/en/learn/courses/
│   │   ├── _index.md [E] [G] — new frontmatter `description`; body emptied by generate-indexes
│   │   └── <course>/_index.md [E] — bounded family: exactly the 181 course folders listed in
│   │       tech-docs/003; frontmatter only (+category, +description, +format, +estimatedHours)
│   ├── src/
│   │   ├── app/[locale]/(content)/[...slug]/page.tsx [E] — catalog dispatch; course header data
│   │   ├── features/content/core/
│   │   │   ├── schemas.ts [E] — tolerant `category`, `format`, `estimatedHours`
│   │   │   ├── types.ts [E] — `ContentMeta` and `TreeNode` fields
│   │   │   ├── tree-builder.ts [E] — copy `category` onto tree nodes
│   │   │   ├── course-categories.ts [N] — 14 categories, `groupByCourseCategory`
│   │   │   ├── course-metadata.ts [N] — `COURSE_FORMATS`, `courseMetadataSchema`, `checkCourseMetadata`
│   │   │   ├── course-effort.ts [N] — `countPageEffort`, `estimateCourseHours`
│   │   │   └── course-start.ts [N] — `resolveCourseStartSlug`
│   │   ├── features/content/shell/
│   │   │   ├── repository-fs.ts [E] — map the three fields into `ContentMeta`
│   │   │   ├── index-generator.ts [E] — frontmatter-only body for the catalog section
│   │   │   ├── course-effort-scan.ts [N] — `scanCourseEffort` (reads files)
│   │   │   └── course-corpus-check.ts [N] — `checkCourseCorpus` (real-corpus guard)
│   │   ├── features/navigation/
│   │   │   ├── core/schemas.ts [E] — optional `category` in `treeNodeSchema`
│   │   │   └── shell/
│   │   │       ├── sidebar-tree.tsx [E] — route `learn/courses` children to the groups
│   │   │       └── course-category-groups.tsx [N] — disclosure groups (client)
│   │   ├── features/course-paths/
│   │   │   ├── core/course-catalog.ts [N] — `buildCourseCatalog`
│   │   │   └── shell/
│   │   │       ├── course-path-nav.ts [E] — `COURSE_CATALOG_SLUG`, `courseRootIdFromSlug`
│   │   │       ├── course-catalog.tsx [N] — `CourseCatalog`, `CourseCard`, `CategoryJumpLinks`
│   │   │       ├── course-meta-row.tsx [N] — shared meta row (card and header)
│   │   │       ├── course-header-data.ts [N] — `buildCourseHeaderData`
│   │   │       ├── course-header.tsx [N] — `CourseHeader`, `StartCourseButton`, slots
│   │   │       ├── course-page-content.tsx [E] — optional `courseHeader`; contents heading; no bottom repeats
│   │   │       └── course-page-path-content.tsx [E] — forward `courseHeader`
│   │   ├── features/i18n/core/
│   │   │   ├── translations.ts [E] — keys in tech-docs/005 (en and id)
│   │   │   └── fill.ts [N] — `fill`, `tf` moved from ai-benchmark
│   │   └── features/ai-benchmark/shell/format.ts [E] — re-export `fill`, `tf` from i18n core
│   └── tests/
│       ├── unit/fe-steps/
│       │   ├── course-catalog.steps.tsx [N]
│       │   ├── course-landing-header.steps.tsx [N]
│       │   └── sidebar-course-categories.steps.tsx [N]
│       ├── unit/be-steps/
│       │   ├── course-metadata.steps.ts [N] — includes the real-corpus drift guard
│       │   ├── index-generation.steps.ts [E] — new scenario
│       │   ├── navigation-api.steps.ts [E] — new scenario
│       │   └── helpers/test-service.ts [E] — one mock course gains `category`
│       ├── unit/features/content/core/
│       │   ├── course-categories.test.ts [N]
│       │   ├── course-metadata.test.ts [N]
│       │   ├── course-effort.test.ts [N]
│       │   ├── course-start.test.ts [N]
│       │   └── schemas.test.ts [E]
│       ├── unit/features/content/shell/
│       │   ├── course-effort-scan.unit.test.ts [N]
│       │   ├── course-corpus-check.unit.test.ts [N]
│       │   └── repository-fs.unit.test.ts [E]
│       ├── unit/features/course-paths/
│       │   ├── core/course-catalog.test.ts [N]
│       │   └── shell/
│       │       ├── course-catalog.test.tsx [N]
│       │       ├── course-header.test.tsx [N]
│       │       ├── course-header-data.test.ts [N]
│       │       └── course-path-nav.test.ts [E]
│       ├── unit/features/navigation/shell/
│       │   ├── course-category-groups.test.tsx [N]
│       │   └── sidebar-tree.test.tsx [E]
│       ├── unit/features/i18n/core/fill.test.ts [N]
│       └── integration/be-steps/
│           ├── course-metadata.steps.ts [N]
│           ├── index-generation.steps.ts [E]
│           └── navigation-api.steps.ts [E]
├── apps/ayokoding-www-fe-e2e/tests/e2e/steps/
│   ├── course-catalog.steps.ts [N]
│   ├── course-landing-header.steps.ts [N]
│   ├── sidebar-course-categories.steps.ts [N]
│   ├── backend-navigation-api.steps.ts [E] — new scenario
│   └── resizable-sidebar.steps.ts [E] — tall page moves to a course page
├── apps/ayokoding-www-be-e2e/tests/e2e/steps/
│   └── navigation-api.steps.ts [E] — new scenario (this project also binds the backend corpus)
├── specs/apps/ayokoding/www/
│   ├── architecture.md [E] — `content` component row mentions course metadata (C4 reconciliation)
│   └── behaviours/
│       ├── frontend/course-paths/
│       │   ├── course-catalog.feature [N]
│       │   ├── course-landing-header.feature [N]
│       │   └── README.md [E] — index the two features
│       ├── frontend/navigation/
│       │   ├── sidebar-course-categories.feature [N]
│       │   └── README.md [E]
│       ├── backend/content/
│       │   ├── course-metadata.feature [N]
│       │   └── README.md [E]
│       ├── backend/navigation/navigation-api.feature [E] — +1 scenario
│       └── build-tools/index-generation/index-generation.feature [E] — +1 scenario
├── repo-governance/development/quality/gate-adapters/
│   ├── ayokoding-www.md [E] — generated-index and front-matter rules (tech-docs/009)
│   └── ayokoding-www/tutorial-kinds.md [E] — mode comes from the `format` field
├── .agents/skills/
│   ├── apps-ayokoding-www-developing-content/
│   │   ├── reference/course-metadata.md [N] — the course metadata standard
│   │   ├── reference/README.md [E] — index the new reference
│   │   └── SKILL.md [E] — link the new reference
│   └── apps-ayokoding-www-authoring-annotated-concept/reference/
│       ├── when-to-use-and-mode-selection.md [E] — read the `format` field
│       └── workflow-and-quality.md [E] — same
├── .claude/skills/<skill>/SKILL.md [G] — bounded family: the two skills above; regenerated by
│   `./rhino harness adapters generate`; expected unchanged unless a skill description changes
└── plans/
    ├── backlog/ayokoding-learn-revamp-03-catalog-and-metadata/ [E] — moved to in-progress, then done
    ├── in-progress/README.md [E], backlog/README.md [E], done/README.md [E] — plan indexes
    └── <in-progress or done>/ayokoding-learn-revamp-03-catalog-and-metadata/
        ├── delivery.md [E] — checkbox ticks, rule-15 follow-ups
        ├── learnings.md [E]
        └── evidence/ [N] — phase-<N>-*.md and screenshots
```

### More Detail

- **The 181 course `_index.md` files.** The exact members are the directories under
  `apps/ayokoding-www/content/en/learn/courses/` on `origin/main` at Phase 0, which must equal the
  181 slugs in [003](./003-category-taxonomy-and-course-mapping.md). Phase 0 records that list in
  `evidence/phase-0-inventory.md`. Only frontmatter changes; a diff that touches a body line is a
  defect.
- **Course bodies.** No course `learning/`, `drilling/`, `overview.md`, or `code/` file changes.
- **Generated indexes.** `generate-indexes` is run in Phase 4. Only
  `content/en/learn/courses/_index.md` should change; any other `_index.md` in the diff means the
  generator change leaked and must be fixed before commit.
- **Never commit:** the `apps/ayokoding-www/next-env.d.ts` rewrite that `next dev` makes, and
  `.serena/project.yml`. Phase 5 and every commit step check `git status` for both.
- **Plan files** change only at promotion (move to `plans/in-progress/`), while ticking boxes, and at
  archival (move to `plans/done/<completion-date>__ayokoding-learn-revamp-03-catalog-and-metadata/`).
