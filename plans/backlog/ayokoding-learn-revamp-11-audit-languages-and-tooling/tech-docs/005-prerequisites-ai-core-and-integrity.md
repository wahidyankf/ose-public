# 005 — Prerequisites, the AI Path Core, and Integrity

Plan 02 revised the `prerequisites` of every course with a written rubric and froze closure rules for the
paths. This plan does not redo that work. It checks, course by course, that the revised list still matches
what the audited lessons teach, makes a change only when the rubric demands it, and keeps every path
integrity test green. One path needs extra care: the AI Engineer path's core is a computed closure, and
three of the 32 courses sit in it.

## Plan 02's Result for the 32 Courses

The prerequisites below are plan 02's revised lists as read on 2026-10-09. Phase 0 compares them with the
merged frontmatter and records any difference before the first course starts.

| Course                                                                                            | Prerequisites after plan 02 (read 2026-10-09)                                               | What plan 02 did                                                                                                                                                                                    | AI Engineer path after plan 08 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | `just-enough-python`, `networking-essentials`                                               | `networking-essentials` is outside this plan and stays. Re-check that the prose still uses WebSocket and HTTP basics from it (T1).                                                                  | extension                      |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | `just-enough-bash`, `version-control-and-git`, `just-enough-typescript`                     | All three are in this plan and are audited before this course (waves 1, 2, and 4).                                                                                                                  | -                              |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | `just-enough-go`, `just-enough-rust`                                                        | Both primers are in this plan and are audited in wave 2, before this course (wave 6).                                                                                                               | -                              |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | `extending-neovim`, `just-enough-nvim`, `just-enough-lua`                                   | Plan 02 keeps `extending-neovim` and adds `just-enough-nvim` and `just-enough-lua` under rule C1 (a capstone requires the courses whose artifacts it integrates).                                   | -                              |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | `software-testing`, `just-enough-python`, `just-enough-bash`                                | Plan 02 adds `just-enough-python` and `just-enough-bash` to the existing `software-testing` edge; all three are in this plan and are audited first.                                                 | -                              |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | `just-enough-lua`, `just-enough-nvim`                                                       | Plan 02 adds `just-enough-nvim` next to `just-enough-lua` (the editor edge is kept under T3 because the course configures Neovim).                                                                  | -                              |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | none                                                                                        | No prerequisites, as before; it is the entry point of the software-engineer paths.                                                                                                                  | -                              |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | `just-enough-bash`, `software-testing`, `backend-essentials`                                | Plan 02 removes `advanced-networking` and adds all three. `just-enough-bash` and `software-testing` are audited in this plan before this course; `backend-essentials` is outside.                   | core                           |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | `just-enough-python`                                                                        | Plan 02 removes `frontend-essentials` and adds `just-enough-python` (the Python medium, rule L1). The TypeScript cross-reference in the prose is a mention only and stays out of the prerequisites. | core                           |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | `just-enough-bash`, `just-enough-python`                                                    | Plan 02 keeps `just-enough-bash` and adds `just-enough-python` (the course reads a small commit hook).                                                                                              | -                              |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | none                                                                                        | Plan 02 removes `just-enough-python`; the course has no prerequisites. Re-check that nothing in the prose now needs Python.                                                                         | assumed                        |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | `just-enough-python`, `just-enough-bash`                                                    | Plan 02 keeps both (the build scripts are shell, the C course is read after a first language, rule L1 and T1).                                                                                      | -                              |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | `just-enough-c`                                                                             | Kept; the hard prerequisite is named in the overview.                                                                                                                                               | -                              |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | `object-oriented-programming-essentials`                                                    | Kept; outside this plan.                                                                                                                                                                            | -                              |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | `object-oriented-programming-essentials`, `just-enough-typescript`                          | Kept; `just-enough-typescript` is audited earlier in this plan (wave 2).                                                                                                                            | -                              |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | `functional-programming`, `just-enough-python`                                              | Kept; `just-enough-python` is audited first (wave 1).                                                                                                                                               | -                              |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | none                                                                                        | No prerequisites, as before.                                                                                                                                                                        | -                              |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | `object-oriented-programming-essentials`                                                    | Kept; outside this plan.                                                                                                                                                                            | -                              |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | none                                                                                        | No prerequisites, as before.                                                                                                                                                                        | -                              |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | `just-enough-nvim`                                                                          | Plan 02 keeps `just-enough-nvim` under T3 (the course uses `vim.*` throughout).                                                                                                                     | -                              |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | none                                                                                        | Plan 02 removes the `capstone-forge-ready` edge; the course has no prerequisites. Remove the recommendation from the overview text.                                                                 | core                           |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | none                                                                                        | No prerequisites, as before.                                                                                                                                                                        | -                              |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | `object-oriented-programming-essentials`, `just-enough-kotlin`                              | Kept; `just-enough-kotlin` is audited first (wave 3).                                                                                                                                               | -                              |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | none                                                                                        | Plan 02 removes `networking-essentials`; the course has no prerequisites.                                                                                                                           | -                              |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | `containers-and-orchestration`, `cloud-and-iac`, `networking-essentials`                    | Kept; `containers-and-orchestration` and `cloud-and-iac` are audited earlier in this plan (waves 7 and 9).                                                                                          | -                              |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | `version-control-and-git`, `containers-and-orchestration`                                   | Kept; both are audited earlier in this plan (waves 4 and 7).                                                                                                                                        | extension                      |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | `just-enough-bash`, `backend-essentials`, `containers-and-orchestration`                    | Kept; `containers-and-orchestration` is audited first (wave 7).                                                                                                                                     | -                              |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | `just-enough-bash`, `backend-essentials`, `sql-essentials`                                  | Kept; the last two are outside this plan.                                                                                                                                                           | extension                      |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`             | Kept; all three are audited earlier in this plan (waves 7 and 9).                                                                                                                                   | -                              |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | `backend-essentials`, `just-enough-bash`                                                    | Kept; `just-enough-bash` is audited first (wave 1).                                                                                                                                                 | -                              |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | `containers-and-orchestration`, `bare-metal-virtualization`, `cicd-and-release-engineering` | Plan 02 removes `distributed-systems` and adds `cicd-and-release-engineering`; all three are audited earlier in this plan (waves 7, 9, and 10).                                                     | -                              |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | `containers-and-orchestration`, `system-design`                                             | Plan 02 removes `backend-at-scale`; `containers-and-orchestration` is audited earlier in this plan (wave 7); `system-design` is outside.                                                            | extension                      |

## Order Inside the Plan

A course is audited after every prerequisite that is also one of the 32. The wave plan in
[006](./006-execution-model.md#waves-in-prerequisite-order) was checked against this table: every in-plan
prerequisite sits in a strictly earlier wave. A reader of a later course can therefore rely on the earlier
course being final, and the maker of the later course reuses its names and does not re-teach it.

| Wave | Course                                                                                            | Prerequisites inside the 32 (audited earlier)                                                                           | Prerequisites outside this plan          |
| ---- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1    | [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | none                                                                                                                    | none                                     |
| 1    | [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | none                                                                                                                    | none                                     |
| 1    | [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | none                                                                                                                    | none                                     |
| 2    | [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | none                                                                                                                    | none                                     |
| 2    | [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | none                                                                                                                    | none                                     |
| 2    | [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | none                                                                                                                    | none                                     |
| 3    | [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | none                                                                                                                    | none                                     |
| 3    | [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | none                                                                                                                    | `object-oriented-programming-essentials` |
| 3    | [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | `just-enough-typescript` (wave 2)                                                                                       | `object-oriented-programming-essentials` |
| 4    | [`software-testing`](../syllabus/courses/software-testing.md)                                     | `just-enough-python` (wave 1)                                                                                           | none                                     |
| 4    | [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | `just-enough-bash` (wave 1), `just-enough-python` (wave 1)                                                              | none                                     |
| 4    | [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | `just-enough-python` (wave 1)                                                                                           | `networking-essentials`                  |
| 5    | [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | `just-enough-python` (wave 1), `just-enough-bash` (wave 1)                                                              | none                                     |
| 5    | [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | `just-enough-python` (wave 1)                                                                                           | `functional-programming`                 |
| 5    | [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | `just-enough-nvim` (wave 2)                                                                                             | none                                     |
| 6    | [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | none                                                                                                                    | `object-oriented-programming-essentials` |
| 6    | [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | `just-enough-kotlin` (wave 3)                                                                                           | `object-oriented-programming-essentials` |
| 6    | [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | `just-enough-go` (wave 1), `just-enough-rust` (wave 2)                                                                  | none                                     |
| 7    | [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | `just-enough-bash` (wave 1)                                                                                             | `backend-essentials`, `sql-essentials`   |
| 7    | [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | `just-enough-bash` (wave 1)                                                                                             | `backend-essentials`                     |
| 7    | [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | `just-enough-c` (wave 5)                                                                                                | none                                     |
| 8    | [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | `software-testing` (wave 4), `just-enough-python` (wave 1), `just-enough-bash` (wave 1)                                 | none                                     |
| 8    | [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | `just-enough-lua` (wave 5), `just-enough-nvim` (wave 2)                                                                 | none                                     |
| 8    | [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | `containers-and-orchestration` (wave 7)                                                                                 | `system-design`                          |
| 9    | [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | `just-enough-bash` (wave 1), `version-control-and-git` (wave 4), `just-enough-typescript` (wave 2)                      | none                                     |
| 9    | [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | `version-control-and-git` (wave 4), `containers-and-orchestration` (wave 7)                                             | none                                     |
| 9    | [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | `just-enough-bash` (wave 1), `containers-and-orchestration` (wave 7)                                                    | `backend-essentials`                     |
| 10   | [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | `containers-and-orchestration` (wave 7), `cloud-and-iac` (wave 9)                                                       | `networking-essentials`                  |
| 10   | [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | `extending-neovim` (wave 8), `just-enough-nvim` (wave 2), `just-enough-lua` (wave 5)                                    | none                                     |
| 10   | [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | `just-enough-bash` (wave 1), `software-testing` (wave 4)                                                                | `backend-essentials`                     |
| 11   | [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | `containers-and-orchestration` (wave 7), `cloud-and-iac` (wave 9), `cicd-and-release-engineering` (wave 9)              | none                                     |
| 11   | [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | `containers-and-orchestration` (wave 7), `bare-metal-virtualization` (wave 10), `cicd-and-release-engineering` (wave 9) | none                                     |

## The Re-Check at the Start of Each Course

CP-1 of every course includes a prerequisite re-check. The maker or fixer reads the course overview's
"Prerequisites" section, the first ten examples, and the capstone brief, and compares them with the
frontmatter list. The tests are plan 02's rubric, unchanged:

| Test | Meaning here                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| T1   | The course uses a concept, skill, or artifact that the prerequisite teaches and does not re-teach it                             |
| T2   | The course's own prose does not mark the prerequisite as optional ("helps", "recommended", "companion")                          |
| T3   | Editor edges (Neovim) stay only where the course uses the tool: `just-enough-lua` uses `vim.*`, `extending-neovim` configures it |
| T4   | Adjacency in an old manifest is never a reason                                                                                   |
| L1   | A language primer is a prerequisite when that language is the course's primary code medium                                       |
| C1   | A capstone requires the courses whose artifacts it integrates, as its overview names them                                        |

An edge is **added** only if T1 or L1 or C1 shows a missing one; an edge is **removed** only if it fails T1
or T2 and the prose proves it. Because this plan rewrites prose, the re-check is also the moment the audit
could create a new dependency by accident (for example, a rewritten lesson that now uses Python). The
re-check runs again at CP-4's end, after the last text change, and the ledger records "unchanged" or the
edit.

**Who edits.** Makers and fixers never edit any `_index.md` frontmatter. The coordinator edits a course's
`prerequisites` and `estimatedHours` in the CP-6 commit, with the integrity tests below run first.

## The Integrity Tests That Must Stay Green

Every prerequisite edit runs these tests before the course commit, with `UNIT-NODE` on each file:

| Test file (under `apps/ayokoding-www/`)                                               | What it proves                                                                                                                     |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts`        | Plan 02's rules R1 to R10 over the real manifests (resolve, unique, closure, no outline in core, goals, exact `assumes`, ordering) |
| `tests/unit/features/course-paths/manifests/manifest-membership.unit.test.ts`         | Each path's course set equals the frozen set in `legacy-membership.ts`; this plan changes no membership                            |
| `tests/unit/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts` | The AI path's core, `assumes`, and phase names (plan 08)                                                                           |
| `tests/unit/features/course-paths/manifests/careers/career-goals.unit.test.ts`        | Every career path declares a goal                                                                                                  |
| `tests/unit/features/content/course-frontmatter.unit.test.ts` (plan 02)               | Every course's frontmatter validates, with `prerequisites` resolving to courses                                                    |
| `tests/unit/be-steps/course-metadata.steps.ts` (plan 03)                              | The metadata scenarios and the real-corpus drift guard for `estimatedHours`                                                        |

