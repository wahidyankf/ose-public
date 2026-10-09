# Capstone Course Specifications

One file per capstone this plan writes from scratch. Each file is the maker's brief: the course's mode
and the reason for it, targets, project brief, milestones, acceptance criteria, rubric, concepts, the
full list of worked examples (the **floor**), drilling, code and harness notes, accuracy notes, and
the edge changes to the course's `prerequisites`.

## Index

| Course                                                                                | Medium (toolchain)                                                   | Mode                        | Worked examples or scenarios | Words (floor) | Expected hours | Category                               | Wave |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------- | ---------------------------- | ------------- | -------------- | -------------------------------------- | ---- |
| [capstone-build-your-own-coding-agent](./capstone-build-your-own-coding-agent.md)     | Python (`python`, stdlib only)                                       | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 6–10           | `ai-engineering`                       | 1    |
| [capstone-data-pipeline](./capstone-data-pipeline.md)                                 | Python plus PostgreSQL (`python`, `postgres`)                        | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 6–9            | `data-and-databases`                   | 1    |
| [capstone-concurrency-and-systems](./capstone-concurrency-and-systems.md)             | Go (`go`, stdlib only)                                               | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 5–8            | `infrastructure-and-operations`        | 1    |
| [capstone-concurrency-showdown](./capstone-concurrency-showdown.md)                   | Go and Elixir (`go`, `elixir`)                                       | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 5–8            | `programming-languages`                | 1    |
| [capstone-lead-at-altitude](./capstone-lead-at-altitude.md)                           | none                                                                 | Annotated-Concept, no-code  | 24 scenarios (4 themes of 6) | 18,000        | 2              | `product-and-leadership`               | 2    |
| [capstone-secure-service](./capstone-secure-service.md)                               | Python (`python`, stdlib only)                                       | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 6–10           | `security`                             | 3    |
| [capstone-build-your-own-pentest-engine](./capstone-build-your-own-pentest-engine.md) | TypeScript (`typescript`, Node stdlib)                               | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 6–10           | `security`                             | 3    |
| [capstone-real-world-delivery](./capstone-real-world-delivery.md)                     | Python plus offline validators (`python`, `kubeconform`, `opentofu`) | Annotated-Concept, standard | 45 (5 themes of 9)           | 23,000        | 7–11           | `architecture-and-distributed-systems` | 3    |

Totals: 7 standard courses with 45 examples each (315), one no-code course with 24 scenarios, 35 katas,
7 capstone units, and about 156,000 words. Waves are explained in
[tech-docs/003](../../tech-docs/003-prerequisites-readiness-and-ordering.md#waves).

## Shared Rules

- **Unit count.** A standard course is 45 example units, 5 kata units, and 1 capstone unit, so the
  seven code courses hold 357 units, plus one secondary Elixir unit in `capstone-concurrency-showdown`
  (358 in all). The no-code course has none.
- **Same shape.** Every standard course has five themes of nine examples, five milestones that map to
  five checkpoints in the capstone unit, a rubric with six or more criteria, and a `tests` run.
- **Examples are a floor.** The maker may add examples up to the mode's ceiling of 60 and may replace
  a listed example when execution shows it is unbuildable, recording the change in the course file in
  this corpus (this plan is the custodian).
- **Prerequisite edges.** Each file lists the `prerequisites` after the rubric re-run, and the changes
  against plan 02's graph. The seven edits that add a language primer apply rule L1; the other two
  (add `event-driven-architecture`, remove `browser-automation-with-cdp`) apply rule T1 ([tech-docs/003](../../tech-docs/003-prerequisites-readiness-and-ordering.md#prerequisite-rubric-re-run)).
- **Course-level coupling.** Plans 09–13 rewrite or audit prerequisites after this plan merges, so
  every capstone links to a prerequisite by course URL only, restates each concept it uses, imports
  nothing from a prerequisite's code, and keeps a `relies-on` table in `learning/overview.md`
  ([tech-docs/003](../../tech-docs/003-prerequisites-readiness-and-ordering.md#course-level-coupling)).
- **Safety.** The three security-flavoured courses carry a "Safety boundary" section. A reviewer checks
  their pages and code against it at the Content Quality Gate
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#safety-checks-for-security-courses)).
- **Repeated figures.** Numbers shared between `capstone-concurrency-and-systems` and
  `capstone-lead-at-altitude` are copied from the first and searched for in the second
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#cross-course-figures)).
