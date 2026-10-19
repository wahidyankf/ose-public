# Paths Index — Legacy Unique Migration

**Custodian**: ayokoding-learn-revamp-10-legacy-unique-migration

This plan changes **no path manifest** ([tech-docs/008 D7](../../tech-docs/009-decision-records.md#decision-d7-no-new-course-is-assigned-to-any-career-or-skills-path-manifest)).
This page records where the 48 new courses sit, so the executor can see at a glance that nothing a path or
the catalog stores depends on a change here, and it records the prerequisite edges inside this plan's own
courses so they can be checked against plan 02's integrity rules.

## Where the 48 Courses Sit

No career or skills path holds any of the 48 courses. Every one of the 48 course briefs states "None" in its
"In which paths" section with a reason (plan 02 closure rule R4 binds only courses that are already path
members, per [tech-docs/004](../../tech-docs/004-catalog-metadata-and-path-membership.md)). A finished course
therefore changes no core path and no extension phase; the courses are discoverable only via the catalog's
category grouping until a later plan (or a path's own maintainer) assigns them. In Phase 0 the executor
re-reads the merged manifests under `apps/ayokoding-www/content/en/learn/` and confirms none of the 48 slugs
appears in any of them. The Phase 0 search is, run from the repository root:

```bash
grep -rln -E "clojure-essentials|web-backends-in-clojure-with-pedestal|database-migrations-with-clojure-and-migratus" apps/ayokoding-www/content apps/ayokoding-www/src apps/ayokoding-www/tests specs/apps/ayokoding
```

repeated for the remaining 45 slugs from
[syllabus/courses/README.md](../courses/README.md#dependency-note).

The expected hits outside the 48 course folders are only pages that name one of the 48 as a prerequisite or
in a link, if any exist yet. All of these depend on a **slug and a URL**, which do not change. A hit anywhere
else is recorded in the ledger and read before the course is touched. The search is repeated at the end of the
plan.

## Prerequisite Edges Inside This Plan

| Added edge                                                             | Why                                                                                                                                                                               | Order check                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `clojure-essentials` + `web-backends-in-clojure-with-pedestal`         | Clojure has no `just-enough-clojure` primer in the existing catalog (`lisp` covers only Scheme plus a short look at Clojure); this plan's own `clojure-essentials` fills that gap | `clojure-essentials` is Wave 5, the dependent Wave 14 |
| `clojure-essentials` + `database-migrations-with-clojure-and-migratus` | The same                                                                                                                                                                          | `clojure-essentials` is Wave 5, the dependent Wave 11 |

No other cross-course dependency exists inside this plan's 48 courses; every other course's prerequisites are
plans 01 to 09 courses, already filled before this plan starts (series decision 42). In particular
`golang-in-depth` and `elixir-in-depth` carry no path-level prerequisite chain to the migration or backend
courses that use those languages.

## Observed in the Merged Manifests

The executor fills this table in Phase 0. A difference from the statements above is recorded; it does not change the
plan unless an edge fails the integrity rules.

| Course                    | Phase found | Paths that hold it | Difference from the statement above |
| ------------------------- | ----------- | ------------------ | ----------------------------------- |
| (to be filled in Phase 0) |             |                    |                                     |