Phase 0 records the merged names of these files (plan 08's handoff table says names may differ slightly as
merged). This plan changes no path manifest, no phase, no `assumes`, and no membership, except through the
AI rule below.

## `estimatedHours`

Plan 03 derives `estimatedHours` from the course's size, with the formula
`max(1, round((proseWords / 200 + max(inlineCodeLines, codeFileLines) / 10) / 60))`, and a drift test that
prints "Expected estimatedHours for every non-outline course". This plan changes words and code lines in
every one of the 32 courses, so every value changes. The coordinator recomputes it after the **last** edit
of each course (CP-6), reading the expected value from the drift test, never by hand. A course whose value
changes is not a reason to touch a manifest: the catalog and the path pages read the frontmatter value.

## The AI Engineer Path Core

After plan 08, the Immediately Effective AI Engineer path has one goal, `capstone-build-your-own-coding-agent`,
and its core is exactly the goal plus its transitive prerequisites, stopping at the courses the path
assumes (series decisions 7 and 9). The core has 12 courses; four are assumed (`api-design`,
`backend-essentials`, `just-enough-bash`, `sql-essentials`); sixteen more are extension courses. Eight of
the 32 courses of this plan are on the path:

| Core position | Course                                                                                    | Role in the AI Engineer path | Prerequisites after plan 02                                  |
| ------------- | ----------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| 1             | [`just-enough-python`](../syllabus/courses/just-enough-python.md)                         | core                         | none                                                         |
| 3             | [`software-testing`](../syllabus/courses/software-testing.md)                             | core                         | `just-enough-python`                                         |
| 4             | [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md) | core                         | `just-enough-bash`, `software-testing`, `backend-essentials` |
| -             | [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                             | assumed                      | none                                                         |
| -             | [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)     | extension                    | `just-enough-bash`, `backend-essentials`, `sql-essentials`   |
| -             | [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)     | extension                    | `version-control-and-git`, `containers-and-orchestration`    |
| -             | [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)     | extension                    | `containers-and-orchestration`, `system-design`              |
| -             | [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)       | extension                    | `just-enough-python`, `networking-essentials`                |

The core positions are plan 08's closure table (position 1 `just-enough-python`, 3 `software-testing`, 4
`software-engineering-practices`). The prerequisites of the three core courses above equal that table
today, so the expected result of CP-1 for them is **no change**.

