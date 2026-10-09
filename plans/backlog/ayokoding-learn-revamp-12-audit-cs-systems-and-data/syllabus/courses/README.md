# Syllabus Courses — Audit of CS, Systems, Data, and Architecture Courses

One audit brief per course, 34 in all. Each brief records the measured baseline of 2026-10-09 (`origin/main` `bb7f90137`), the expected defect classes, the fixes, the harness mode and toolchain, the size class and effort, the prerequisite re-check, and a per-course checklist. The briefs are the executors' input: the maker and the fixers read the course's file, and the first checkpoint of each course (CP-1) confirms or corrects it.

## How to Read a Brief

| Section                                                | What it holds                                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Why this exists                                        | The measured problem and the one idea to keep                                                                    |
| Prerequisites                                          | Plan 02's revised list as read on 2026-10-09                                                                     |
| Mode and targets                                       | The mode and why it fits; a measure / today / target / work table                                                |
| Expected defect classes                                | Codes DC1 to DC17 with the measured fact for each (definitions in tech-docs/002)                                 |
| Fixes and design                                       | What changes, and the determinism and environment rules for this course                                          |
| Harness mode and toolchain                             | Real, simulation, or static mode; toolchain ids and additions; course lock; spikes; illustration budget; CI cost |
| Simulation convention / Database fixture / Static mode | Only where they apply: invariants and seeds; container, image, and fixed data; what a static run proves          |
| Size class and sequencing                              | Class and effort, agent packets, wave and slot, dependents in this plan                                          |
| Per-course checklist                                   | CP-0 to CP-7 as checkboxes, plus the course-specific obligation (C11)                                            |
| Accuracy notes, Concepts, Lineage, In which paths      | Sources, the course's pages, where it leads, and its path positions                                              |

## The 34 Courses

### computer-science (10 courses)

| Course                                                                                      | Mode              | Wave | Size | Harness mode                                                                 | Variable defect classes                         |
| ------------------------------------------------------------------------------------------- | ----------------- | ---- | ---- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| [actor-model-concurrency](./actor-model-concurrency.md)                                     | By Example        | 9    | L    | Real mode with the simulation convention for interleaving                    | DC1, DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12  |
| [advanced-algorithms](./advanced-algorithms.md)                                             | By Example        | 6    | L    | Real mode                                                                    | DC3, DC4, DC6, DC7, DC12                        |
| [computer-science-foundations](./computer-science-foundations.md)                           | Annotated Concept | 2    | M    | Real mode                                                                    | DC3, DC5, DC6, DC10, DC11, DC12                 |
| [concurrency-and-parallelism](./concurrency-and-parallelism.md)                             | By Example        | 4    | L    | Real mode with the simulation convention                                     | DC3, DC4, DC6, DC7, DC12, DC13                  |
| [csp-style-concurrency](./csp-style-concurrency.md)                                         | By Example        | 9    | M    | Real mode with `testing/synctest` virtual time and the simulation convention | DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12, DC16 |
| [data-structures-and-algorithms-essentials](./data-structures-and-algorithms-essentials.md) | By Example        | 1    | M    | Real mode                                                                    | DC3, DC6, DC7, DC10, DC11, DC12, DC13           |
| [functional-programming](./functional-programming.md)                                       | By Example        | 5    | L    | Real mode                                                                    | DC3, DC4, DC6, DC7, DC12, DC13                  |
| [object-oriented-design-and-patterns](./object-oriented-design-and-patterns.md)             | By Example        | 2    | M    | Real mode                                                                    | DC3, DC6, DC7, DC12, DC13, DC14                 |
| [object-oriented-programming-essentials](./object-oriented-programming-essentials.md)       | By Example        | 1    | M    | Real mode                                                                    | DC3, DC6, DC7, DC12, DC13, DC14                 |
| [programming-paradigms](./programming-paradigms.md)                                         | By Example        | 3    | L    | Real mode                                                                    | DC3, DC4, DC6, DC7, DC12, DC13                  |

### systems-and-networking (7 courses)

