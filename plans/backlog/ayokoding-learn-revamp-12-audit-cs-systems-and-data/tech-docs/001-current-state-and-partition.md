# 001 — Current State and Partition

This page lists the 34 courses, explains why these 34, and records what was measured on them on 2026-10-09 at
`origin/main` commit `bb7f90137`. The per-course numbers are repeated in each brief under
[../syllabus/courses/](../syllabus/courses/README.md); this page holds the method, the totals, and the comparison
with what other plans own. It also says plainly how much of the plan is an audit and how much is authoring.

## Main Moved After Measurement

On 2026-10-10 `origin/main` moved to `66379d592`. Commit `66379d592` (#675, "correct DSA and SQL essentials")
changed two courses in this plan: `data-structures-and-algorithms-essentials` and `sql-essentials`. It fixed
their overview pages, drilling pages, capstone pages and code, and a few examples, and it added a migration test
under `sql-essentials`. The words, defect classes, and unit counts that the page and the two briefs give for these
two courses describe them as they were at `bb7f90137`. They are upper bounds now. CP-1 of each course measures the
as-merged course and the audit follows that measurement, not the brief's figures. The partition does not change.

## The Partition

The series list gives this plan the scope "audit and fix CS, systems, concurrency, distributed, database, and
data courses". Plan 03's category taxonomy has four categories that match: Computer science (13 courses),
Systems and networking (7), Data and databases (11), and Architecture and distributed systems (8). That is 39
courses. Five of them belong to other plans and are not in this partition:

| Course                              | Category                               | Owner                                                   |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `capstone-concurrency-showdown`     | `computer-science`                     | Plan 08 (one of the eight rewritten skeleton capstones) |
| `compilers-parsers-and-transpilers` | `computer-science`                     | Plan 09 (templated filler, rewritten there)             |
| `type-systems`                      | `computer-science`                     | Plan 09 (templated filler, rewritten there)             |
| `capstone-data-pipeline`            | `data-and-databases`                   | Plan 08 (a skeleton capstone, rewritten there)          |
| `capstone-real-world-delivery`      | `architecture-and-distributed-systems` | Plan 08 (a skeleton capstone, rewritten there)          |

The remaining 34 courses are 10 in `computer-science`, 7 in `systems-and-networking`, 10 in `data-and-databases`,
and 7 in `architecture-and-distributed-systems`. One of them, `capstone-solid-core`, is a capstone that plan 08
does not rewrite (it is one of the five existing capstones); plan 08 fixes the capstone contract, and this plan
brings `capstone-solid-core` to it ([006](./006-prerequisites-metadata-and-closure.md#capstone-solid-core)).
Plans 11 and 13 audit the other pre-existing courses; plan 10 builds new courses; this plan never touches them.

| Category                             | Course                                                                                                          | Format                                      | Wave | Size | Harness mode                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---- | ---- | ---------------------------------------------------------------------------- |
| computer-science                     | [`actor-model-concurrency`](../syllabus/courses/actor-model-concurrency.md)                                     | By Example                                  | 9    | L    | Real mode with the simulation convention for interleaving                    |
| computer-science                     | [`advanced-algorithms`](../syllabus/courses/advanced-algorithms.md)                                             | By Example                                  | 6    | L    | Real mode                                                                    |
| computer-science                     | [`computer-science-foundations`](../syllabus/courses/computer-science-foundations.md)                           | Annotated Concept                           | 2    | M    | Real mode                                                                    |
| computer-science                     | [`concurrency-and-parallelism`](../syllabus/courses/concurrency-and-parallelism.md)                             | By Example                                  | 4    | L    | Real mode with the simulation convention                                     |
| computer-science                     | [`csp-style-concurrency`](../syllabus/courses/csp-style-concurrency.md)                                         | By Example                                  | 9    | M    | Real mode with `testing/synctest` virtual time and the simulation convention |
| computer-science                     | [`data-structures-and-algorithms-essentials`](../syllabus/courses/data-structures-and-algorithms-essentials.md) | By Example                                  | 1    | M    | Real mode                                                                    |
| computer-science                     | [`functional-programming`](../syllabus/courses/functional-programming.md)                                       | By Example                                  | 5    | L    | Real mode                                                                    |
| computer-science                     | [`object-oriented-design-and-patterns`](../syllabus/courses/object-oriented-design-and-patterns.md)             | By Example                                  | 2    | M    | Real mode                                                                    |
| computer-science                     | [`object-oriented-programming-essentials`](../syllabus/courses/object-oriented-programming-essentials.md)       | By Example                                  | 1    | M    | Real mode                                                                    |
| computer-science                     | [`programming-paradigms`](../syllabus/courses/programming-paradigms.md)                                         | By Example                                  | 3    | L    | Real mode                                                                    |
| systems-and-networking               | [`advanced-networking`](../syllabus/courses/advanced-networking.md)                                             | Annotated Concept                           | 10   | L    | Real mode on loopback with fixtures and models                               |
| systems-and-networking               | [`computer-architecture`](../syllabus/courses/computer-architecture.md)                                         | By Example                                  | 4    | L    | Real mode with deterministic models                                          |
| systems-and-networking               | [`linux-os`](../syllabus/courses/linux-os.md)                                                                   | By Example                                  | 3    | XL   | Real mode in a Linux container                                               |
| systems-and-networking               | [`modern-system-programming`](../syllabus/courses/modern-system-programming.md)                                 | By Example                                  | 4    | XL   | Real mode                                                                    |
| systems-and-networking               | [`networking-essentials`](../syllabus/courses/networking-essentials.md)                                         | By Example                                  | 6    | L    | Real mode on loopback with fixtures and models                               |
| systems-and-networking               | [`system-programming`](../syllabus/courses/system-programming.md)                                               | By Example                                  | 8    | XL   | Real mode                                                                    |
| systems-and-networking               | [`windows-os`](../syllabus/courses/windows-os.md)                                                               | By Example                                  | 12   | XL   | Static mode, reason `windows`                                                |
| data-and-databases                   | [`advanced-sql-and-query-performance`](../syllabus/courses/advanced-sql-and-query-performance.md)               | By Example                                  | 2    | M    | Real mode with a PostgreSQL service                                          |
| data-and-databases                   | [`build-your-own-database`](../syllabus/courses/build-your-own-database.md)                                     | By Example                                  | 9    | XL   | Real mode with crash-injection simulation                                    |
| data-and-databases                   | [`build-your-own-orm-and-query-builder`](../syllabus/courses/build-your-own-orm-and-query-builder.md)           | By Example                                  | 8    | M    | Real mode                                                                    |
| data-and-databases                   | [`data-access-orms-and-query-builders`](../syllabus/courses/data-access-orms-and-query-builders.md)             | By Example                                  | 7    | M    | Real mode with a PostgreSQL service                                          |
| data-and-databases                   | [`data-engineering`](../syllabus/courses/data-engineering.md)                                                   | Annotated Concept                           | 11   | S    | Real mode with the simulation convention for streaming                       |
| data-and-databases                   | [`database-internals-and-storage-engines`](../syllabus/courses/database-internals-and-storage-engines.md)       | By Example                                  | 5    | L    | Real mode with the simulation convention                                     |
| data-and-databases                   | [`graph-databases`](../syllabus/courses/graph-databases.md)                                                     | By Example                                  | 11   | M    | Real mode with a Neo4j service                                               |
| data-and-databases                   | [`nosql-databases`](../syllabus/courses/nosql-databases.md)                                                     | By Example                                  | 10   | L    | Real mode with services and models (decision D4)                             |
| data-and-databases                   | [`search-and-information-retrieval`](../syllabus/courses/search-and-information-retrieval.md)                   | By Example                                  | 7    | L    | Real mode                                                                    |
| data-and-databases                   | [`sql-essentials`](../syllabus/courses/sql-essentials.md)                                                       | By Example                                  | 1    | M    | Real mode                                                                    |
| architecture-and-distributed-systems | [`build-your-own-raft`](../syllabus/courses/build-your-own-raft.md)                                             | By Example                                  | 10   | XL   | Real mode with the simulation convention (all units)                         |
| architecture-and-distributed-systems | [`capstone-solid-core`](../syllabus/courses/capstone-solid-core.md)                                             | Capstone (Annotated Concept, standard mode) | 7    | L    | Real mode                                                                    |
| architecture-and-distributed-systems | [`distributed-systems`](../syllabus/courses/distributed-systems.md)                                             | By Example                                  | 8    | L    | Real mode with the simulation convention (all units)                         |
| architecture-and-distributed-systems | [`domain-driven-design`](../syllabus/courses/domain-driven-design.md)                                           | By Example                                  | 5    | L    | Real mode                                                                    |
| architecture-and-distributed-systems | [`event-driven-architecture`](../syllabus/courses/event-driven-architecture.md)                                 | By Example                                  | 6    | XL   | Real mode with the simulation convention                                     |
| architecture-and-distributed-systems | [`software-architecture`](../syllabus/courses/software-architecture.md)                                         | Annotated Concept                           | 3    | L    | Real mode                                                                    |
| architecture-and-distributed-systems | [`system-design`](../syllabus/courses/system-design.md)                                                         | Annotated Concept                           | 11   | L    | Real mode with deterministic load models                                     |

Totals by category (baseline of 2026-10-09; the planning minutes are the invented-seconds figures of
[004](./004-toolchain-additions-and-ci-budget.md#the-ci-budget)):

| Category                               | Courses | Words today | Code files today | Words short of floor | Target units | Planning minutes |
| -------------------------------------- | ------- | ----------- | ---------------- | -------------------- | ------------ | ---------------- |
| `computer-science`                     | 10      | 594,862     | 1,481            | 22,366               | 871          | 92.1             |
| `systems-and-networking`               | 7       | 229,191     | 622              | 87,500               | 596          | 78.9             |
| `data-and-databases`                   | 10      | 663,274     | 1,121            | 25,245               | 869          | 238.8            |
| `architecture-and-distributed-systems` | 7       | 56,967      | 342              | 122,033              | 527          | 55.5             |
| **Total**                              | 34      | 1,544,294   | 3,566            | 257,144              | 2,863        | 465.3            |

By mode: 28 By Example, 5 Annotated Concept (`computer-science-foundations`, `data-engineering`,
`advanced-networking`, `software-architecture`, `system-design`), and 1 capstone (`capstone-solid-core`, Annotated
Concept in its standard mode under the capstone contract). All 34 have code; none is a no-code course, so the
coverage report of Phase 8 expects `covered: true` for 34 of 34.

## How Much Is an Audit and How Much Is Authoring

The plan is a measured audit-and-fix, and most of its 34 courses need repair rather than rewriting. It is not
only an audit, though, and the plan says so because the effort is very different:

- **14 courses need 3,000 or more words written** (270,187 words in all): the word gap, or
  the drilling shortfall, whichever is larger. Six of them are in plan 09's filler baseline and have templated or
  missing lessons. Eight more have lessons far thinner than their floors, from 2,211 to 15,009 words against floors
  of 22,000 to 28,000 words (`modern-system-programming`, `domain-driven-design`, `actor-model-concurrency`,
  `distributed-systems`, `event-driven-architecture`, `system-design`, `software-architecture`, and
  `capstone-solid-core`). They are authoring work, done by the same makers that write a new course.
- **Two more courses need heavy unit rewrites** without a large word gap: `computer-architecture` (about 60 timing
  examples become model or count units) and `advanced-networking` (39 network-bound units are rewritten as
  loopback, fixture, or model units and about 23 are added).
- **The rest are repairs:** anchors, density, "Why It Matters" length, headings, drilling shape, katas, and
  determinism.

So "about 14 to 16 courses need real authoring" is the honest summary, and the README and the business case say it
in those words.

| Course                      | Words today | Words to write | Units to author | Size | In plan 09's baseline |
| --------------------------- | ----------- | -------------- | --------------- | ---- | --------------------- |
| `modern-system-programming` | 2,211       | 25,789         | 8               | XL   |                       |
| `build-your-own-raft`       | 2,578       | 25,422         | 87              | XL   | yes                   |
| `build-your-own-database`   | 2,755       | 25,245         | 87              | XL   | yes                   |
| `system-programming`        | 3,564       | 24,436         | 87              | XL   | yes                   |
| `domain-driven-design`      | 4,477       | 23,523         | 8               | L    |                       |
| `capstone-solid-core`       | 15,009      | 19,800         | 51              | L    |                       |
| `linux-os`                  | 8,319       | 19,681         | 87              | XL   | yes                   |
| `actor-model-concurrency`   | 9,315       | 18,685         | 3               | L    |                       |
| `windows-os`                | 10,406      | 17,594         | 87              | XL   | yes                   |
| `distributed-systems`       | 10,450      | 17,550         | 9               | L    |                       |
| `event-driven-architecture` | 11,289      | 16,711         | 88              | XL   |                       |
| `system-design`             | 6,175       | 15,825         | 10              | L    |                       |
| `software-architecture`     | 6,989       | 15,011         | 16              | L    |                       |
| `csp-style-concurrency`     | 24,319      | 4,915          | 3               | M    | yes                   |

## How the Numbers Were Measured

Every number is a stable repository fact read from `apps/ayokoding-www/content/en/learn/courses/<slug>/` with
read-only scans on 2026-10-09. Phase 0 and CP-1 re-measure them with the repository's checkers; if a number
differs, the brief is edited and the cause recorded.

| Measure                | Method                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Words                  | Whitespace-separated tokens across every `.md` file of the course outside `code/` folders and without `_index.md`, frontmatter removed, fenced code included                   |
| Examples               | Headings `### Example N`, `### Worked Example N`, or `### Worked Scenario N`; where none exist, the numbered sections of the learning pages                                    |
| Diagrams               | Fenced blocks whose info string is `mermaid`                                                                                                                                   |
| "Why It Matters"       | Blocks that start with the bold label; lengths in words (a heuristic count, refined by CP-1)                                                                                   |
| Annotation density     | Comment lines per code line in each example's code files                                                                                                                       |
| Fences                 | Every fenced block in a learning or drilling page; classes follow plan 05 (anchored, `Output`, prose, code)                                                                    |
| Anchors                | Path-label and labelled-path anchors, matched byte for byte against the target file (plan 05's method)                                                                         |
| Code files and folders | Files under any `code/` folder; example folders `ex-NN-*`; kata folders `kata-NN-*`; `run.yaml` files                                                                          |
| Drilling               | Words of the pages under `drilling/`; the `##` headings                                                                                                                        |
| Scan hits              | A read-only pattern scan of the code files for clocks, sleeps, unseeded random numbers, threads, network calls, database use, and platform calls; approximate, CP-1 reads each |

## Totals

| Fact                                                                                 | Value                                                                                                             |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Courses                                                                              | 34 (10 computer science, 7 systems and networking, 10 data and databases, 7 architecture and distributed systems) |
| Words today (all pages)                                                              | 1,544,294                                                                                                         |
| Courses at or above their word floor                                                 | 20 of 34                                                                                                          |
| Courses with 3,000 or more words to write                                            | 14 (270,187 words in all)                                                                                         |
| Words to write, all courses (word gap or drilling shortfall, larger of the two)      | 270,755                                                                                                           |
| Example folders and flat example files today                                         | 2,367                                                                                                             |
| Units to author or convert beyond the existing folders (planning figure)             | 712                                                                                                               |
| Code fences without an anchor                                                        | 1,110                                                                                                             |
| Output blocks without an anchor                                                      | 2,345                                                                                                             |
| Anchors that differ from their file or point at none                                 | 634                                                                                                               |
| Code units outside the annotation band                                               | 1,401                                                                                                             |
| Courses with a `run.yaml`                                                            | 0 of 34                                                                                                           |
| Planning CI minutes per full run of the 34 courses (invented per-invocation seconds) | 465                                                                                                               |

The one-line reading: the 34 courses already hold 1.54 million words and 3,566 code files, but none of them runs in
the harness, and 1,110 code fences and 2,345 output blocks are tied to no file. The word gap is smaller than in
plan 11 (257,144 words short of the floors, and the drilling pages alone 66,257 short of their 5,000-word floors), but the code load is large: 2,863 units, of
which 2,151 convert existing code and 712 are written new.

## Baseline per Course

"Words short" is the gap to the mode's floor. "WIM" is "Why It Matters": blocks outside the 50 to 100 word band
out of the blocks found. "Anchors" counts anchors that differ from their file or point at none. The defect classes
are defined in [002](./002-definition-of-done-and-audit-method.md#defect-classes).

| Course                                      | Words   | Words short of floor | Examples | Diagrams | WIM out of band / found | Katas | Drilling words | Unanchored fences | Unanchored outputs | Anchor differences | Density out of band |
| ------------------------------------------- | ------- | -------------------- | -------- | -------- | ----------------------- | ----- | -------------- | ----------------- | ------------------ | ------------------ | ------------------- |
| `actor-model-concurrency`                   | 9,315   | 18,685               | 78       | 0        | 0/0                     | 5     | 275            | 78                | 0                  | 0                  | 37                  |
| `advanced-algorithms`                       | 92,244  | 0                    | 80       | 13       | 35/111                  | 10    | 9,467          | 2                 | 177                | 18                 | 80                  |
| `computer-science-foundations`              | 50,712  | 0                    | 55       | 8        | 45/58                   | 0     | 4,899          | 58                | 53                 | 0                  | 0                   |
| `concurrency-and-parallelism`               | 90,432  | 0                    | 87       | 34       | 1/87                    | 10    | 13,387         | 5                 | 188                | 10                 | 80                  |
| `csp-style-concurrency`                     | 24,319  | 3,681                | 78       | 0        | 0/0                     | 5     | 85             | 79                | 0                  | 0                  | 59                  |
| `data-structures-and-algorithms-essentials` | 56,936  | 0                    | 82       | 39       | 17/105                  | 0     | 9,667          | 23                | 106                | 0                  | 54                  |
| `functional-programming`                    | 64,175  | 0                    | 80       | 40       | 19/108                  | 10    | 9,947          | 166               | 176                | 22                 | 80                  |
| `object-oriented-design-and-patterns`       | 90,032  | 0                    | 84       | 37       | 30/121                  | 12    | 10,123         | 0                 | 181                | 0                  | 75                  |
| `object-oriented-programming-essentials`    | 47,714  | 0                    | 80       | 33       | 14/97                   | 8     | 6,321          | 8                 | 169                | 0                  | 79                  |
| `programming-paradigms`                     | 68,983  | 0                    | 80       | 31       | 8/105                   | 10    | 8,126          | 166               | 176                | 160                | 72                  |
| `advanced-networking`                       | 49,227  | 0                    | 62       | 19       | 20/66                   | 0     | 6,459          | 43                | 42                 | 0                  | 17                  |
| `computer-architecture`                     | 100,135 | 0                    | 80       | 31       | 0/80                    | 0     | 5,542          | 80                | 84                 | 0                  | 61                  |
| `linux-os`                                  | 8,319   | 19,681               | 78       | 31       | 0/0                     | 0     | 286            | 2                 | 0                  | 0                  | 78                  |
| `modern-system-programming`                 | 2,211   | 25,789               | 0        | 30       | 0/0                     | 0     | 275            | 0                 | 0                  | 0                  | 78                  |
| `networking-essentials`                     | 55,329  | 0                    | 82       | 37       | 23/106                  | 0     | 4,579          | 90                | 90                 | 0                  | 25                  |
| `system-programming`                        | 3,564   | 24,436               | 0        | 34       | 0/0                     | 0     | 356            | 4                 | 0                  | 0                  | 78                  |
| `windows-os`                                | 10,406  | 17,594               | 78       | 32       | 78/78                   | 0     | 394            | 1                 | 0                  | 0                  | 78                  |
| `advanced-sql-and-query-performance`        | 90,061  | 0                    | 85       | 31       | 6/85                    | 10    | 12,845         | 2                 | 86                 | 58                 | 0                   |
| `build-your-own-database`                   | 2,755   | 25,245               | 78       | 0        | 0/0                     | 0     | 202            | 0                 | 0                  | 0                  | 78                  |
| `build-your-own-orm-and-query-builder`      | 81,041  | 0                    | 78       | 32       | 11/103                  | 8     | 9,590          | 0                 | 167                | 0                  | 76                  |
| `data-access-orms-and-query-builders`       | 90,222  | 0                    | 78       | 31       | 0/78                    | 6     | 8,714          | 1                 | 84                 | 0                  | 0                   |
| `data-engineering`                          | 50,255  | 0                    | 52       | 4        | 0/60                    | 0     | 4,954          | 57                | 56                 | 0                  | 0                   |
| `database-internals-and-storage-engines`    | 71,340  | 0                    | 80       | 36       | 22/112                  | 8     | 8,667          | 0                 | 177                | 136                | 80                  |
| `graph-databases`                           | 49,420  | 0                    | 80       | 30       | 61/110                  | 7     | 8,782          | 8                 | 71                 | 22                 | 16                  |
| `nosql-databases`                           | 95,523  | 0                    | 91       | 37       | 0/91                    | 0     | 6,588          | 3                 | 90                 | 93                 | 23                  |
| `search-and-information-retrieval`          | 80,822  | 0                    | 80       | 34       | 0/80                    | 0     | 6,433          | 0                 | 84                 | 84                 | 80                  |
| `sql-essentials`                            | 51,835  | 0                    | 80       | 33       | 8/80                    | 8     | 8,502          | 8                 | 88                 | 29                 | 14                  |
| `build-your-own-raft`                       | 2,578   | 25,422               | 78       | 0        | 0/0                     | 0     | 168            | 0                 | 0                  | 0                  | 0                   |
| `capstone-solid-core`                       | 15,009  | 7,991                | 0        | 1        | 4/4                     | 0     | 0              | 43                | 0                  | 0                  | 0                   |
| `distributed-systems`                       | 10,450  | 17,550               | 85       | 1        | 85/85                   | 0     | 318            | 81                | 0                  | 0                  | 3                   |
| `domain-driven-design`                      | 4,477   | 23,523               | 80       | 1        | 0/0                     | 0     | 282            | 0                 | 0                  | 0                  | 0                   |
| `event-driven-architecture`                 | 11,289  | 16,711               | 80       | 1        | 84/84                   | 0     | 925            | 84                | 0                  | 0                  | 0                   |
| `software-architecture`                     | 6,989   | 15,011               | 52       | 11       | 52/52                   | 0     | 327            | 18                | 0                  | 2                  | 0                   |
| `system-design`                             | 6,175   | 15,825               | 53       | 5        | 53/53                   | 0     | 418            | 0                 | 0                  | 0                  | 0                   |

## The Six Courses in Plan 09's Filler Baseline

Plan 09 added a deterministic filler guard with a closed baseline of 25 non-outline courses that fire a rule (17
after plan 09 rewrites eight; 12 after plan 11 removes five). Six of the 12 left are tagged for this plan. The
guard's rules and the ratchet are in [007](./007-testing-strategy.md#the-filler-baseline-ratchet).

| Course                    | Rules that fire   | Measured values                                                                  | Wave | Size | What is rewritten             |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------- | ---- | ---- | ----------------------------- |
| `build-your-own-database` | FG2               | unique-code ratio 0.04                                                           | 9    | XL   | all units                     |
| `build-your-own-raft`     | FG2 and FG4       | unique-code ratio 0.01; stub share 1.0                                           | 10   | XL   | all units                     |
| `linux-os`                | FG2               | unique-code ratio 0.12                                                           | 3    | XL   | all units                     |
| `system-programming`      | FG2               | unique-code ratio 0.01; 0 bodies                                                 | 8    | XL   | all units                     |
| `windows-os`              | FG2, FG3, and FG6 | unique-code ratio 0.18; near-duplicate share 0.73; repeated-paragraph share 0.68 | 12   | XL   | all units                     |
| `csp-style-concurrency`   | FG6               | repeated-paragraph share 0.49                                                    | 9    | M    | lessons (repeated paragraphs) |

For five of the six, the templated part is the **code and the lessons together**: the programs repeat a handful of
shapes, so the lesson text around them cannot be repaired by editing. They are rewritten from scratch inside the
course's folder, with each program distinct and each lesson written from its own program. The sixth,
`csp-style-concurrency`, fires only FG6 (paragraphs that repeat across examples): its programs are real and its
lessons are rewritten.

## Annotated Concept and Capstone Courses

Five courses are in Annotated Concept mode and one is a capstone. Plan 11's completion test requires the heading
form `### Worked Example N: Title`, at least 45 worked examples, and at least 10 diagrams for these modes. Two of the
five use `### Example N` today and are renamed; four have fewer than 10 diagrams today.

| Course                         | Registry format   | Worked examples today | Heading forms today       | Diagrams | Diagrams to add (floor 10) | Example units or flat files today | Units to author (planning) |
| ------------------------------ | ----------------- | --------------------- | ------------------------- | -------- | -------------------------- | --------------------------------- | -------------------------- |
| `computer-science-foundations` | annotated-concept | 55                    | 55 × `### Example`        | 8        | 2                          | 55                                | 5                          |
| `advanced-networking`          | annotated-concept | 62                    | 62 × `### Example`        | 19       | 0                          | 39                                | 28                         |
| `data-engineering`             | annotated-concept | 52                    | 52 × `### Worked Example` | 4        | 6                          | 52                                | 5                          |
| `capstone-solid-core`          | capstone          | 0                     | none                      | 1        | 9                          | 0                                 | 51                         |
| `software-architecture`        | annotated-concept | 52                    | 52 × `### Worked Example` | 11       | 0                          | 20                                | 16                         |
| `system-design`                | annotated-concept | 53                    | 53 × `### Worked Example` | 5        | 5                          | 25                                | 10                         |

## Courses Whose Overview Lacks "Examples by Level"

A By Example course must have `## Examples by Level` in `learning/overview.md`; its absence is CRITICAL in the
mode checker. Eight By Example courses lack it today:
`actor-model-concurrency`, `csp-style-concurrency`, `linux-os`, `modern-system-programming`, `system-programming`, `windows-os`, `build-your-own-database`, `build-your-own-raft`.

## Comparison With What Other Plans Own

| Fact                                 | This plan (34 courses)          | Plan 11 (32 courses) |
| ------------------------------------ | ------------------------------- | -------------------- |
| Words today                          | 1,544,294                       | 705,141              |
| Words short of the floors            | 257,144                         | 305,207              |
| Code files today                     | 3,566                           | 3,071                |
| Planning CI minutes                  | 465                             | 378.5                |
| Courses in plan 09's filler baseline | 6                               | 5                    |
| Services and new toolchain ids       | 5 services and 2 derived images | none (by default)    |
| Simulation-convention courses        | 15                              | 0                    |

This plan's courses are larger and more code-heavy; the word gap is concentrated in the 14 authoring courses.
