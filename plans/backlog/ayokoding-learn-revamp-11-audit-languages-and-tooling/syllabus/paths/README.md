# Syllabus Paths — No Manifest Changes

This plan changes no path manifest, no phase, no `assumes`, no `goals`, and no path membership or order. The
32 courses stay where plans 02 to 08 left them. This note exists so that the corpus has a complete account of
paths (an empty folder would hide the decision) and so that an executor can see where each course sits.

## Baseline Membership

Positions are the flattened positions at the 2026-10-09 baseline, read from the manifests under
`apps/ayokoding-www/src/features/course-paths/manifests/`. Plans 02 to 08 change phases and, for the AI path,
the core; Phase 0 re-reads the merged manifests and records any difference. The courses of this plan are on
many paths, mostly the three software-engineer paths.

| Course                                                                                   | Paths at baseline (position / length)                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`browser-automation-with-cdp`](../courses/browser-automation-with-cdp.md)               | `careers/fundamentally-strong/software-engineer` (51/121); `careers/immediately-effective/ai-engineer` (15/26); `careers/immediately-effective/software-engineer` (50/114); `careers/interview-ready/software-engineer` (47/116)    |
| [`build-automation-and-task-runners`](../courses/build-automation-and-task-runners.md)   | `careers/fundamentally-strong/software-engineer` (44/121); `careers/immediately-effective/software-engineer` (43/114); `careers/interview-ready/software-engineer` (37/116)                                                         |
| [`building-production-cli-tools`](../courses/building-production-cli-tools.md)           | `careers/fundamentally-strong/software-engineer` (25/121); `careers/immediately-effective/software-engineer` (24/114); `careers/interview-ready/software-engineer` (22/116)                                                         |
| [`capstone-forge-ready`](../courses/capstone-forge-ready.md)                             | `careers/fundamentally-strong/software-engineer` (4/121); `careers/immediately-effective/software-engineer` (4/114); `careers/interview-ready/software-engineer` (4/116)                                                            |
| [`debugging-and-profiling`](../courses/debugging-and-profiling.md)                       | `careers/fundamentally-strong/software-engineer` (52/121); `careers/immediately-effective/software-engineer` (51/114); `careers/interview-ready/software-engineer` (50/116)                                                         |
| [`extending-neovim`](../courses/extending-neovim.md)                                     | `careers/fundamentally-strong/software-engineer` (3/121); `careers/immediately-effective/software-engineer` (3/114); `careers/interview-ready/software-engineer` (3/116)                                                            |
| [`just-enough-nvim`](../courses/just-enough-nvim.md)                                     | `careers/fundamentally-strong/software-engineer` (1/121); `careers/immediately-effective/software-engineer` (1/114); `careers/interview-ready/software-engineer` (1/116)                                                            |
| [`software-engineering-practices`](../courses/software-engineering-practices.md)         | `careers/fundamentally-strong/software-engineer` (108/121); `careers/immediately-effective/software-engineer` (106/114); `careers/interview-ready/software-engineer` (88/116)                                                       |
| [`software-testing`](../courses/software-testing.md)                                     | `careers/fundamentally-strong/software-engineer` (37/121); `careers/immediately-effective/ai-engineer` (5/26); `careers/immediately-effective/software-engineer` (31/114); `careers/interview-ready/software-engineer` (30/116)     |
| [`version-control-and-git`](../courses/version-control-and-git.md)                       | `careers/fundamentally-strong/software-engineer` (7/121); `careers/immediately-effective/software-engineer` (7/114); `careers/interview-ready/software-engineer` (7/116)                                                            |
| [`just-enough-bash`](../courses/just-enough-bash.md)                                     | `careers/fundamentally-strong/software-engineer` (6/121); `careers/immediately-effective/software-engineer` (6/114); `careers/interview-ready/software-engineer` (6/116)                                                            |
| [`just-enough-c`](../courses/just-enough-c.md)                                           | `careers/fundamentally-strong/software-engineer` (8/121); `careers/immediately-effective/software-engineer` (10/114); `careers/interview-ready/software-engineer` (11/116)                                                          |
| [`just-enough-cpp`](../courses/just-enough-cpp.md)                                       | `careers/fundamentally-strong/software-engineer` (18/121); `careers/immediately-effective/software-engineer` (12/114); `careers/interview-ready/software-engineer` (12/116)                                                         |
| [`just-enough-csharp`](../courses/just-enough-csharp.md)                                 | `careers/fundamentally-strong/software-engineer` (22/121); `careers/immediately-effective/software-engineer` (21/114)                                                                                                               |
| [`just-enough-dart`](../courses/just-enough-dart.md)                                     | `careers/fundamentally-strong/software-engineer` (49/121); `careers/immediately-effective/software-engineer` (48/114); `careers/interview-ready/software-engineer` (45/116)                                                         |
| [`just-enough-elixir`](../courses/just-enough-elixir.md)                                 | `careers/fundamentally-strong/software-engineer` (84/121); `careers/immediately-effective/software-engineer` (83/114); `careers/interview-ready/software-engineer` (68/116)                                                         |
| [`just-enough-go`](../courses/just-enough-go.md)                                         | `careers/fundamentally-strong/software-engineer` (11/121); `careers/immediately-effective/software-engineer` (11/114); `careers/interview-ready/software-engineer` (17/116)                                                         |
| [`just-enough-java`](../courses/just-enough-java.md)                                     | `careers/fundamentally-strong/software-engineer` (13/121); `careers/immediately-effective/software-engineer` (17/114); `careers/interview-ready/software-engineer` (18/116)                                                         |
| [`just-enough-kotlin`](../courses/just-enough-kotlin.md)                                 | `careers/fundamentally-strong/software-engineer` (20/121); `careers/immediately-effective/software-engineer` (19/114); `careers/interview-ready/software-engineer` (20/116)                                                         |
| [`just-enough-lua`](../courses/just-enough-lua.md)                                       | `careers/fundamentally-strong/software-engineer` (2/121); `careers/immediately-effective/software-engineer` (2/114); `careers/interview-ready/software-engineer` (2/116)                                                            |
| [`just-enough-python`](../courses/just-enough-python.md)                                 | `careers/fundamentally-strong/software-engineer` (5/121); `careers/immediately-effective/ai-engineer` (1/26); `careers/immediately-effective/software-engineer` (5/114); `careers/interview-ready/software-engineer` (5/116)        |
| [`just-enough-rust`](../courses/just-enough-rust.md)                                     | `careers/fundamentally-strong/software-engineer` (12/121); `careers/immediately-effective/software-engineer` (15/114); `careers/interview-ready/software-engineer` (15/116)                                                         |
| [`just-enough-swift`](../courses/just-enough-swift.md)                                   | `careers/fundamentally-strong/software-engineer` (21/121); `careers/immediately-effective/software-engineer` (20/114); `careers/interview-ready/software-engineer` (21/116)                                                         |
| [`just-enough-typescript`](../courses/just-enough-typescript.md)                         | `careers/fundamentally-strong/software-engineer` (33/121); `careers/immediately-effective/software-engineer` (29/114); `careers/interview-ready/software-engineer` (28/116)                                                         |
| [`bare-metal-virtualization`](../courses/bare-metal-virtualization.md)                   | `careers/fundamentally-strong/software-engineer` (45/121); `careers/immediately-effective/software-engineer` (44/114); `careers/interview-ready/software-engineer` (48/116)                                                         |
| [`cicd-and-release-engineering`](../courses/cicd-and-release-engineering.md)             | `careers/fundamentally-strong/software-engineer` (43/121); `careers/immediately-effective/ai-engineer` (9/26); `careers/immediately-effective/software-engineer` (36/114); `careers/interview-ready/software-engineer` (36/116)     |
| [`cloud-and-iac`](../courses/cloud-and-iac.md)                                           | `careers/fundamentally-strong/software-engineer` (42/121); `careers/immediately-effective/software-engineer` (37/114); `careers/interview-ready/software-engineer` (35/116)                                                         |
| [`containers-and-orchestration`](../courses/containers-and-orchestration.md)             | `careers/fundamentally-strong/software-engineer` (41/121); `careers/immediately-effective/ai-engineer` (6/26); `careers/immediately-effective/software-engineer` (35/114); `careers/interview-ready/software-engineer` (34/116)     |
| [`platform-engineering-and-devex`](../courses/platform-engineering-and-devex.md)         | `careers/fundamentally-strong/software-engineer` (46/121); `careers/immediately-effective/software-engineer` (45/114); `careers/interview-ready/software-engineer` (49/116)                                                         |
| [`self-hosting-essentials`](../courses/self-hosting-essentials.md)                       | `careers/fundamentally-strong/software-engineer` (40/121); `careers/immediately-effective/software-engineer` (34/114); `careers/interview-ready/software-engineer` (33/116)                                                         |
| [`self-managed-kubernetes-and-gitops`](../courses/self-managed-kubernetes-and-gitops.md) | `careers/fundamentally-strong/software-engineer` (105/121); `careers/immediately-effective/software-engineer` (103/114); `careers/interview-ready/software-engineer` (107/116)                                                      |
| [`site-reliability-engineering`](../courses/site-reliability-engineering.md)             | `careers/fundamentally-strong/software-engineer` (106/121); `careers/immediately-effective/ai-engineer` (10/26); `careers/immediately-effective/software-engineer` (104/114); `careers/interview-ready/software-engineer` (108/116) |