| Course                                                      | Mode              | Wave | Size | Harness mode                                   | Variable defect classes                                    |
| ----------------------------------------------------------- | ----------------- | ---- | ---- | ---------------------------------------------- | ---------------------------------------------------------- |
| [advanced-networking](./advanced-networking.md)             | Annotated Concept | 10   | L    | Real mode on loopback with fixtures and models | DC3, DC5, DC6, DC7, DC11, DC12, DC13, DC14                 |
| [computer-architecture](./computer-architecture.md)         | By Example        | 4    | L    | Real mode with deterministic models            | DC1, DC3, DC7, DC10, DC11, DC12, DC13                      |
| [linux-os](./linux-os.md)                                   | By Example        | 3    | XL   | Real mode in a Linux container                 | DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12, DC13, DC16      |
| [modern-system-programming](./modern-system-programming.md) | By Example        | 4    | XL   | Real mode                                      | DC1, DC5, DC7, DC8, DC9, DC10, DC11, DC12, DC13, DC14      |
| [networking-essentials](./networking-essentials.md)         | By Example        | 6    | L    | Real mode on loopback with fixtures and models | DC3, DC6, DC7, DC10, DC11, DC12, DC13, DC14                |
| [system-programming](./system-programming.md)               | By Example        | 8    | XL   | Real mode                                      | DC1, DC3, DC5, DC7, DC8, DC9, DC10, DC11, DC12, DC13, DC16 |
| [windows-os](./windows-os.md)                               | By Example        | 12   | XL   | Static mode, reason `windows`                  | DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12, DC13, DC16      |

### data-and-databases (10 courses)

| Course                                                                                | Mode              | Wave | Size | Harness mode                                           | Variable defect classes                    |
| ------------------------------------------------------------------------------------- | ----------------- | ---- | ---- | ------------------------------------------------------ | ------------------------------------------ |
| [advanced-sql-and-query-performance](./advanced-sql-and-query-performance.md)         | By Example        | 2    | M    | Real mode with a PostgreSQL service                    | DC3, DC4, DC6, DC12, DC13, DC14            |
| [build-your-own-database](./build-your-own-database.md)                               | By Example        | 9    | XL   | Real mode with crash-injection simulation              | DC5, DC6, DC7, DC9, DC10, DC11, DC13, DC16 |
| [build-your-own-orm-and-query-builder](./build-your-own-orm-and-query-builder.md)     | By Example        | 8    | M    | Real mode                                              | DC3, DC6, DC7, DC12, DC13                  |
| [data-access-orms-and-query-builders](./data-access-orms-and-query-builders.md)       | By Example        | 7    | M    | Real mode with a PostgreSQL service                    | DC3, DC10, DC11, DC12, DC13                |
| [data-engineering](./data-engineering.md)                                             | Annotated Concept | 11   | S    | Real mode with the simulation convention for streaming | DC3, DC6, DC10, DC11, DC12, DC13, DC14     |
| [database-internals-and-storage-engines](./database-internals-and-storage-engines.md) | By Example        | 5    | L    | Real mode with the simulation convention               | DC3, DC4, DC6, DC7, DC12, DC14             |
| [graph-databases](./graph-databases.md)                                               | By Example        | 11   | M    | Real mode with a Neo4j service                         | DC3, DC4, DC6, DC7, DC11, DC12, DC13, DC14 |
| [nosql-databases](./nosql-databases.md)                                               | By Example        | 10   | L    | Real mode with services and models (decision D4)       | DC3, DC4, DC7, DC11, DC12, DC13, DC14      |
| [search-and-information-retrieval](./search-and-information-retrieval.md)             | By Example        | 7    | L    | Real mode                                              | DC3, DC4, DC7, DC11, DC12, DC13, DC14      |
| [sql-essentials](./sql-essentials.md)                                                 | By Example        | 1    | M    | Real mode                                              | DC3, DC4, DC6, DC7, DC13, DC14             |

### architecture-and-distributed-systems (7 courses)

