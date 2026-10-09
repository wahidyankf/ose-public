# 004 — Path Composition

This document gives the exact target content of the 4 career manifests, which this plan applies, and
the drafted phases of the 4 skills manifests, which this plan does **not** apply (decision 39; see
[Skills Paths](#skills-paths-drafted-input-for-plans-06-and-07-not-applied-here)). The authoring session computed
and validated the numbers against the revised prerequisites in
[003](./003-prerequisite-rubric-and-evidence.md). Execution re-verifies them through the unit tests
in [005](./005-integrity-validation-and-testing.md); it never re-runs an ad-hoc script.

## How a Core Is Computed

1. **Pick the goals** (decision 11, plus decision 5 for Immediately-Effective):
   - Interview-Ready SE: `capstone-interview-loop`.
   - Immediately-Effective SE: `capstone-full-stack-app` **and** `capstone-forge-ready`. Decision 5
     makes the Neovim trio + `capstone-forge-ready` core in this arc only. No conceptual edge links
     the full-stack capstone to the editor capstone, so the editor capstone is declared as a second
     goal rather than invented as a prerequisite.
     [007 D5](./007-decision-records.md#d5--core--goals--prerequisite-closure-ie-uses-two-goals)
     records the alternatives.
   - Fundamentally-Strong SE: `capstone-solid-core`.
   - AI Engineer declares no goals; see the notes below. The 4 skills manifests carry the
     restructure marker in this plan, so they have no core of their own yet.
2. **Take the closure.** Core = the goals plus every transitive prerequisite, stopping at any course
   listed in `assumes`. For the three SE paths `assumes` is empty, so the closure is complete.
3. **Order the core.** Inside the core, every course comes after all of its prerequisites. Courses
   are then grouped into thematic phases (decision 12). Where several orders are valid, the old
   manifest order breaks the tie.
4. **Place the rest.** Every other course of the old manifest goes into a thematic extension phase
   (decision 13). Extension phases also respect prerequisite order across the whole path, because
   `checkPrerequisiteConsistency` still checks the full flattened order.

### Recomputing a Core

The only supported way to recompute a core is the tested TypeScript function, never a one-off
script:

```ts
// apps/ayokoding-www/src/features/course-paths/core/path-core.ts
export function computeCore(
  goals: readonly string[],
  prerequisitesByCourse: PrerequisitesByCourse,
  assumes: readonly string[] = [],
): ReadonlySet<string>;
```

`checkPathModelIntegrity` calls `computeCore` and reports `coreMismatch: {missing, extra}`. The
real-manifest unit test in
`tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts` prints both lists when
a core drifts. To recompute after editing a course's prerequisites:

1. Run `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:unit`.
2. Read the `missing` and `extra` lists in the failure message for each affected manifest.
3. Move each `missing` course into a core phase after its prerequisites, and each `extra` course into
   an extension phase. Re-run until green.

A maintainer-friendly `ayokoding-cli paths core` subcommand that wraps the same function may follow.
It is owned by plan 05.

## Thematic Extension Phases (shared by the three SE paths)

The three SE paths share one list of extension themes, so the same course sits under the same theme
title in every arc. Each path keeps only the themes that still hold courses after its core is
removed. Theme order respects every cross-theme prerequisite.

| Order | Phase ID                               | Title                                      |
| ----- | -------------------------------------- | ------------------------------------------ |
| 1     | `editor-and-shell`                     | Editor and shell workflow                  |
| 2     | `programming-fundamentals`             | Programming fundamentals                   |
| 3     | `more-languages`                       | More programming languages                 |
| 4     | `systems-and-tooling`                  | Operating systems and developer tooling    |
| 5     | `apps-and-interfaces`                  | Web, mobile, and desktop apps              |
| 6     | `backend-depth`                        | Backend depth                              |
| 7     | `data-and-databases`                   | Data and databases                         |
| 8     | `infrastructure-and-operations`        | Networking, infrastructure, and operations |
| 9     | `more-computer-science`                | More computer science                      |
| 10    | `architecture-and-distributed-systems` | Architecture and distributed systems       |
| 11    | `security`                             | Security                                   |
| 12    | `more-practice-and-leadership`         | More engineering practice and leadership   |
| 13    | `ai-and-agents`                        | AI apps and agents                         |
| 14    | `interview-preparation`                | Interview preparation                      |
| 15    | `integrative-capstones`                | Integrative capstones                      |

## Notes Per Path

- **Consequences of a goal-driven core.** Git and Bash are not in the Immediately-Effective core,
  because no course on the way to `capstone-full-stack-app` needs them. They sit first in that path's
  extensions ("Editor and shell workflow"). The Interview-Ready core no longer starts with Neovim.
- **AI Engineer.** Decision 7 names goals only for the three SE arcs, and the AI path's natural goal,
  `capstone-build-your-own-coding-agent`, is an outline, which decision 6 forbids in a core. So the AI
  path declares no goals: every complete course is core (25), and the outline capstone sits alone in
  an extension phase until plan 08 completes it. The closure rule still applies and yields 11
  `assumes`. (The old graph had 18 prerequisite edges leaving the path; the revised graph leaves 11
  distinct assumed courses for the core.)
- **Skills paths (decision 39).** Every skills course is an outline today, so a skills core would
  break decision 6. The user decided that each skills path is restructured in the same PR that fills
  its courses: plan 06 for accounting, plan 07 for ERP. In this plan the 4 skills manifests get only
  the mechanical shape in
  [002](./002-manifest-schema-and-migration.md#skills-paths-pending-restructure): one `all-courses`
  phase with today's order, `assumes: []`, no goals, and the `restructurePendingIn` marker.
- **Old order inside phases.** Courses inside each phase keep their old relative order wherever the
  prerequisites allow it, which keeps the diff reviewable.

## Target Manifests

The exact JSON body of each career manifest is in [syllabus/paths/](../syllabus/paths/README.md);
its `pathId`, `arc`, and `title` do not change. The tables below are the same data in reading form.

### `careers/interview-ready/software-engineer`

- **Description:** For engineers returning to the job market: a focused core that ends in a full mock interview loop, then optional depth.
- **Goals:** `capstone-interview-loop`
- **Assumes:** none
- **Courses:** 116 total; 13 core; 103 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-and-command-line`         | Programming and the command line           | core      | 1–3       | `just-enough-python`, `just-enough-bash`, `version-control-and-git`                                                                                                                                                                                                                                                                                                              |
| `algorithms-and-backend-basics`        | Data structures and backend basics         | core      | 4–7       | `data-structures-and-algorithms-essentials`, `sql-essentials`, `backend-essentials`, `networking-essentials`                                                                                                                                                                                                                                                                     |
| `interview-skills`                     | Interview skills                           | core      | 8–12      | `advanced-algorithms`, `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews`                                                                                                                                                                                                                                        |
| `interview-capstone`                   | Interview capstone                         | core      | 13        | `capstone-interview-loop`                                                                                                                                                                                                                                                                                                                                                        |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 14–17     | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`                                                                                                                                                                                                                                                                                                |
| `programming-fundamentals`             | Programming fundamentals                   | extension | 18–20     | `object-oriented-programming-essentials`, `just-enough-typescript`, `software-testing`                                                                                                                                                                                                                                                                                           |
| `more-languages`                       | More programming languages                 | extension | 21–28     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-dart`                                                                                                                                                                                                                      |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 29–35     | `linux-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                                                                                                             |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 36–44     | `frontend-essentials`, `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `browser-automation-with-cdp`                                                                                                                         |
| `backend-depth`                        | Backend depth                              | extension | 45–49     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `security-essentials`, `backend-at-scale`                                                                                                                                                                                                                                                     |
| `data-and-databases`                   | Data and databases                         | extension | 50–58     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                                                           |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 59–66     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                                                                                           |
| `more-computer-science`                | More computer science                      | extension | 67–79     | `computer-science-foundations`, `computer-architecture`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline) |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 80–88     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                                                                                         |
| `security`                             | Security                                   | extension | 89–95     | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                                                                                      |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 96–101    | `project-management`, `technical-communication`, `software-engineering-practices`, `agentic-coding`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                                                    |
| `ai-and-agents`                        | AI apps and agents                         | extension | 102–110   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline)                                                                       |
| `integrative-capstones`                | Integrative capstones                      | extension | 111–116   | `capstone-first-working-software`, `capstone-full-stack-app`, `capstone-data-pipeline` (outline), `capstone-solid-core`, `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                                         |

| Core phase                      | After this phase you can …                                                                                       | You cannot yet …                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `programming-and-command-line`  | write and run small Python scripts, use the shell, and keep your work in Git                                     | solve algorithm problems under interview time pressure                  |
| `algorithms-and-backend-basics` | use core data structures, query a database with SQL, and explain how a web request reaches a backend             | work through a timed coding or system-design interview                  |
| `interview-skills`              | solve coding problems aloud, deliver a take-home, sketch a system design, and tell clear stories about your work | run a full interview loop end to end                                    |
| `interview-capstone`            | complete a realistic interview loop and know which areas to practise next                                        | operate production systems at scale; the optional extensions cover that |

### `careers/immediately-effective/software-engineer`

- **Description:** For new engineers who want to ship: set up your editor, then build a tested full-stack app; deeper topics are optional.
- **Goals:** `capstone-forge-ready`, `capstone-full-stack-app`
- **Assumes:** none
- **Courses:** 114 total; 13 core; 101 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `your-editor`                          | Set up your editor                         | core      | 1–4       | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`                                                                                                                                                                                                                                                                                                                       |
| `python-and-backend`                   | Python, data, and the backend              | core      | 5–8       | `just-enough-python`, `sql-essentials`, `backend-essentials`, `networking-essentials`                                                                                                                                                                                                                                                                                                                   |
| `frontend-and-quality`                 | Frontend, testing, and security            | core      | 9–12      | `just-enough-typescript`, `frontend-essentials`, `software-testing`, `security-essentials`                                                                                                                                                                                                                                                                                                              |
| `full-stack-capstone`                  | Full-stack capstone                        | core      | 13        | `capstone-full-stack-app`                                                                                                                                                                                                                                                                                                                                                                               |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 14–15     | `just-enough-bash`, `version-control-and-git`                                                                                                                                                                                                                                                                                                                                                           |
| `programming-fundamentals`             | Programming fundamentals                   | extension | 16–17     | `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`                                                                                                                                                                                                                                                                                                                   |
| `more-languages`                       | More programming languages                 | extension | 18–26     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-csharp`, `just-enough-dart`                                                                                                                                                                                                                       |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 27–33     | `linux-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                                                                                                                                    |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 34–43     | `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `windows-app-development`, `linux-app-development`, `browser-automation-with-cdp`                                                                                                                   |
| `backend-depth`                        | Backend depth                              | extension | 44–47     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `backend-at-scale`                                                                                                                                                                                                                                                                                                   |
| `data-and-databases`                   | Data and databases                         | extension | 48–56     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                                                                                  |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 57–64     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                                                                                                                  |
| `more-computer-science`                | More computer science                      | extension | 65–78     | `computer-science-foundations`, `computer-architecture`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline) |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 79–87     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                                                                                                                |
| `security`                             | Security                                   | extension | 88–94     | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                                                                                                             |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 95–100    | `project-management`, `technical-communication`, `software-engineering-practices`, `agentic-coding`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                                                                           |
| `ai-and-agents`                        | AI apps and agents                         | extension | 101–109   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline)                                                                                              |
| `integrative-capstones`                | Integrative capstones                      | extension | 110–114   | `capstone-first-working-software`, `capstone-data-pipeline` (outline), `capstone-solid-core`, `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                                                                                           |

| Core phase             | After this phase you can …                                                                | You cannot yet …                                           |
| ---------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `your-editor`          | edit code quickly in Neovim and shape it with your own Lua configuration                  | build a program                                            |
| `python-and-backend`   | write Python, store data with SQL, and serve a small JSON API                             | build the browser side of an app                           |
| `frontend-and-quality` | build a typed browser UI, test both sides of an app, and apply baseline security controls | ship a complete full-stack app                             |
| `full-stack-capstone`  | ship a tested, secured full-stack app from database to browser                            | design for large scale; the optional extensions cover that |

### `careers/fundamentally-strong/software-engineer`

- **Description:** For engineers who want strong fundamentals: from first programs through computer science depth to a solid-core capstone.
- **Goals:** `capstone-solid-core`
- **Assumes:** none
- **Courses:** 121 total; 24 core; 97 extension

| Phase ID                               | Title                                      | Kind      | Positions | Courses in order                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------ | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-foundations`              | Programming foundations                    | core      | 1–4       | `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`                                                                                                                                                                            |
| `first-working-software`               | Building working software                  | core      | 5–12      | `sql-essentials`, `backend-essentials`, `networking-essentials`, `just-enough-typescript`, `frontend-essentials`, `software-testing`, `security-essentials`, `capstone-first-working-software`                                                                                                             |
| `computer-science-depth`               | Computer science depth                     | core      | 13–19     | `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance`                                                                                       |
| `practice-and-leadership`              | Engineering practice and leadership        | core      | 20–23     | `project-management`, `software-engineering-practices`, `software-product-engineering`, `engineering-management`                                                                                                                                                                                           |
| `solid-core-capstone`                  | Solid-core capstone                        | core      | 24        | `capstone-solid-core`                                                                                                                                                                                                                                                                                      |
| `editor-and-shell`                     | Editor and shell workflow                  | extension | 25–29     | `just-enough-nvim`, `just-enough-lua`, `extending-neovim`, `capstone-forge-ready`, `version-control-and-git`                                                                                                                                                                                               |
| `more-languages`                       | More programming languages                 | extension | 30–38     | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `just-enough-rust`, `just-enough-java`, `just-enough-kotlin`, `just-enough-swift`, `just-enough-csharp`, `just-enough-dart`                                                                                                                          |
| `systems-and-tooling`                  | Operating systems and developer tooling    | extension | 39–46     | `linux-os`, `windows-os`, `system-programming`, `modern-system-programming`, `build-your-own-git`, `building-production-cli-tools`, `build-automation-and-task-runners`, `debugging-and-profiling`                                                                                                         |
| `apps-and-interfaces`                  | Web, mobile, and desktop apps              | extension | 47–56     | `advanced-frontend`, `build-your-own-reactive-ui`, `information-architecture-and-seo`, `analytics-and-experimentation`, `android-app-development`, `ios-app-development`, `hybrid-app-development`, `windows-app-development`, `linux-app-development`, `browser-automation-with-cdp`                      |
| `backend-depth`                        | Backend depth                              | extension | 57–60     | `async-python-and-fastapi-services`, `api-design`, `build-your-own-web-framework`, `backend-at-scale`                                                                                                                                                                                                      |
| `data-and-databases`                   | Data and databases                         | extension | 61–68     | `nosql-databases`, `graph-databases`, `search-and-information-retrieval`, `data-access-orms-and-query-builders`, `build-your-own-orm-and-query-builder`, `database-internals-and-storage-engines`, `build-your-own-database`, `data-engineering`                                                           |
| `infrastructure-and-operations`        | Networking, infrastructure, and operations | extension | 69–76     | `advanced-networking`, `self-hosting-essentials`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `bare-metal-virtualization`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`                                                                     |
| `more-computer-science`                | More computer science                      | extension | 77–85     | `computer-architecture`, `csp-style-concurrency`, `just-enough-elixir`, `actor-model-concurrency`, `lisp`, `just-enough-fsharp`, `type-systems`, `compilers-parsers-and-transpilers`, `capstone-concurrency-showdown` (outline)                                                                            |
| `architecture-and-distributed-systems` | Architecture and distributed systems       | extension | 86–94     | `software-architecture`, `enterprise-java-and-the-jvm`, `domain-driven-design`, `event-driven-architecture`, `system-design`, `distributed-systems`, `build-your-own-raft`, `site-reliability-engineering`, `capstone-concurrency-and-systems` (outline)                                                   |
| `security`                             | Security                                   | extension | 95–101    | `it-and-application-security`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `it-governance-grc`, `capstone-secure-service` (outline)                                                                                |
| `more-practice-and-leadership`         | More engineering practice and leadership   | extension | 102–103   | `technical-communication`, `agentic-coding`                                                                                                                                                                                                                                                                |
| `ai-and-agents`                        | AI apps and agents                         | extension | 104–112   | `creating-ai-powered-apps`, `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `capstone-build-your-own-coding-agent` (outline), `capstone-build-your-own-pentest-engine` (outline) |
| `interview-preparation`                | Interview preparation                      | extension | 113–117   | `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews`, `capstone-interview-loop`                                                                                                                                                              |
| `integrative-capstones`                | Integrative capstones                      | extension | 118–121   | `capstone-full-stack-app`, `capstone-data-pipeline` (outline), `capstone-real-world-delivery` (outline), `capstone-lead-at-altitude` (outline)                                                                                                                                                             |

| Core phase                | After this phase you can …                                                                                    | You cannot yet …                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `programming-foundations` | write Python and shell scripts, choose suitable data structures, and model code with classes                  | build software that stores data or serves users   |
| `first-working-software`  | build, test, and secure a small working app with a database, an API, and a UI                                 | explain the theory underneath the code you wrote  |
| `computer-science-depth`  | reason about computation, design patterns, paradigms, concurrency, advanced algorithms, and query performance | lead how a team plans, builds, and ships software |
| `practice-and-leadership` | plan delivery, run review and release practices, make product trade-offs, and support a team                  | show all of this in one integrated project        |
| `solid-core-capstone`     | prove your fundamentals in one integrated project                                                             | specialise; pick an optional extension for that   |

### `careers/immediately-effective/ai-engineer`

- **Description:** For developers who already code: build, evaluate, deploy, and operate AI systems.
- **Goals:** none (see notes)
- **Assumes:** `advanced-sql-and-query-performance`, `api-design`, `backend-essentials`, `computer-science-foundations`, `just-enough-bash`, `just-enough-typescript`, `networking-essentials`, `security-essentials`, `sql-essentials`, `system-design`, `version-control-and-git`
- **Courses:** 26 total; 25 core; 1 extension

| Phase ID                    | Title                            | Kind      | Positions | Courses in order                                                                                                                                                                                                  |
| --------------------------- | -------------------------------- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `programming-and-computing` | Programming and computing basics | core      | 1–3       | `just-enough-python`, `data-structures-and-algorithms-essentials`, `computer-architecture`                                                                                                                        |
| `shipping-software`         | Shipping and operating software  | core      | 4–11      | `frontend-essentials`, `software-testing`, `containers-and-orchestration`, `data-engineering`, `backend-at-scale`, `cicd-and-release-engineering`, `site-reliability-engineering`, `software-product-engineering` |
| `building-with-models`      | Building with models             | core      | 12–13     | `creating-ai-powered-apps`, `evaluating-ai-output-essentials`                                                                                                                                                     |
| `agents`                    | Agents                           | core      | 14–20     | `agentic-ai`, `browser-automation-with-cdp`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`           |
| `evaluation-in-depth`       | Evaluation in depth              | core      | 21–23     | `statistics-for-evaluation`, `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`                                                                                                       |
| `serving-and-adapting`      | Serving and adapting models      | core      | 24–25     | `inference-serving-and-model-deployment`, `fine-tuning-and-adaptation`                                                                                                                                            |
| `capstone`                  | Capstone                         | extension | 26        | `capstone-build-your-own-coding-agent` (outline)                                                                                                                                                                  |

| Core phase                  | After this phase you can …                                                                                       | You cannot yet …                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `programming-and-computing` | write and test Python, use core data structures, and reason about how hardware runs your code                    | ship or operate a service                      |
| `shipping-software`         | build a tested frontend, run data pipelines and services in containers, and set up CI/CD and reliability targets | call a language model from your product        |
| `building-with-models`      | build an AI-powered feature and measure the quality of its output                                                | build an agent that plans and uses tools       |
| `agents`                    | build an agent loop with tools, memory, permissions, and observability                                           | measure AI quality with statistical confidence |
| `evaluation-in-depth`       | evaluate AI systems with sound statistics and design products around probabilistic behaviour                     | serve or adapt your own models                 |
| `serving-and-adapting`      | deploy models for inference and adapt them with fine-tuning                                                      | —                                              |

## Skills Paths: Drafted Input for Plans 06 and 07 (Not Applied Here)

> **Not applied by this plan.** The four sections below are the phases, outcomes, and `assumes` lists
> the authoring session drafted for the skills paths before decision 39. Plan 06 (accounting) and
> plan 07 (ERP) receive them as **input**. They may change them once the courses are written. In
> this plan the skills manifests keep today's description and order. The drafted descriptions below
> are proposals only. Every skills course still has `(outline)` status; the drafted cores become
> valid only after the matching content plan fills the courses.

### `skills/conventional-accounting`

- **Description:** For software engineers building accounting systems: from a balancing ledger to controlled reporting.
- **Goals:** none (see notes)
- **Assumes:** `backend-essentials`, `sql-essentials`
- **Courses:** 19 total; 19 core; 0 extension

| Phase ID                       | Title                             | Kind | Positions | Courses in order                                                                                                                                                                         |
| ------------------------------ | --------------------------------- | ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger-fundamentals`          | Ledger fundamentals               | core | 1–4       | `accounting-foundations` (outline), `chart-of-accounts-and-data-modeling` (outline), `financial-statements-and-close-cycle` (outline), `journal-entries-and-posting-mechanics` (outline) |
| `transaction-cycles`           | Transaction cycles                | core | 5–7       | `accrual-accounting-and-revenue-recognition` (outline), `accounts-payable-and-procure-to-pay` (outline), `accounts-receivable-and-order-to-cash` (outline)                               |
| `assets-costs-inventory`       | Assets, costs, and inventory      | core | 8–11      | `managerial-and-cost-accounting` (outline), `fixed-assets-and-depreciation` (outline), `inventory-and-cogs-accounting` (outline), `lease-and-intangible-asset-accounting` (outline)      |
| `groups-currencies-standards`  | Groups, currencies, and standards | core | 12–14     | `multi-currency-accounting-and-fx-translation` (outline), `consolidation-and-multi-entity-accounting` (outline), `financial-reporting-standards-ifrs-vs-gaap` (outline)                  |
| `controls-payroll-treasury`    | Controls, payroll, and treasury   | core | 15–17     | `audit-controls-and-compliance` (outline), `payroll-and-tax-accounting-essentials` (outline), `treasury-and-cash-management` (outline)                                                   |
| `reporting-and-ledger-systems` | Reporting and ledger systems      | core | 18–19     | `financial-reporting-and-xbrl` (outline), `general-ledger-system-architecture` (outline)                                                                                                 |

| Core phase                     | After this phase you can …                                                           | You cannot yet …                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `ledger-fundamentals`          | model accounts, journal entries, and financial statements in a system                | handle accruals, payables, or receivables                      |
| `transaction-cycles`           | model accruals, revenue recognition, and the procure-to-pay and order-to-cash cycles | account for long-lived assets, costs, and inventory            |
| `assets-costs-inventory`       | model cost accounting, depreciation, inventory and cost of goods sold, and leases    | handle several currencies or entities                          |
| `groups-currencies-standards`  | translate currencies, consolidate entities, and map IFRS and GAAP differences        | design controls, payroll, and treasury features                |
| `controls-payroll-treasury`    | build audit controls, payroll and tax postings, and cash management                  | produce regulated digital reports or design the ledger service |
| `reporting-and-ledger-systems` | produce XBRL reports and design a general-ledger architecture                        | —                                                              |

### `skills/sharia-accounting`

- **Description:** For software engineers building accounting systems that follow Sharia standards such as AAOIFI: the shared accounting foundation, then Sharia-specific modelling.
- **Goals:** none (see notes)
- **Assumes:** `backend-essentials`, `sql-essentials`
- **Courses:** 24 total; 24 core; 0 extension

| Phase ID                        | Title                             | Kind | Positions | Courses in order                                                                                                                                                                                                                                                        |
| ------------------------------- | --------------------------------- | ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger-fundamentals`           | Ledger fundamentals               | core | 1–4       | `accounting-foundations` (outline), `chart-of-accounts-and-data-modeling` (outline), `financial-statements-and-close-cycle` (outline), `journal-entries-and-posting-mechanics` (outline)                                                                                |
| `transaction-cycles`            | Transaction cycles                | core | 5–7       | `accrual-accounting-and-revenue-recognition` (outline), `accounts-payable-and-procure-to-pay` (outline), `accounts-receivable-and-order-to-cash` (outline)                                                                                                              |
| `assets-costs-inventory`        | Assets, costs, and inventory      | core | 8–11      | `managerial-and-cost-accounting` (outline), `fixed-assets-and-depreciation` (outline), `inventory-and-cogs-accounting` (outline), `lease-and-intangible-asset-accounting` (outline)                                                                                     |
| `groups-currencies-standards`   | Groups, currencies, and standards | core | 12–14     | `multi-currency-accounting-and-fx-translation` (outline), `consolidation-and-multi-entity-accounting` (outline), `financial-reporting-standards-ifrs-vs-gaap` (outline)                                                                                                 |
| `controls-payroll-treasury`     | Controls, payroll, and treasury   | core | 15–17     | `audit-controls-and-compliance` (outline), `payroll-and-tax-accounting-essentials` (outline), `treasury-and-cash-management` (outline)                                                                                                                                  |
| `reporting-and-ledger-systems`  | Reporting and ledger systems      | core | 18–19     | `financial-reporting-and-xbrl` (outline), `general-ledger-system-architecture` (outline)                                                                                                                                                                                |
| `sharia-accounting-for-systems` | Sharia accounting for systems     | core | 20–24     | `sharia-accounting-and-aaoifi-standards` (outline), `islamic-contract-modeling-for-systems` (outline), `zakah-computation-and-reporting-for-systems` (outline), `sukuk-and-islamic-capital-markets-accounting` (outline), `sharia-ledger-system-architecture` (outline) |

| Core phase                      | After this phase you can …                                                                                    | You cannot yet …                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ledger-fundamentals`           | model accounts, journal entries, and financial statements in a system                                         | handle accruals, payables, or receivables                      |
| `transaction-cycles`            | model accruals, revenue recognition, and the procure-to-pay and order-to-cash cycles                          | account for long-lived assets, costs, and inventory            |
| `assets-costs-inventory`        | model cost accounting, depreciation, inventory and cost of goods sold, and leases                             | handle several currencies or entities                          |
| `groups-currencies-standards`   | translate currencies, consolidate entities, and map IFRS and GAAP differences                                 | design controls, payroll, and treasury features                |
| `controls-payroll-treasury`     | build audit controls, payroll and tax postings, and cash management                                           | produce regulated digital reports or design the ledger service |
| `reporting-and-ledger-systems`  | produce XBRL reports and design a general-ledger architecture                                                 | model Islamic contracts or Sharia reporting                    |
| `sharia-accounting-for-systems` | apply AAOIFI standards, model Islamic contracts, compute zakah, account for sukuk, and design a Sharia ledger | issue Sharia rulings; that needs a qualified Sharia board      |

### `skills/conventional-erp`

- **Description:** For software engineers building ERP systems: documents, postings, business processes, inventory, and operations.
- **Goals:** none (see notes)
- **Assumes:** `api-design`, `audit-controls-and-compliance`, `backend-essentials`, `consolidation-and-multi-entity-accounting`, `domain-driven-design`, `event-driven-architecture`, `financial-statements-and-close-cycle`, `inventory-and-cogs-accounting`, `networking-essentials`, `payroll-and-tax-accounting-essentials`, `sql-essentials`
- **Courses:** 27 total; 27 core; 0 extension

| Phase ID                      | Title                                | Kind | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------------------------ | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erp-model-and-architecture`  | ERP model and architecture           | core | 1–3       | `erp-foundations-and-history` (outline), `erp-conceptual-data-model` (outline), `erp-module-map-and-architecture` (outline)                                                                                                                                                                                                                                                 |
| `documents-posting-close`     | Documents, posting, and period close | core | 4–9       | `erp-document-lifecycle-and-state-machines` (outline), `erp-posting-rules-and-account-determination` (outline), `erp-subledger-to-gl-architecture` (outline), `erp-fiscal-calendar-and-period-close` (outline), `erp-numbering-sequences-and-uom-conversion` (outline), `erp-audit-trail-and-change-tracking` (outline)                                                     |
| `business-process-cycles`     | Business process cycles              | core | 10–13     | `procure-to-pay-systems` (outline), `order-to-cash-systems` (outline), `erp-procurement-and-fulfillment-exceptions` (outline), `record-to-report-systems` (outline)                                                                                                                                                                                                         |
| `inventory-and-manufacturing` | Inventory and manufacturing          | core | 14–21     | `inventory-and-warehouse-management` (outline), `erp-inventory-costing-methods` (outline), `erp-inventory-integrity-and-concurrency` (outline), `erp-bom-and-routing-architecture` (outline), `production-planning-and-mrp` (outline), `demand-and-supply-planning` (outline), `erp-availability-and-reservations` (outline), `quality-management-and-inspection` (outline) |
| `extend-and-operate`          | Extending and operating the ERP      | core | 22–27     | `erp-extension-and-customization` (outline), `erp-integration-patterns` (outline), `human-capital-management-and-hire-to-retire` (outline), `multi-company-and-multi-currency-erp` (outline), `erp-security-and-controls` (outline), `erp-analytics-and-reporting` (outline)                                                                                                |

| Core phase                    | After this phase you can …                                                                                     | You cannot yet …                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `erp-model-and-architecture`  | explain the ERP data model and how its modules fit together                                                    | move a business document from draft to posted |
| `documents-posting-close`     | design document lifecycles, posting rules, subledger-to-ledger flow, period close, numbering, and audit trails | build end-to-end business processes           |
| `business-process-cycles`     | build procure-to-pay, order-to-cash, and record-to-report flows, including their exceptions                    | manage stock and manufacturing                |
| `inventory-and-manufacturing` | design inventory, costing, bills of materials, MRP, planning, reservations, and quality checks                 | extend, integrate, and secure the ERP         |
| `extend-and-operate`          | extend and integrate the ERP, add HR, run several companies and currencies, secure it, and report on it        | —                                             |

### `skills/sharia-erp`

- **Description:** For software engineers building Sharia-compliant ERP systems: the full ERP foundation, then Sharia-specific design.
- **Goals:** none (see notes)
- **Assumes:** `api-design`, `audit-controls-and-compliance`, `backend-essentials`, `consolidation-and-multi-entity-accounting`, `domain-driven-design`, `event-driven-architecture`, `financial-statements-and-close-cycle`, `inventory-and-cogs-accounting`, `islamic-contract-modeling-for-systems`, `networking-essentials`, `payroll-and-tax-accounting-essentials`, `sharia-accounting-and-aaoifi-standards`, `sql-essentials`
- **Courses:** 30 total; 30 core; 0 extension

| Phase ID                      | Title                                | Kind | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------------------------ | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erp-model-and-architecture`  | ERP model and architecture           | core | 1–3       | `erp-foundations-and-history` (outline), `erp-conceptual-data-model` (outline), `erp-module-map-and-architecture` (outline)                                                                                                                                                                                                                                                 |
| `documents-posting-close`     | Documents, posting, and period close | core | 4–9       | `erp-document-lifecycle-and-state-machines` (outline), `erp-posting-rules-and-account-determination` (outline), `erp-subledger-to-gl-architecture` (outline), `erp-fiscal-calendar-and-period-close` (outline), `erp-numbering-sequences-and-uom-conversion` (outline), `erp-audit-trail-and-change-tracking` (outline)                                                     |
| `business-process-cycles`     | Business process cycles              | core | 10–13     | `procure-to-pay-systems` (outline), `order-to-cash-systems` (outline), `erp-procurement-and-fulfillment-exceptions` (outline), `record-to-report-systems` (outline)                                                                                                                                                                                                         |
| `inventory-and-manufacturing` | Inventory and manufacturing          | core | 14–21     | `inventory-and-warehouse-management` (outline), `erp-inventory-costing-methods` (outline), `erp-inventory-integrity-and-concurrency` (outline), `erp-bom-and-routing-architecture` (outline), `production-planning-and-mrp` (outline), `demand-and-supply-planning` (outline), `erp-availability-and-reservations` (outline), `quality-management-and-inspection` (outline) |
| `extend-and-operate`          | Extending and operating the ERP      | core | 22–27     | `erp-extension-and-customization` (outline), `erp-integration-patterns` (outline), `human-capital-management-and-hire-to-retire` (outline), `multi-company-and-multi-currency-erp` (outline), `erp-security-and-controls` (outline), `erp-analytics-and-reporting` (outline)                                                                                                |
| `sharia-erp-design`           | Sharia ERP design                    | core | 28–30     | `sharia-compliant-erp-design` (outline), `islamic-contract-based-transaction-flows` (outline), `zakat-and-sharia-compliance-modules` (outline)                                                                                                                                                                                                                              |

| Core phase                    | After this phase you can …                                                                                     | You cannot yet …                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `erp-model-and-architecture`  | explain the ERP data model and how its modules fit together                                                    | move a business document from draft to posted             |
| `documents-posting-close`     | design document lifecycles, posting rules, subledger-to-ledger flow, period close, numbering, and audit trails | build end-to-end business processes                       |
| `business-process-cycles`     | build procure-to-pay, order-to-cash, and record-to-report flows, including their exceptions                    | manage stock and manufacturing                            |
| `inventory-and-manufacturing` | design inventory, costing, bills of materials, MRP, planning, reservations, and quality checks                 | extend, integrate, and secure the ERP                     |
| `extend-and-operate`          | extend and integrate the ERP, add HR, run several companies and currencies, secure it, and report on it        | design Sharia-compliant transaction flows                 |
| `sharia-erp-design`           | design Sharia-compliant ERP flows based on Islamic contracts and add zakat and compliance modules              | issue Sharia rulings; that needs a qualified Sharia board |