## The One Exception: the AI Engineer Path

After plan 08 the Immediately Effective AI Engineer path has the goal `capstone-build-your-own-coding-agent`
and a core of 12 courses that equals the goal's prerequisite closure. Three courses of this plan are in that
core, one is assumed, and four are extension courses:

| Core position | Course                                                                           | Role in the AI Engineer path | Prerequisites after plan 02                                  |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| 1             | [`just-enough-python`](../courses/just-enough-python.md)                         | core                         | none                                                         |
| 3             | [`software-testing`](../courses/software-testing.md)                             | core                         | `just-enough-python`                                         |
| 4             | [`software-engineering-practices`](../courses/software-engineering-practices.md) | core                         | `just-enough-bash`, `software-testing`, `backend-essentials` |
| -             | [`just-enough-bash`](../courses/just-enough-bash.md)                             | assumed                      | none                                                         |
| -             | [`containers-and-orchestration`](../courses/containers-and-orchestration.md)     | extension                    | `just-enough-bash`, `backend-essentials`, `sql-essentials`   |
| -             | [`cicd-and-release-engineering`](../courses/cicd-and-release-engineering.md)     | extension                    | `version-control-and-git`, `containers-and-orchestration`    |
| -             | [`site-reliability-engineering`](../courses/site-reliability-engineering.md)     | extension                    | `containers-and-orchestration`, `system-design`              |
| -             | [`browser-automation-with-cdp`](../courses/browser-automation-with-cdp.md)       | extension                    | `just-enough-python`, `networking-essentials`                |

The rule, in full in [tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md#the-ai-engineer-path-core):

- The expected result of every CP-1 for these courses is that `prerequisites` are unchanged.
- A prerequisite change on a core course, or on a course a core course requires, is made only if the rubric
  requires it and the integrity tests (R4, R6, R7, R10) and the AI manifest test still pass.
- If the change would alter the closure, it is not made. The coordinator records a `needs-decision` row and
  raises it at the next checkpoint push, and the user chooses between updating the AI manifest in the same PR
  (plan 08's recomputation: RED on R6, reconcile, GREEN) and keeping the edge.

## Differences From Plan 02's and Plan 08's Specifications

None known at authoring time. If Phase 0 finds a difference between the merged manifests or frontmatter and the
facts in [tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md), the executor lists it
here (for example, a merged `prerequisites` list that differs from the table) and corrects 005 and the affected
briefs in the same branch.
