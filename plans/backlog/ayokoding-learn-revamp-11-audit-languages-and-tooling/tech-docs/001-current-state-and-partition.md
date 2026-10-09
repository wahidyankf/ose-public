# 001 — Current State and Partition

This page lists the 32 courses, explains why these 32, and records what was measured on them on 2026-10-09 at
`origin/main` commit `bb7f90137`. The per-course numbers are repeated in each brief under
[../syllabus/courses/](../syllabus/courses/README.md); this page holds the method, the totals, and the
comparison with what other plans own.

## Main Moved After Measurement

On 2026-10-10 `origin/main` moved to `66379d592`. Commit `0bf04407b` (#671, "complete five just-enough
primers") rewrote four courses in this plan: `just-enough-csharp`, `just-enough-go`, `just-enough-java`, and
`just-enough-python` (the fifth primer, `just-enough-fsharp`, belongs to plan 09). It also added
`just-enough-python/overview.md`. The words, heading counts, defect classes, "words to write", and unit counts
that the page and the four briefs give for these four courses describe them as they were at `bb7f90137`. They
are upper bounds now. CP-1 of each course measures the as-merged course and the audit follows that measurement,
not the brief's figures. The partition does not change: the four courses stay in this plan, and they still go
through the full audit and the harness, because the commit did not add `run.yaml` units or the harness.

## The Partition

The series list gives this plan the scope "audit and fix language and tooling courses". Plan 03's category
taxonomy has three categories that match: Tools and practices (11 courses), Programming languages (16), and
Infrastructure and operations (9). That is 36 courses. Four of them belong to other plans and are not in this
partition:

| Course                             | Category                      | Owner                                          |
| ---------------------------------- | ----------------------------- | ---------------------------------------------- |
| `build-your-own-git`               | Tools and practices           | Plan 09 (templated filler, rewritten there)    |
| `just-enough-fsharp`               | Programming languages         | Plan 09 (templated filler, rewritten there)    |
| `lisp`                             | Programming languages         | Plan 09 (templated filler, rewritten there)    |
| `capstone-concurrency-and-systems` | Infrastructure and operations | Plan 08 (one of the eight rewritten capstones) |

The remaining 32 courses are 10 in `tools-and-practices`, 14 in `programming-languages`,
and 8 in `infrastructure-and-operations`. Plans 12 and 13 audit the other pre-existing
courses; plan 10 builds new courses; this plan never touches them.

| Family         | Course                                                                                            | Format                                 | Wave | Size | Harness mode             |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | ---- | ---- | ------------------------ |
| tools          | [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | By Example                             | 4    | XL   | real                     |
| tools          | [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | By Example                             | 9    | L    | real                     |
| tools          | [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | By Example                             | 6    | L    | real                     |
| tools          | [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | Capstone (Annotated Concept, standard) | 10   | XL   | real                     |
| tools          | [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | By Example                             | 8    | S    | real                     |
| tools          | [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | By Example                             | 8    | S    | real                     |
| tools          | [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | Primer                                 | 2    | S    | real                     |
| tools          | [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | Annotated Concept                      | 10   | S    | real                     |
| tools          | [`software-testing`](../syllabus/courses/software-testing.md)                                     | By Example                             | 4    | S    | real                     |
| tools          | [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | By Example                             | 4    | S    | real                     |
| languages      | [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | Primer                                 | 1    | S    | real                     |
| languages      | [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | Primer                                 | 5    | M    | real                     |
| languages      | [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | Primer                                 | 7    | M    | real                     |
| languages      | [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | Primer                                 | 6    | XL   | real                     |
| languages      | [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | Primer                                 | 3    | L    | real                     |
| languages      | [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | Primer                                 | 5    | L    | real                     |
| languages      | [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | Primer                                 | 1    | M    | real                     |
| languages      | [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | Primer                                 | 3    | XL   | real                     |
| languages      | [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | Primer                                 | 3    | L    | real                     |
| languages      | [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | Primer                                 | 5    | S    | real                     |
| languages      | [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | Primer                                 | 1    | S    | real                     |
| languages      | [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | Primer                                 | 2    | XL   | real                     |
| languages      | [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | Primer                                 | 6    | L    | real, with static units  |
| languages      | [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | Primer                                 | 2    | S    | real                     |
| infrastructure | [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | By Example                             | 10   | L    | real, with static units  |
| infrastructure | [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | By Example                             | 9    | M    | real                     |
| infrastructure | [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | Annotated Concept                      | 9    | L    | static and real          |
| infrastructure | [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | By Example                             | 7    | L    | real, with static units  |
| infrastructure | [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | Annotated Concept, no-code             | 11   | M    | not applicable (no code) |
| infrastructure | [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | By Example                             | 7    | S    | real                     |
| infrastructure | [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | By Example                             | 11   | XL   | real, with static units  |
| infrastructure | [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | Annotated Concept                      | 8    | L    | real                     |

Totals by family (baseline of 2026-10-09):

| Family                          | Courses | Words today | Code files today | Words short of floor | Target units | Planning minutes |
| ------------------------------- | ------- | ----------- | ---------------- | -------------------- | ------------ | ---------------- |
| `tools-and-practices`           | 10      | 326,147     | 1,497            | 71,790               | 810          | 86.5             |
| `programming-languages`         | 14      | 244,982     | 1,269            | 154,371              | 1,238        | 245.2            |
| `infrastructure-and-operations` | 8       | 134,012     | 305              | 79,046               | 523          | 46.8             |
| **Total**                       | 32      | 705,141     | 3,071            | 305,207              | 2,571        | 378.5            |

By mode: 12 By Example, 15 Primer, 3 Annotated Concept, 1 Annotated Concept
no-code, and 1 capstone (`capstone-forge-ready`). By harness mode: 31 courses have code and
will be covered; `platform-engineering-and-devex` has no code and is "not applicable" in the coverage report.

## How the Numbers Were Measured

Every number is a stable repository fact read from `apps/ayokoding-www/content/en/learn/courses/<slug>/` with
read-only scans on 2026-10-09. Phase 0 and CP-1 re-measure them with the repository's checkers; if a number
differs, the brief is edited and the cause recorded.

| Measure                | Method                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Words                  | Whitespace-separated tokens across every `.md` file of the course outside `code/` folders and without `_index.md`, frontmatter removed, fenced code included |
| Examples               | Headings `### Example N`, `### Worked Example N`, or `### Worked Scenario N`; where none exist, the numbered sections of the learning pages                  |
| Diagrams               | Fenced blocks whose info string is `mermaid`                                                                                                                 |
| "Why It Matters"       | Blocks that start with the bold label; lengths in words                                                                                                      |
| Annotation density     | Comment lines per code line in each example's fenced code                                                                                                    |
| Fences                 | Every fenced block in a learning or drilling page; classes follow plan 05 (anchored, `Output`, prose, code)                                                  |
| Anchors                | Path-label and labelled-path anchors, matched byte for byte against the target file (plan 05's method)                                                       |
| Code files and folders | Files under any `code/` folder; example folders `ex-NN-*`; kata folders `kata-NN-*`; `run.yaml` files                                                        |
| Drilling               | Words of the pages under `drilling/`; the `##` headings; `<details>` blocks                                                                                  |

A caveat on one course: plan 08's survey lists `capstone-forge-ready` at 3,009 words and this plan's method
counts 1,977, because the counting rules differ (what is included). CP-1 records the number the mode checker
reports, and the brief uses that one if it differs.

## Totals

| Measure                                                      | Value                                   |
| ------------------------------------------------------------ | --------------------------------------- |
| Words in the 32 courses                                      | 705,141                                 |
| Markdown pages (excluding `_index.md`)                       | 249                                     |
| Code files                                                   | 3,071                                   |
| Example folders / kata folders                               | 1,651 / 70                              |
| Courses short of their word floor / words short              | 21 / 305,207                            |
| Courses with a drilling page under 5,000 words / words short | 24 / 95,746                             |
| Code fences in lessons / unanchored                          | 3,980 / 1,368                           |
| `Output` blocks not anchored to an expected file             | 792                                     |
| Anchors: match / mismatch / missing file                     | 366 / 494 / 13                          |
| "Why It Matters" blocks / under 50 words                     | 1,560 / 653                             |
| Target units (examples + katas + capstones)                  | 2,571 (826 to create, 1,745 to convert) |
| Size classes S / M / L / XL                                  | 11 / 5 / 10 / 6                         |

Plan 05 counted 1,124 lesson-to-file mismatches and 167 missing-file anchors in the 25 affected courses of
the whole catalog and assigned the repair to plans 11 to 13. This plan's share, in its 32 courses, is
494 mismatches and 13 missing-file anchors.

## Baseline per Course

Gap is words short of the mode's floor. "Anchors to repair" counts mismatches and missing files. The last
column counts the defect classes the brief expects (the classes are defined in
[002](./002-definition-of-done-and-targets.md#defect-classes)).

| Course                                                                                            | Words  | Floor  | Gap    | Examples (have / floor) | Code files | Example folders | Kata folders | Unanchored code fences | Unanchored outputs | Anchors to repair | Drilling words | Defect classes |
| ------------------------------------------------------------------------------------------------- | ------ | ------ | ------ | ----------------------- | ---------- | --------------- | ------------ | ---------------------- | ------------------ | ----------------- | -------------- | -------------- |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | 6,898  | 28,000 | 21,102 | 75 / 75                 | 61         | 59              | 0            | 1                      | 0                  | 0                 | 443            | 6              |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | 15,571 | 28,000 | 12,429 | 80 / 75                 | 176        | 79              | 0            | 48                     | 0                  | 0                 | 204            | 6              |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | 10,764 | 28,000 | 17,236 | 78 / 75                 | 82         | 78              | 0            | 78                     | 0                  | 2                 | 516            | 7              |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | 1,977  | 23,000 | 21,023 | 0 / 45                  | 10         | 0               | 0            | 2                      | 3                  | 0                 | 0              | 5              |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | 78,115 | 28,000 | 0      | 80 / 75                 | 154        | 80              | 0            | 120                    | 92                 | 0                 | 4,987          | 6              |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | 34,423 | 28,000 | 0      | 80 / 75                 | 322        | 80              | 8            | 8                      | 84                 | 105               | 6,077          | 5              |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | 28,547 | 28,000 | 0      | 91 / 75                 | 324        | 91              | 8            | 0                      | 0                  | 2                 | 4,522          | 4              |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | 39,794 | 22,000 | 0      | 54 / 45                 | 70         | 28              | 0            | 2                      | 31                 | 29                | 7,474          | 7              |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | 63,837 | 28,000 | 0      | 86 / 75                 | 116        | 86              | 0            | 110                    | 98                 | 6                 | 5,623          | 6              |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | 46,221 | 28,000 | 0      | 82 / 75                 | 182        | 82              | 8            | 8                      | 93                 | 94                | 6,977          | 5              |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | 32,786 | 28,000 | 0      | 83 / 75                 | 123        | 83              | 8            | 1                      | 86                 | 0                 | 6,818          | 6              |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | 21,567 | 28,000 | 6,433  | 78 / 75                 | 107        | 78              | 0            | 0                      | 0                  | 78                | 696            | 6              |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | 24,759 | 28,000 | 3,241  | 75 / 75                 | 90         | 75              | 0            | 77                     | 0                  | 0                 | 413            | 5              |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | 7,874  | 28,000 | 20,126 | 78 / 75                 | 181        | 78              | 5            | 84                     | 0                  | 0                 | 403            | 7              |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | 14,110 | 28,000 | 13,890 | 78 / 75                 | 5          | 0               | 0            | 78                     | 0                  | 0                 | 785            | 5              |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | 8,405  | 28,000 | 19,595 | 78 / 75                 | 87         | 78              | 0            | 79                     | 0                  | 0                 | 448            | 5              |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | 19,201 | 28,000 | 8,799  | 78 / 75                 | 99         | 78              | 5            | 81                     | 0                  | 0                 | 345            | 6              |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | 6,315  | 28,000 | 21,685 | 80 / 75                 | 84         | 80              | 0            | 0                      | 0                  | 0                 | 361            | 5              |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | 10,966 | 28,000 | 17,034 | 78 / 75                 | 29         | 0               | 0            | 78                     | 0                  | 0                 | 1,204          | 6              |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | 28,205 | 28,000 | 0      | 84 / 75                 | 105        | 84              | 8            | 10                     | 93                 | 103               | 6,779          | 5              |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | 27,234 | 28,000 | 766    | 84 / 75                 | 121        | 84              | 8            | 11                     | 94                 | 0                 | 6,411          | 7              |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | 4,710  | 28,000 | 23,290 | 78 / 75                 | 84         | 0               | 0            | 11                     | 0                  | 0                 | 265            | 6              |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | 8,488  | 28,000 | 19,512 | 78 / 75                 | 2          | 0               | 0            | 78                     | 0                  | 0                 | 1,197          | 5              |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | 30,362 | 28,000 | 0      | 82 / 75                 | 152        | 82              | 8            | 40                     | 118                | 2                 | 8,004          | 5              |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | 13,668 | 28,000 | 14,332 | 80 / 75                 | 1          | 0               | 0            | 82                     | 0                  | 0                 | 227            | 5              |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | 20,410 | 28,000 | 7,590  | 83 / 75                 | 176        | 83              | 0            | 83                     | 0                  | 0                 | 533            | 5              |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | 8,642  | 22,000 | 13,358 | 53 / 45                 | 30         | 25              | 0            | 25                     | 0                  | 0                 | 441            | 7              |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | 37,622 | 28,000 | 0      | 83 / 75                 | 6          | 2               | 0            | 87                     | 0                  | 0                 | 659            | 3              |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | 7,719  | 18,000 | 10,281 | 26 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 586            | 5              |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | 29,436 | 28,000 | 0      | 78 / 75                 | 91         | 78              | 4            | 4                      | 0                  | 86                | 4,057          | 7              |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | 11,993 | 28,000 | 16,007 | 82 / 75                 | 0          | 0               | 0            | 82                     | 0                  | 0                 | 252            | 6              |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | 4,522  | 22,000 | 17,478 | 0 / 45                  | 1          | 0               | 0            | 0                      | 0                  | 0                 | 710            | 5              |

## What the Numbers Say

- **A few courses are close to done.** The size class S courses (11 of 32) need mostly mechanical
  work: `just-enough-bash` has all 108 of its anchors matching, `version-control-and-git` and
  `debugging-and-profiling` are over 46,000 and 78,000 words. What they lack is units, recorded output,
  and some "Why It Matters" blocks.
- **Most gaps are volume.** 21 courses are below their floor by 305,207 words in all; the worst are
  `just-enough-rust` (4,710 words for 78 examples), `just-enough-java` (6,315 words and no code fences),
  `browser-automation-with-cdp` (6,898 words), `just-enough-csharp`, and `just-enough-swift`.
- **Most code lives outside the unit layout.** 1,651 example folders and 70 kata folders exist, and none has a
  `run.yaml`. Four primers (`just-enough-dart`, `just-enough-kotlin`, `just-enough-rust`, and
  `just-enough-swift`) hold their programs only inside lesson fences or in one project, so 86 units each are
  created from scratch.
- **Lessons and files disagree.** 494 anchors do not match their files; 1,368 code
  fences and 792 `Output` blocks are not tied to a file at all.
- **Drilling is thin almost everywhere.** 24 of 32 drilling pages are under 5,000 words; the standard five
  `##` sections are rare.

## Prior Art and Exemplars

- `sql-essentials` (By Example, 80 examples, 51,943 words) and `statistics-for-evaluation` (Annotated Concept,
  46 worked examples, 54,322 words) are the exemplars that the adapter and plan 06 measure against.
- Plan 06 writes 24 accounting courses to the same definition of done and runs them through the same harness;
  its completion test is the model for this plan's.
- Plan 08 sets the CI budget method and the capstone contract; this plan reuses the budget method
  ([004](./004-toolchain-additions-and-ci-cost.md)) and applies the capstone contract to
  `capstone-forge-ready`, which plan 08 does not own.
- Plan 09's filler guard binds five of these courses (`just-enough-cpp`, `just-enough-go`, `just-enough-java`,
  `building-production-cli-tools`, `cicd-and-release-engineering`;
  [007](./007-testing-strategy.md#the-filler-baseline-ratchet)).

## What Is Not in This Plan

- The 4 courses in the table above, and every other pre-existing course (plans 12 and 13).
- Courses that do not exist yet (plan 10's 48 new courses).
- Any new topic, slug, path, or phase.
- `content/id/**`.
