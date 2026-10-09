# 001 — Current State and Partition

This page lists the 45 courses, explains why these 45, and records what was measured on them on 2026-10-09 at
`origin/main` commit `bb7f90137`. The per-course numbers are repeated in each brief under
[../syllabus/courses/](../syllabus/courses/README.md); this page holds the method, the totals, and the
comparison with what other plans own.

## The Partition

The series list gives this plan the scope "audit and fix web, backend, mobile, security, AI, testing, architecture,
and product courses". Plan 03's category taxonomy has five categories that match: Application development (17
courses), Security (9), AI engineering (15), Product and leadership (6), and Interview preparation (5). That is 52
courses. Seven of them belong to other plans and are not in this partition:

| Course                                    | Category                | Owner                                          |
| ----------------------------------------- | ----------------------- | ---------------------------------------------- |
| `enterprise-java-and-the-jvm`             | Application development | Plan 09 (templated filler, rewritten there)    |
| `defensive-security`                      | Security                | Plan 09 (templated filler, rewritten there)    |
| `vulnerability-management-and-assessment` | Security                | Plan 09 (templated filler, rewritten there)    |
| `capstone-build-your-own-coding-agent`    | AI engineering          | Plan 08 (one of the eight rewritten capstones) |
| `capstone-build-your-own-pentest-engine`  | Security                | Plan 08                                        |
| `capstone-secure-service`                 | Security                | Plan 08                                        |
| `capstone-lead-at-altitude`               | Product and leadership  | Plan 08                                        |

The remaining 45 courses are 16 in `application-development`, 14 in `ai-engineering`, 5 in `product-and-leadership`,
5 in `interview-preparation`, and 5 in `security`. Plans 11 and 12 audit the other pre-existing courses (languages,
tools, infrastructure, computer science, systems, data, and architecture); plan 10 builds new courses; this plan never
touches them. `capstone-first-working-software` belongs to this plan (the series assignment confirms it): it is an
existing written capstone with code, not one of plan 08's eight skeletons.

