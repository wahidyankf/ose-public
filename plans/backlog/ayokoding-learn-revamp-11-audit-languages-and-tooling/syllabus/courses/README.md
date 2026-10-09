# Syllabus Courses — Audit of Language and Tooling

One brief per course, 32 in all. Each brief follows the
[copy-paste course template](../../../../../repo-governance/conventions/structure/learning-plan-syllabus/copy-paste-course-template.md)
and adds plan-specific sections the executor needs:

- `## Mode and targets` — the mode, the reason it stays, and a table of today's measured values against the
  target, with the work to do.
- `## Expected defect classes` — the classes of [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes)
  that the baseline found, each with its measured fact.
- `## Fixes and design` — what to change, and the design decisions the audit needs (for example which tool is
  modelled).
- `## Harness mode and toolchain` — real or static, toolchain ids, additions (default none), spikes, the
  illustration budget, and the CI cost as a planning figure.
- `## Size class and sequencing` — the size class, the agent packets it implies, the wave and slot, and the
  dependents inside the plan.
- `## Prerequisite re-check` — plan 02's result and what CP-1 checks.
- `## Per-course checklist` — CP-1 to CP-6, which [delivery.md](../../delivery.md) repeats per wave.

The template's optional sections are omitted on purpose: `## Worked examples` (the examples already exist; the
brief gives counts, and the checker lists them), `## Read more` (the audit adds no new sources), `## Capstone
spec` and `## Tensions & trade-offs` (the audit changes no course's design). `## Lineage` is kept, short.

The shared targets behind every `## Mode and targets` section are in
[tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md). The harness design, spikes, and
illustration policy are in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md), the toolchain and
CI rules in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md), and the execution model in
[tech-docs/006](../../tech-docs/006-execution-model.md).

## Index

Waves are the execution order. Defect classes are the number of the 20 classes the brief expects. Size is the
rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule).

