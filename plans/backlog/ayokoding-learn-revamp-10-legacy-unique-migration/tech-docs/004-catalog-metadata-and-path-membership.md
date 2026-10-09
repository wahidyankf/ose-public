# 004 — Catalog, Metadata, and Path Membership

## Metadata (plan 03's schema, restated)

Every new course's `_index.md` frontmatter carries: `category` (one of the 14 `COURSE_CATEGORIES`),
`description` (one sentence, 20 to 120 characters, ends with a period), `format` (`by-example` or
`annotated-concept` for every course in this plan), `estimatedHours` (an integer 1 to 200, taken only
from the drift test's own message, formula
`max(1, round((proseWords/200 + max(inlineCodeLines, codeFileLines)/10)/60))`), and no `status: outline`.
The real-corpus guard `tests/unit/be-steps/course-metadata.steps.ts` (`checkCourseCorpus`) runs over the
finished corpus and must pass for all 229 courses, not only the 48 new ones.

## Category totals after this plan

| Category                               | Before (181 courses) | New courses added | After   |
| -------------------------------------- | -------------------- | ----------------- | ------- |
| `tools-and-practices`                  | 11                   | 2                 | 13      |
| `programming-languages`                | 16                   | 14                | 30      |
| `computer-science`                     | 13                   | 0                 | 13      |
| `application-development`              | 17                   | 13                | 30      |
| `data-and-databases`                   | 11                   | 13                | 24      |
| `systems-and-networking`               | 7                    | 0                 | 7       |
| `architecture-and-distributed-systems` | 8                    | 0                 | 8       |
| `infrastructure-and-operations`        | 9                    | 1                 | 10      |
| `security`                             | 9                    | 0                 | 9       |
| `ai-engineering`                       | 15                   | 4                 | 19      |
| `product-and-leadership`               | 6                    | 0                 | 6       |
| `interview-preparation`                | 5                    | 0                 | 5       |
| `accounting`                           | 24                   | 1                 | 25      |
| `erp-systems`                          | 30                   | 0                 | 30      |
| **Total**                              | **181**              | **48**            | **229** |

Every hard-coded "181" and every hard-coded per-category count in test code (the corpus tests plans 03,
06, 07, 08, and 09 each added or updated) is found by a repository-wide search for the literal counts
above and updated to the new totals in the same commit that adds the 48th course's metadata. This
includes the catalog page's own rendered count and the global sidebar's per-category grouping, both of
which read the real course corpus at build time rather than a separately hard-coded number, so they need
no code change, only the test assertions that pin the expected totals.

## Frozen-membership and path tests

Plan 02's frozen-membership tests (`legacy-membership.ts`, `manifest-membership.unit.test.ts`) assert
that a career or skills path's course set matches a fixed, reviewed list. Because this plan assigns none
of its 48 new courses to any path manifest (decision below), none of those frozen sets changes, and none
of those tests needs an update. This is a deliberate scope boundary, not an oversight: adding 48 courses
to 8 path manifests in the same plan that also writes their content would multiply this plan's review
surface without a stated learner need (none of the 48 subjects is a stated prerequisite or goal of an
existing career or skills path).

## Why no new course joins a path (plan 02 closure rule R4)

Plan 02's closure rule R4 requires a path's core to equal its goal's transitive prerequisite closure; a
course that is not a path member is simply outside that computation; adding a course to zero paths cannot
violate R4 for any existing path, because R4 is checked per path over that path's own declared course set.
A course with zero paths renders in the catalog with "no path chips" — plan 04's existing, already-tested
graceful handling of exactly this case, added for courses in this same situation before this plan existed.

Three of the 48 courses (`clojure-essentials`, `golang-in-depth`, `elixir-in-depth`) are themselves
prerequisites of other new courses in this plan (`web-backends-in-clojure-with-pedestal`,
`database-migrations-with-clojure-and-migratus`; no path-level prerequisite chain exists for golang-in-depth
or elixir-in-depth beyond their own course-level `prerequisites` field, which plan 02's path-closure rule
does not require unless the course is itself a path member). Course-level `prerequisites` are declared and
checked independently of path membership (plan 02's rubric rules T1 to T4 and L1, re-run at each course's
own slice S6), so this is already satisfied without any path edit.

A later plan, or the maintainer who owns a given career or skills path, may add any of these 48 courses to
an extension phase; this plan's own course briefs each state why no path assignment is made here, so that
decision is visible and easy to revisit (see each course's "In which paths" section).