| Course                                                      | Mode                   | Wave | Size | Harness mode                                         | Variable defect classes                               |
| ----------------------------------------------------------- | ---------------------- | ---- | ---- | ---------------------------------------------------- | ----------------------------------------------------- |
| [build-your-own-raft](./build-your-own-raft.md)             | By Example             | 10   | XL   | Real mode with the simulation convention (all units) | DC5, DC6, DC9, DC10, DC11, DC16                       |
| [capstone-solid-core](./capstone-solid-core.md)             | Capstone (AC standard) | 7    | L    | Real mode                                            | DC17, DC3, DC5, DC6, DC8, DC9, DC10, DC11, DC12, DC13 |
| [distributed-systems](./distributed-systems.md)             | By Example             | 8    | L    | Real mode with the simulation convention (all units) | DC1, DC3, DC6, DC7, DC9, DC10, DC11, DC12             |
| [domain-driven-design](./domain-driven-design.md)           | By Example             | 5    | L    | Real mode                                            | DC5, DC6, DC9, DC10, DC11, DC12, DC13                 |
| [event-driven-architecture](./event-driven-architecture.md) | By Example             | 6    | XL   | Real mode with the simulation convention             | DC1, DC3, DC6, DC9, DC10, DC11, DC12, DC14            |
| [software-architecture](./software-architecture.md)         | Annotated Concept      | 3    | L    | Real mode                                            | DC1, DC3, DC4, DC6, DC9, DC10, DC11, DC12, DC13       |
| [system-design](./system-design.md)                         | Annotated Concept      | 11   | L    | Real mode with deterministic load models             | DC1, DC6, DC9, DC10, DC11, DC12                       |

## Measured Baseline

Words count every Markdown page. Examples are headings found in the lessons (the unit count can differ). Diagrams are Mermaid fences. Unanchored counts code fences plus output blocks; "differ" counts anchors whose fence is not the file's text.

| Course                                    | Words   | Examples | Diagrams | Units | Unanchored | Differ | Drilling words | Katas |
| ----------------------------------------- | ------- | -------- | -------- | ----- | ---------- | ------ | -------------- | ----- |
| actor-model-concurrency                   | 9,315   | 78       | 0        | 78    | 78         | 0      | 275            | 5     |
| advanced-algorithms                       | 92,244  | 80       | 13       | 80    | 179        | 18     | 9,467          | 10    |
| computer-science-foundations              | 50,712  | 55       | 8        | 55    | 111        | 0      | 4,899          | 0     |
| concurrency-and-parallelism               | 90,432  | 87       | 34       | 87    | 193        | 10     | 13,387         | 10    |
| csp-style-concurrency                     | 24,319  | 78       | 0        | 78    | 79         | 0      | 85             | 5     |
| data-structures-and-algorithms-essentials | 56,936  | 82       | 39       | 82    | 129        | 0      | 9,667          | 0     |
| functional-programming                    | 64,175  | 80       | 40       | 80    | 342        | 22     | 9,947          | 10    |
| object-oriented-design-and-patterns       | 90,032  | 84       | 37       | 84    | 181        | 0      | 10,123         | 12    |
| object-oriented-programming-essentials    | 47,714  | 80       | 33       | 80    | 177        | 0      | 6,321          | 8     |
| programming-paradigms                     | 68,983  | 80       | 31       | 80    | 342        | 160    | 8,126          | 10    |
| advanced-networking                       | 49,227  | 62       | 19       | 39    | 85         | 0      | 6,459          | 0     |
| computer-architecture                     | 100,135 | 80       | 31       | 80    | 164        | 0      | 5,542          | 0     |
| linux-os                                  | 8,319   | 78       | 31       | 78    | 2          | 0      | 286            | 0     |
| modern-system-programming                 | 2,211   | 0        | 30       | 78    | 0          | 0      | 275            | 0     |
| networking-essentials                     | 55,329  | 82       | 37       | 82    | 180        | 0      | 4,579          | 0     |
| system-programming                        | 3,564   | 0        | 34       | 78    | 4          | 0      | 356            | 0     |
| windows-os                                | 10,406  | 78       | 32       | 78    | 1          | 0      | 394            | 0     |
| advanced-sql-and-query-performance        | 90,061  | 85       | 31       | 85    | 88         | 58     | 12,845         | 10    |
| build-your-own-database                   | 2,755   | 78       | 0        | 78    | 0          | 0      | 202            | 0     |
| build-your-own-orm-and-query-builder      | 81,041  | 78       | 32       | 78    | 167        | 0      | 9,590          | 8     |
| data-access-orms-and-query-builders       | 90,222  | 78       | 31       | 78    | 85         | 0      | 8,714          | 6     |
| data-engineering                          | 50,255  | 52       | 4        | 52    | 113        | 0      | 4,954          | 0     |
| database-internals-and-storage-engines    | 71,340  | 80       | 36       | 80    | 177        | 136    | 8,667          | 8     |
| graph-databases                           | 49,420  | 80       | 30       | 80    | 79         | 22     | 8,782          | 7     |
| nosql-databases                           | 95,523  | 91       | 37       | 91    | 93         | 93     | 6,588          | 0     |
| search-and-information-retrieval          | 80,822  | 80       | 34       | 80    | 84         | 84     | 6,433          | 0     |
| sql-essentials                            | 51,835  | 80       | 33       | 80    | 96         | 29     | 8,502          | 8     |
| build-your-own-raft                       | 2,578   | 78       | 0        | 78    | 0          | 0      | 168            | 0     |
| capstone-solid-core                       | 15,009  | 0        | 1        | 0     | 43         | 0      | 0              | 0     |
| distributed-systems                       | 10,450  | 85       | 1        | 85    | 81         | 0      | 318            | 0     |
| domain-driven-design                      | 4,477   | 80       | 1        | 80    | 0          | 0      | 282            | 0     |
| event-driven-architecture                 | 11,289  | 80       | 1        | 0     | 84         | 0      | 925            | 0     |
| software-architecture                     | 6,989   | 52       | 11       | 20    | 18         | 2      | 327            | 0     |
| system-design                             | 6,175   | 53       | 5        | 25    | 0          | 0      | 418            | 0     |