| Family         | Course                                                                        | Format                                 | Wave | Size | Harness mode             | Prerequisites                                                                               | Defect classes |
| -------------- | ----------------------------------------------------------------------------- | -------------------------------------- | ---- | ---- | ------------------------ | ------------------------------------------------------------------------------------------- | -------------- |
| tools          | [Browser Automation with CDP](./browser-automation-with-cdp.md)               | By Example                             | 4    | XL   | real                     | `just-enough-python`, `networking-essentials`                                               | 6              |
| tools          | [Build Automation and Task Runners](./build-automation-and-task-runners.md)   | By Example                             | 9    | L    | real                     | `just-enough-bash`, `version-control-and-git`, `just-enough-typescript`                     | 6              |
| tools          | [Building Production CLI Tools](./building-production-cli-tools.md)           | By Example                             | 6    | L    | real                     | `just-enough-go`, `just-enough-rust`                                                        | 7              |
| tools          | [Pass 0 Capstone · Forge-Ready](./capstone-forge-ready.md)                    | Capstone (Annotated Concept, standard) | 10   | XL   | real                     | `extending-neovim`, `just-enough-nvim`, `just-enough-lua`                                   | 5              |
| tools          | [Debugging and Profiling](./debugging-and-profiling.md)                       | By Example                             | 8    | S    | real                     | `software-testing`, `just-enough-python`, `just-enough-bash`                                | 6              |
| tools          | [Extending Neovim](./extending-neovim.md)                                     | By Example                             | 8    | S    | real                     | `just-enough-lua`, `just-enough-nvim`                                                       | 5              |
| tools          | [Just Enough Nvim](./just-enough-nvim.md)                                     | Primer                                 | 2    | S    | real                     | none                                                                                        | 4              |
| tools          | [Software Engineering Practices](./software-engineering-practices.md)         | Annotated Concept                      | 10   | S    | real                     | `just-enough-bash`, `software-testing`, `backend-essentials`                                | 7              |
| tools          | [Software Testing](./software-testing.md)                                     | By Example                             | 4    | S    | real                     | `just-enough-python`                                                                        | 6              |
| tools          | [Version Control and Git](./version-control-and-git.md)                       | By Example                             | 4    | S    | real                     | `just-enough-bash`, `just-enough-python`                                                    | 5              |
| languages      | [Just Enough Bash](./just-enough-bash.md)                                     | Primer                                 | 1    | S    | real                     | none                                                                                        | 6              |
| languages      | [Just Enough C](./just-enough-c.md)                                           | Primer                                 | 5    | M    | real                     | `just-enough-python`, `just-enough-bash`                                                    | 6              |
| languages      | [Just Enough C++](./just-enough-cpp.md)                                       | Primer                                 | 7    | M    | real                     | `just-enough-c`                                                                             | 5              |
| languages      | [Just Enough C#](./just-enough-csharp.md)                                     | Primer                                 | 6    | XL   | real                     | `object-oriented-programming-essentials`                                                    | 7              |
| languages      | [Just Enough Dart](./just-enough-dart.md)                                     | Primer                                 | 3    | L    | real                     | `object-oriented-programming-essentials`, `just-enough-typescript`                          | 5              |
| languages      | [Just Enough Elixir](./just-enough-elixir.md)                                 | Primer                                 | 5    | L    | real                     | `functional-programming`, `just-enough-python`                                              | 5              |
| languages      | [Just Enough Go](./just-enough-go.md)                                         | Primer                                 | 1    | M    | real                     | none                                                                                        | 6              |
| languages      | [Just Enough Java](./just-enough-java.md)                                     | Primer                                 | 3    | XL   | real                     | `object-oriented-programming-essentials`                                                    | 5              |
| languages      | [Just Enough Kotlin](./just-enough-kotlin.md)                                 | Primer                                 | 3    | L    | real                     | none                                                                                        | 6              |
| languages      | [Just Enough Lua](./just-enough-lua.md)                                       | Primer                                 | 5    | S    | real                     | `just-enough-nvim`                                                                          | 5              |
| languages      | [Just Enough Python](./just-enough-python.md)                                 | Primer                                 | 1    | S    | real                     | none                                                                                        | 7              |
| languages      | [Just Enough Rust](./just-enough-rust.md)                                     | Primer                                 | 2    | XL   | real                     | none                                                                                        | 6              |
| languages      | [Just Enough Swift](./just-enough-swift.md)                                   | Primer                                 | 6    | L    | real, with static units  | `object-oriented-programming-essentials`, `just-enough-kotlin`                              | 5              |
| languages      | [Just Enough TypeScript](./just-enough-typescript.md)                         | Primer                                 | 2    | S    | real                     | none                                                                                        | 5              |
| infrastructure | [Bare-Metal Virtualization](./bare-metal-virtualization.md)                   | By Example                             | 10   | L    | real, with static units  | `containers-and-orchestration`, `cloud-and-iac`, `networking-essentials`                    | 5              |
| infrastructure | [CI/CD and Release Engineering](./cicd-and-release-engineering.md)            | By Example                             | 9    | M    | real                     | `version-control-and-git`, `containers-and-orchestration`                                   | 5              |
| infrastructure | [Cloud and IaC](./cloud-and-iac.md)                                           | Annotated Concept                      | 9    | L    | static and real          | `just-enough-bash`, `backend-essentials`, `containers-and-orchestration`                    | 7              |
| infrastructure | [Containers and Orchestration](./containers-and-orchestration.md)             | By Example                             | 7    | L    | real, with static units  | `just-enough-bash`, `backend-essentials`, `sql-essentials`                                  | 3              |
| infrastructure | [Platform Engineering and DevEx](./platform-engineering-and-devex.md)         | Annotated Concept, no-code             | 11   | M    | not applicable (no code) | `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`             | 5              |
| infrastructure | [Self-Hosting Essentials](./self-hosting-essentials.md)                       | By Example                             | 7    | S    | real                     | `backend-essentials`, `just-enough-bash`                                                    | 7              |
| infrastructure | [Self-Managed Kubernetes and GitOps](./self-managed-kubernetes-and-gitops.md) | By Example                             | 11   | XL   | real, with static units  | `containers-and-orchestration`, `bare-metal-virtualization`, `cicd-and-release-engineering` | 6              |
| infrastructure | [Site Reliability Engineering](./site-reliability-engineering.md)             | Annotated Concept                      | 8    | L    | real                     | `containers-and-orchestration`, `system-design`                                             | 5              |

Totals: 12 By Example, 15 Primer, 3 Annotated Concept, 1 Annotated Concept
no-code, and 1 capstone. 11 courses are size S, 5 are M, 10 are L, and 6 are
XL. 31 courses have code and will be harness-covered; one has none.
