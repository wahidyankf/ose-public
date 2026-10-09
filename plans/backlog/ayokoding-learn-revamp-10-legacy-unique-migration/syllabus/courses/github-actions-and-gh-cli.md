# GitHub Actions and the gh CLI (By Example)

**Course ID**: `github-actions-and-gh-cli` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-tools/github-actions` (7 files, 36,300 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-tools/gh-cli` (7 files, 21,437 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches GitHub Actions' workflow syntax and the gh CLI's own command surface in depth. It excludes general CI/CD strategy, already in `cicd-and-release-engineering`.

**Short summary**: Workflows, triggers, matrices, and the gh CLI, each proven by a runnable, offline-checkable case.

## Why this exists · the big idea

- **The problem before the solution**: `cicd-and-release-engineering` teaches pipeline strategy and uses GitHub Actions as its example vendor, but it covers roughly 15 of this legacy corpus's 83 concrete syntax and gh-CLI examples, so a learner who needs the mechanics (matrix, caching, OIDC, gh commands) still has no dedicated course.
- **Keep-this-if-you-forget-everything**: A workflow file is validated and simulated offline before it is trusted against a real repository.

## Learning objectives

After this course you can:

1. write a workflow with triggers, a job matrix, caching, and artifact upload and download.
2. write a reusable workflow and a composite action, and pass secrets into them safely.
3. request short-lived OIDC credentials instead of long-lived secrets.
4. drive the gh CLI to manage issues, pull requests, releases, and workflow runs from a script.
5. validate a workflow file's structure and a gh CLI script's logic without touching a real repository.

## Prerequisites

- **Prior courses**: `version-control-and-git`, `cicd-and-release-engineering`, `just-enough-bash`.
- **Assumed knowledge**: Basic Git and YAML.
- **Language medium (prerequisite rubric rule L1)**: workflow files are YAML and gh-CLI scripts are Bash, validated by Python 3.14 fixture checkers, so `just-enough-bash` is listed; `version-control-and-git` and `cicd-and-release-engineering` give the surrounding vocabulary. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `version-control-and-git`, `cicd-and-release-engineering`, `just-enough-bash`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- GitHub's own Actions and `gh` CLI documentation, read and dated at writing time, since both surfaces change.
- Every workflow YAML example is schema-validated offline; no example is claimed to run on real GitHub without that same-day check.

## Concepts

- **co-01 · trigger** — the event that starts a workflow run.
- **co-02 · job-and-step** — a workflow's unit of parallel work and its ordered actions.
- **co-03 · matrix-strategy** — running one job across a grid of inputs.
- **co-04 · caching** — reusing dependency or build output between runs.
- **co-05 · artifact** — a file produced by one job and consumed by another.
- **co-06 · reusable-workflow** — a workflow callable from another workflow.
- **co-07 · composite-action** — a bundle of steps packaged as one reusable action.
- **co-08 · secret-and-oidc** — a stored secret versus a short-lived federated token.
- **co-09 · environment-protection** — required approval before a deploy job runs.
- **co-10 · concurrency-group** — cancelling or queuing overlapping runs.
- **co-11 · workflow-dispatch** — a manually triggered run with typed inputs.
- **co-12 · gh-pr-workflow** — creating, reviewing, and merging a pull request from the CLI.
- **co-13 · gh-api** — calling the GitHub REST or GraphQL API through `gh api`.
- **co-14 · gh-release** — creating and managing a release from the CLI.
- **co-15 · status-check** — a required check that gates a merge.
- **co-16 · offline-validation** — checking a workflow's structure and a script's logic without a live repository.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Workflow syntax and gh-CLI commands are best taught as many small, independently runnable and checkable cases, which is exactly what By Example provides.

| Target             | Value                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                                 |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                            |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                                     |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                                   |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                                |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                              |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                                       |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: infrastructure-and-operations`, no `status: outline` |

Anchor runtimes: Shell (Debian, bash and coreutils) plus Python 3.14 fixture validators that parse and schema-check YAML and simulate `gh` JSON responses from local fixtures, no real network, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none; every example is checked offline against a fixture instead of a live GitHub account, so no `cloud` reason applies.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Triggers and basic workflows** (ex-01 to ex-08, 8 examples).
- **Cluster: Jobs, steps, and the run context** (ex-09 to ex-17, 9 examples).
- **Cluster: gh CLI basics (auth, repo, issue)** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Matrix, caching, and artifacts** (ex-26 to ex-34, 9 examples).
- **Cluster: Reusable workflows and composite actions** (ex-35 to ex-44, 10 examples).
- **Cluster: gh CLI for pull requests and releases** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Secrets, OIDC, and environments** (ex-54 to ex-61, 8 examples).
- **Cluster: Concurrency and monorepo path filters** (ex-62 to ex-70, 9 examples).
- **Cluster: Offline validation of a workflow and a gh script** (ex-71 to ex-78, 8 examples).

## Capstone spec

Author a commit-to-release pipeline as a set of workflow files (test, build, OIDC-authenticated publish, release notes via `gh release create`) and validate the whole set offline, with a golden validation report. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: debug a failing matrix job from its log; choose OIDC over a stored secret; design a concurrency group for a monorepo.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a required status check; convert a long-lived secret to OIDC; write a `gh` script that automates a release.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example calls a real GitHub endpoint; `gh` responses come from committed JSON fixtures and workflow files are validated with a local schema, never dispatched.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
