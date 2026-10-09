# Paths Index — Filler Course Rewrites

**Custodian**: ayokoding-learn-revamp-09-filler-rewrites

This plan changes **no path manifest** ([tech-docs/008 D8](../../tech-docs/008-decision-records.md#d8--no-manifest-change)).
This page records where the eight rewritten courses sit, so the executor can see at a glance that nothing a path or
the catalog stores depends on a change here, and it records the prerequisite edges the plan adds so they can be
checked against plan 02's integrity rules.

The source is plan 02's drafted software-engineer manifests
(`manifest-careers-fundamentally-strong-software-engineer.md`,
`manifest-careers-immediately-effective-software-engineer.md`, and
`manifest-careers-interview-ready-software-engineer.md`), read on 2026-10-09 in their draft form.
`custodied-by:ayokoding-learn-revamp-02-path-model`. They are named, not linked, because plan 02 is archived before
this plan runs. In Phase 0 the executor re-reads the merged manifests under
`apps/ayokoding-www/content/en/learn/` and updates the table below with what it finds.

## Where the Eight Courses Sit

All three career paths hold the courses in extension phases. No course is in a core phase, so a finished course
changes no core path.

| Course                                    | Phase                                  | `fundamentally-strong` | `immediately-effective` | `interview-ready` |
| ----------------------------------------- | -------------------------------------- | ---------------------- | ----------------------- | ----------------- |
| `build-your-own-git`                      | `systems-and-tooling`                  | yes                    | yes                     | yes               |
| `compilers-parsers-and-transpilers`       | `more-computer-science`                | yes                    | yes                     | yes               |
| `type-systems`                            | `more-computer-science`                | yes                    | yes                     | yes               |
| `just-enough-fsharp`                      | `more-computer-science`                | yes                    | yes                     | yes               |
| `lisp`                                    | `more-computer-science`                | yes                    | no                      | no                |
| `enterprise-java-and-the-jvm`             | `architecture-and-distributed-systems` | yes                    | yes                     | yes               |
| `defensive-security`                      | `security`                             | yes                    | yes                     | yes               |
| `vulnerability-management-and-assessment` | `security`                             | yes                    | yes                     | yes               |

Within `more-computer-science` the draft order puts `just-enough-fsharp` before `type-systems` before
`compilers-parsers-and-transpilers`, which matches the prerequisite edges. The `security` phase puts
`defensive-security` before `vulnerability-management-and-assessment`.

No other path lists any of the eight courses. On 2026-10-09 the three manifests are the JSON files
`apps/ayokoding-www/src/features/course-paths/manifests/careers/<career>/software-engineer.json`; plan 02 may
move them, so Phase 0 finds the merged location first. The Phase 0 search is, run from the repository root:

```bash
grep -rln -E "build-your-own-git|compilers-parsers-and-transpilers|type-systems|just-enough-fsharp|enterprise-java-and-the-jvm|defensive-security|vulnerability-management-and-assessment|lisp" apps/ayokoding-www/content apps/ayokoding-www/src apps/ayokoding-www/tests specs/apps/ayokoding
```

The expected hits outside the eight course folders are:

- the three manifests;
- the course pages that name one of the eight as a prerequisite or in a link (on 2026-10-09:
  `detection-engineering-and-siem-operations` and `it-governance-grc` both list `defensive-security` as a
  prerequisite, and `it-and-application-security`, `offensive-security`, and the course index pages link to the
  courses);
- plan 08's capstone pages;
- the legacy `information-security` tracks' "Superseded by" lines;
- the redirect test `tests/unit/fe-steps/course-rehome-redirects.steps.tsx`, which names the slugs and reads no
  content.

All of these depend on a **slug and a URL**, which do not change. A page that states what one of the eight
courses teaches (for example, an overview of `detection-engineering-and-siem-operations` that says what it assumes
from `defensive-security`) is read by the executor, and if the finished course no longer teaches it, the
passage is edited in the same PR and the edit is recorded. A hit anywhere else is recorded in the ledger and read
before the course is touched. The search is repeated at the end of the plan.

## Prerequisite Edges This Plan Adds

| Added edge                                                       | Why                                     | Order check in the three manifests                                                            |
| ---------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `type-systems` + `just-enough-rust`                              | Rust carries the trait and newtype code | `just-enough-rust` is in `more-languages`, earlier than `more-computer-science`, in all three |
| `defensive-security` + `just-enough-python`                      | The units are Python                    | `just-enough-python` is in an earlier core phase in all three                                 |
| `vulnerability-management-and-assessment` + `just-enough-python` | The units are typed Python              | The same                                                                                      |

The other prerequisite edges of the eight courses already hold in the drafts: `version-control-and-git` is in
`editor-and-shell` before `systems-and-tooling`; `software-architecture` is the first course of
`architecture-and-distributed-systems`; `just-enough-java` is in `more-languages`; `offensive-security`,
`it-and-application-security`, and `just-enough-bash` come before `defensive-security`; and
`security-essentials` is in an earlier phase than `security` in every path.

## Observed in the Merged Manifests

The executor fills this table in Phase 0. A difference from the drafts above is recorded; it does not change the
plan unless an edge fails the integrity rules.

| Course                    | Phase found | Paths that hold it | Difference from the draft |
| ------------------------- | ----------- | ------------------ | ------------------------- |
| (to be filled in Phase 0) |             |                    |                           |

## Plan 08 Dependents

Plan 08 writes capstones whose `learning/overview.md` has a `## What this course relies on` table. On
2026-10-09 three of them name a course from this plan:

| Capstone                                 | Names                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `capstone-secure-service`                | `defensive-security` (detections)                                  |
| `capstone-real-world-delivery`           | `defensive-security`                                               |
| `capstone-build-your-own-pentest-engine` | `defensive-security` and `vulnerability-management-and-assessment` |

The re-read duty is in [tech-docs/005](../../tech-docs/005-security-content-and-accuracy.md#capstone-handoff).