**Rule AI-1 (decision D15).** A prerequisite change on any of the three core courses, or on a course that
one of them requires, is made only if both hold:

1. The rubric requires it (T1, L1, or C1 with prose evidence).
2. After the edit, `path-model-integrity.unit.test.ts` (R4, R6, R7, R10) and
   `careers-ai-manifest.unit.test.ts` still pass with the current AI manifest.

If condition 2 fails, the closure would change, which changes the product (the core's size and the path's
phases). The coordinator does not make the edit and does not decide; it records a `needs-decision` row in the
ledger with the evidence, continues with the course on its present list, and raises the row at the next
checkpoint push. The user may then choose to update the AI manifest in the same PR (the manifest's phases and
`assumes`, `careers-ai-manifest.unit.test.ts`, and the path page copy, following plan 08's recomputation:
RED on R6 printing the expected core, reconcile, GREEN) or to keep the edge. Courses that are extension
courses or outside the AI path (`containers-and-orchestration`, `cicd-and-release-engineering`,
`site-reliability-engineering`, `browser-automation-with-cdp`) need only the generic tests above.

**Why not change the AI manifest eagerly.** Plan 08 shrank the core from 25 to 12 courses on purpose and
flagged it to the user. A second, silent change to the core in an audit PR would be the wrong place for it.

## What This Plan Does Not Change

- No path manifest, phase, outcome, `goals`, or membership. If an audit finds that a course belongs in a
  different path, that is recorded in the ledger as a follow-up and not acted on.
- No course slug, title, category, or weight.
- Nothing under `content/id/**`.

The per-course baseline path membership (positions and lengths at 2026-10-09) is in
[../syllabus/paths/README.md](../syllabus/paths/README.md).