| Family                  | Course                                                                                                                      | Format                                                   | Wave | Size | Harness mode                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---- | ---- | ----------------------------------- |
| application-development | [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | By Example                                               | 2    | S    | real                                |
| application-development | [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | By Example                                               | 6    | M    | real, with static units (`android`) |
| application-development | [`api-design`](../syllabus/courses/api-design.md)                                                                           | By Example                                               | 2    | S    | real                                |
| application-development | [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | By Example                                               | 15   | S    | real                                |
| application-development | [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | By Example                                               | 3    | S    | real                                |
| application-development | [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | By Example                                               | 1    | S    | real                                |
| application-development | [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | By Example                                               | 12   | M    | real                                |
| application-development | [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | By Example                                               | 13   | XL   | real                                |
| application-development | [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | Capstone                                                 | 11   | L    | real                                |
| application-development | [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | Capstone                                                 | 10   | L    | real                                |
| application-development | [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | By Example                                               | 1    | S    | real                                |
| application-development | [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | By Example                                               | 11   | L    | real                                |
| application-development | [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | Annotated Concept                                        | 10   | L    | real                                |
| application-development | [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | By Example                                               | 9    | L    | real, with static units (`ios`)     |
| application-development | [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | By Example                                               | 11   | XL   | real                                |
| application-development | [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | By Example                                               | 13   | S    | real, with static units (`windows`) |
| ai-engineering          | [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | Annotated Concept                                        | 8    | XL   | real                                |
| ai-engineering          | [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | Annotated Concept                                        | 9    | L    | real                                |
| ai-engineering          | [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | By Example                                               | 9    | XL   | real                                |
| ai-engineering          | [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | By Example                                               | 6    | XL   | real                                |
| ai-engineering          | [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | By Example                                               | 4    | XL   | real                                |
| ai-engineering          | [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | Annotated Concept                                        | 13   | M    | real                                |
| ai-engineering          | [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | By Example                                               | 3    | XL   | real                                |
| ai-engineering          | [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | Annotated Concept                                        | 4    | S    | real                                |
| ai-engineering          | [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | By Example                                               | 7    | S    | real                                |
| ai-engineering          | [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | By Example                                               | 15   | S    | real                                |
| ai-engineering          | [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | By Example                                               | 7    | S    | real                                |
| ai-engineering          | [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | Annotated Concept, no-code                               | 14   | S    | not applicable (no code)            |
| ai-engineering          | [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | Annotated Concept                                        | 5    | S    | real                                |
| ai-engineering          | [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | By Example                                               | 5    | XL   | real                                |
| product-and-leadership  | [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | By Example                                               | 12   | XL   | real                                |
| product-and-leadership  | [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | Annotated Concept, no-code                               | 14   | S    | not applicable (no code)            |
| product-and-leadership  | [`project-management`](../syllabus/courses/project-management.md)                                                           | Annotated Concept, no-code                               | 6    | S    | not applicable (no code)            |
| product-and-leadership  | [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | Annotated Concept, no-code                               | 8    | S    | not applicable (no code)            |
| product-and-leadership  | [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | Annotated Concept, no-code                               | 15   | S    | not applicable (no code)            |
| interview-preparation   | [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | Annotated Concept, no-code (corrected from standard, D3) | 3    | L    | not applicable (no code)            |
| interview-preparation   | [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | Capstone                                                 | 14   | XL   | real                                |
| interview-preparation   | [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | By Example                                               | 1    | XL   | real                                |
| interview-preparation   | [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | Annotated Concept, no-code (corrected from standard, D3) | 5    | M    | not applicable (no code)            |
| interview-preparation   | [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | By Example                                               | 7    | XL   | real                                |
| security                | [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | By Example                                               | 8    | L    | real                                |
| security                | [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | Annotated Concept                                        | 4    | L    | real                                |
| security                | [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | Annotated Concept, no-code                               | 12   | M    | not applicable (no code)            |
| security                | [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | By Example                                               | 10   | XL   | real                                |
| security                | [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | By Example                                               | 2    | S    | real                                |

Totals by family (baseline of 2026-10-09):

| Family                    | Courses | Words today | Code files today | Words short of floor | Target units | Planning minutes |
| ------------------------- | ------- | ----------- | ---------------- | -------------------- | ------------ | ---------------- |
| `application-development` | 16      | 474,767     | 1,338            | 137,288              | 1,306        | 205.2            |
| `ai-engineering`          | 14      | 395,726     | 822              | 162,945              | 926          | 72.4             |
| `product-and-leadership`  | 5       | 107,188     | 1                | 22,382               | 84           | 6.3              |
| `interview-preparation`   | 5       | 26,568      | 15               | 88,432               | 219          | 16.5             |
| `security`                | 5       | 132,403     | 152              | 65,925               | 296          | 25.6             |
| **Total**                 | 45      | 1,136,652   | 2,328            | 476,972              | 2,831        | 326.0            |

By mode: 27 By Example, 7 Annotated Concept (standard), 8 Annotated Concept no-code, and
3 capstones (Annotated Concept, standard). No course is a Primer. By harness mode: 37 courses
have code and will be covered; 8 courses have no code and are "not applicable" in the coverage report
(`product-patterns-for-probabilistic-systems`, `engineering-management`, `project-management`,
`software-product-engineering`, `technical-communication`, `behavioral-and-leadership-interviews`,
`system-design-interview`, and `it-governance-grc`). Two of the eight are format corrections (decision D3): plan 03
records them as `annotated-concept`, and this plan changes them to `annotated-concept-no-code` because the courses
have no code folder, no code fence, and no program.

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

Two measurement notes. First, the lesson-anchor baseline uses plan 05's method (path-label and labelled-path
anchors matched byte for byte against the target file), so a "bad anchor" counts a mismatch or a missing file, and a
fence in an AI or security course that shows a shell session counts as unanchored until it is tied to a file or
marked an illustration. Second, a course whose lessons are one table per theme (for example the 78 `ex-NN` rows of
`analytics-and-experimentation`) counts those rows as examples for the "have" column but has none in the mode's
heading form; class X6 and X5 record that.

## Totals

| Measure                                                                                 | Value                                     |
| --------------------------------------------------------------------------------------- | ----------------------------------------- |
| Words in the 45 courses                                                                 | 1,136,652                                 |
| Markdown pages (excluding `_index.md`)                                                  | 582                                       |
| Code files                                                                              | 2,328                                     |
| Example folders / kata folders                                                          | 1,753 / 58                                |
| Courses short of their word floor / words short                                         | 27 / 476,972                              |
| Courses with a drilling page under 5,000 words / words short                            | 39 / 130,763                              |
| Words to write, counting drilling shortfalls (per course the larger of the two, summed) | 487,871                                   |
| Unanchored code fences in lessons                                                       | 755                                       |
| `Output` blocks not anchored to an expected file                                        | 1,064                                     |
| Anchors that disagree with their file or point at a missing file                        | 326                                       |
| Target units (examples + katas + capstones)                                             | 2,831 (1,007 to create, 1,824 to convert) |
| Target example units / kata units / capstone units                                      | 2,528 / 266 / 37                          |
| Planned runs (examples + 2 x katas + 3 per capstone) / planning minutes                 | 3,171 / 326.0                             |
| Size classes S / M / L / XL                                                             | 18 / 5 / 9 / 13                           |
| Courses with code (covered after the plan) / no-code courses (not applicable)           | 37 / 8                                    |

What the totals say. The plan is mostly authoring, not repair: 487,871 words must be written (the larger of the
word gap and the drilling shortfall per course), 1,007 of the 2,831 target units do not exist yet, and
13 of the 45 courses are size XL. The audit decides what each course needs; the fix is the
bulk of the work. The scale is reported to the user in the README as a flag, with the option to split the PR
(decision D7); it is not an open decision, because the series fixed one plan as one PR (decision 42).

## Baseline per Course

Gap is words short of the mode's floor. "Anchors to repair" counts mismatches and missing files. The last column
counts the defect classes the brief expects (the classes are defined in
[002](./002-definition-of-done-and-targets.md#defect-classes)). "Examples (have)" is the larger of the numbered
headings, the scenarios, and the example folders.

| Course                                                                                                                      | Words   | Floor  | Gap    | Examples (have / floor) | Code files | Example folders | Kata folders | Unanchored code fences | Unanchored outputs | Anchors to repair | Drilling words | Defect classes |
| --------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ------ | ----------------------- | ---------- | --------------- | ------------ | ---------------------- | ------------------ | ----------------- | -------------- | -------------- |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | 54,025  | 28,000 | 0      | 80 / 75                 | 100        | 80              | 6            | 6                      | 89                 | 3                 | 4,252          | 10             |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | 18,911  | 28,000 | 9,089  | 78 / 75                 | 96         | 78              | 6            | 0                      | 0                  | 0                 | 1,680          | 10             |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | 61,178  | 28,000 | 0      | 80 / 75                 | 97         | 80              | 6            | 6                      | 90                 | 1                 | 8,942          | 9              |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | 44,146  | 28,000 | 0      | 78 / 75                 | 102        | 78              | 10           | 10                     | 81                 | 15                | 5,831          | 10             |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | 47,278  | 28,000 | 0      | 80 / 75                 | 98         | 80              | 6            | 0                      | 84                 | 5                 | 4,433          | 11             |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | 87,306  | 28,000 | 0      | 80 / 75                 | 177        | 80              | 19           | 19                     | 104                | 53                | 10,674         | 8              |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | 19,247  | 28,000 | 8,753  | 80 / 75                 | 84         | 80              | 0            | 0                      | 80                 | 80                | 415            | 8              |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | 6,652   | 28,000 | 21,348 | 80 / 75                 | 86         | 80              | 0            | 0                      | 0                  | 0                 | 387            | 7              |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | 9,754   | 23,000 | 13,246 | 0 / 45                  | 15         | 0               | 0            | 1                      | 5                  | 0                 | 0              | 12             |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | 7,614   | 23,000 | 15,386 | 0 / 45                  | 19         | 0               | 0            | 0                      | 3                  | 0                 | 0              | 11             |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | 54,122  | 28,000 | 0      | 80 / 75                 | 162        | 80              | 0            | 5                      | 82                 | 0                 | 4,871          | 8              |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | 13,649  | 28,000 | 14,351 | 78 / 75                 | 4          | 0               | 0            | 78                     | 0                  | 0                 | 785            | 9              |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | 6,948   | 22,000 | 15,052 | 53 / 45                 | 57         | 53              | 0            | 24                     | 0                  | 0                 | 181            | 11             |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | 11,289  | 28,000 | 16,711 | 78 / 75                 | 10         | 7               | 0            | 77                     | 0                  | 0                 | 853            | 9              |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | 5,071   | 28,000 | 22,929 | 78 / 75                 | 86         | 78              | 0            | 1                      | 0                  | 78                | 313            | 12             |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | 27,577  | 28,000 | 423    | 78 / 75                 | 145        | 78              | 5            | 1                      | 0                  | 78                | 1,512          | 8              |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | 1,700   | 22,000 | 20,300 | 48 / 45                 | 48         | 48              | 0            | 0                      | 0                  | 0                 | 93             | 9              |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | 2,917   | 22,000 | 19,083 | 46 / 45                 | 46         | 46              | 0            | 0                      | 0                  | 0                 | 178            | 9              |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | 2,861   | 28,000 | 25,139 | 52 / 75                 | 52         | 52              | 0            | 0                      | 0                  | 0                 | 147            | 10             |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | 3,796   | 28,000 | 24,204 | 54 / 75                 | 54         | 54              | 0            | 0                      | 0                  | 0                 | 209            | 11             |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | 3,759   | 28,000 | 24,241 | 80 / 75                 | 80         | 80              | 0            | 0                      | 0                  | 0                 | 134            | 9              |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | 43,188  | 22,000 | 0      | 54 / 45                 | 24         | 16              | 0            | 47                     | 19                 | 4                 | 3,825          | 12             |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | 4,778   | 28,000 | 23,222 | 80 / 75                 | 81         | 80              | 0            | 0                      | 0                  | 1                 | 203            | 11             |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | 43,634  | 22,000 | 0      | 46 / 45                 | 59         | 43              | 0            | 47                     | 46                 | 0                 | 3,759          | 7              |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | 81,047  | 28,000 | 0      | 80 / 75                 | 88         | 80              | 0            | 86                     | 84                 | 0                 | 4,929          | 7              |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | 74,436  | 28,000 | 0      | 75 / 75                 | 74         | 74              | 0            | 79                     | 79                 | 0                 | 4,915          | 9              |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | 48,109  | 28,000 | 0      | 75 / 75                 | 86         | 75              | 0            | 0                      | 75                 | 0                 | 4,478          | 8              |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | 30,210  | 18,000 | 0      | 44 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 4,127          | 3              |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | 54,047  | 22,000 | 0      | 46 / 45                 | 82         | 45              | 0            | 49                     | 49                 | 0                 | 5,170          | 10             |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | 1,244   | 28,000 | 26,756 | 48 / 75                 | 48         | 48              | 0            | 0                      | 0                  | 0                 | 104            | 9              |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | 5,618   | 28,000 | 22,382 | 0 / 75                  | 1          | 0               | 0            | 3                      | 0                  | 0                 | 1,007          | 11             |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | 25,124  | 18,000 | 0      | 27 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 4,031          | 3              |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | 24,158  | 18,000 | 0      | 25 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 4,155          | 3              |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | 27,440  | 18,000 | 0      | 30 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 5,024          | 3              |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | 24,848  | 18,000 | 0      | 25 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 4,391          | 2              |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | 5,299   | 18,000 | 12,701 | 0 / 20                  | 0          | 0               | 0            | 0                      | 0                  | 0                 | 345            | 6              |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | 2,266   | 23,000 | 20,734 | 0 / 45                  | 9          | 0               | 0            | 2                      | 0                  | 0                 | 424            | 8              |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | 5,232   | 28,000 | 22,768 | 75 / 75                 | 4          | 0               | 0            | 1                      | 0                  | 0                 | 354            | 9              |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | 8,520   | 18,000 | 9,480  | 0 / 20                  | 0          | 0               | 0            | 0                      | 0                  | 0                 | 439            | 7              |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | 5,251   | 28,000 | 22,749 | 0 / 75                  | 2          | 0               | 0            | 2                      | 0                  | 0                 | 749            | 10             |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | 9,085   | 28,000 | 18,915 | 78 / 75                 | 7          | 0               | 0            | 80                     | 0                  | 0                 | 225            | 11             |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | 7,016   | 22,000 | 14,984 | 52 / 45                 | 9          | 0               | 0            | 0                      | 0                  | 0                 | 325            | 11             |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | 10,085  | 18,000 | 7,915  | 30 / 20                 | 0          | 0               | 0            | 0                      | 0                  | 0                 | 776            | 4              |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | 3,889   | 28,000 | 24,111 | 78 / 75                 | 4          | 0               | 0            | 1                      | 0                  | 0                 | 233            | 12             |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | 102,328 | 28,000 | 0      | 80 / 75                 | 132        | 80              | 0            | 130                    | 94                 | 8                 | 8,364          | 12             |

Plan 05 counted 1,124 lesson-to-file mismatches and 167 missing-file anchors in the 25 affected courses of the whole
catalog and assigned the repair to plans 11 to 13. This plan's share, in its 45 courses, is 326
mismatched or missing anchors, plus 755 unanchored code fences and 1,064 unanchored
`Output` blocks to tie to files or mark.

## What Does Not Change

The 45 slugs, titles, modes (except the two corrections), categories, weights, and places in every path stay. No
path manifest changes except the AI Engineer manifest on the exception in
[005](./005-prerequisites-ai-path-and-capstone-integrity.md#the-ai-engineer-path-core). Indonesian content
(`content/id/**`) stays untouched (series decision 35).