## Waves

Each wave has at most 3 courses (N=3 agents) and every course's in-plan prerequisites are in an earlier wave. Phase 0 re-derives the order from the merged frontmatter.

| Wave | Courses (slot 1, 2, 3)                                                                                      |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| 1    | `sql-essentials`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`     |
| 2    | `advanced-sql-and-query-performance`, `computer-science-foundations`, `object-oriented-design-and-patterns` |
| 3    | `software-architecture`, `programming-paradigms`, `linux-os`                                                |
| 4    | `concurrency-and-parallelism`, `computer-architecture`, `modern-system-programming`                         |
| 5    | `domain-driven-design`, `functional-programming`, `database-internals-and-storage-engines`                  |
| 6    | `event-driven-architecture`, `networking-essentials`, `advanced-algorithms`                                 |
| 7    | `capstone-solid-core`, `data-access-orms-and-query-builders`, `search-and-information-retrieval`            |
| 8    | `system-programming`, `distributed-systems`, `build-your-own-orm-and-query-builder`                         |
| 9    | `actor-model-concurrency`, `build-your-own-database`, `csp-style-concurrency`                               |
| 10   | `build-your-own-raft`, `advanced-networking`, `nosql-databases`                                             |
| 11   | `system-design`, `graph-databases`, `data-engineering`                                                      |
| 12   | `windows-os`                                                                                                |

## Size Classes

S 1, M 10, L 16, XL 7 (rule in tech-docs/002; documented overrides are named in each brief).

| Class | Courses                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S     | `data-engineering`                                                                                                                                                                                                                                                                                                                                                                                                           |
| M     | `computer-science-foundations`, `csp-style-concurrency`, `data-structures-and-algorithms-essentials`, `object-oriented-design-and-patterns`, `object-oriented-programming-essentials`, `advanced-sql-and-query-performance`, `build-your-own-orm-and-query-builder`, `data-access-orms-and-query-builders`, `graph-databases`, `sql-essentials`                                                                              |
| L     | `actor-model-concurrency`, `advanced-algorithms`, `concurrency-and-parallelism`, `functional-programming`, `programming-paradigms`, `advanced-networking`, `computer-architecture`, `networking-essentials`, `database-internals-and-storage-engines`, `nosql-databases`, `search-and-information-retrieval`, `capstone-solid-core`, `distributed-systems`, `domain-driven-design`, `software-architecture`, `system-design` |
| XL    | `linux-os`, `modern-system-programming`, `system-programming`, `windows-os`, `build-your-own-database`, `build-your-own-raft`, `event-driven-architecture`                                                                                                                                                                                                                                                                   |
