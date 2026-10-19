# Frontend Unit Testing with Vitest and Testing Library (By Example)

**Course ID**: `frontend-unit-testing-with-vitest-and-testing-library` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-testing/tools/testing-library` (5 files, 36,103 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-testing/tools/vitest` (5 files, 33,839 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Vitest's runner, mocking, and coverage model together with Testing Library's user-facing query philosophy. It excludes end-to-end browser testing (playwright-end-to-end-testing).

**Short summary**: Vitest runs the tests fast; Testing Library keeps them honest about what a user actually sees and does.

## Why this exists · the big idea

- **The problem before the solution**: `software-testing` and `frontend-essentials` use both tools incidentally but never teach Vitest's own mocking and coverage model or Testing Library's query priorities as a dedicated subject.
- **Keep-this-if-you-forget-everything**: Query the way a user would find the element, not by its implementation detail.

## Learning objectives

After this course you can:

1. write Vitest unit tests with the right query, mock, and assertion for the case.
2. use Testing Library's query priority (role, label, text, test id as a last resort) to write resilient component tests.
3. mock a module, a timer, or a network call deterministically.
4. read a coverage report and decide what still needs a test and what does not.
5. debug a failing render test using Testing Library's debug output.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `frontend-essentials`.
- **Assumed knowledge**: Basic React or component-model concepts from frontend-essentials.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript using Vitest and Testing Library, so `just-enough-typescript` and `frontend-essentials` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `frontend-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Vitest's and Testing Library's own documentation, read and dated at writing time.
- The pinned versions in the node toolchain lockfile are the source of truth for available APIs.

## Concepts

- **co-01 · test-runner** — how Vitest discovers, runs, and reports tests.
- **co-02 · query-priority** — Testing Library's preferred order: role, label text, text, test id.
- **co-03 · render** — mounting a component into a test DOM.
- **co-04 · user-event** — simulating a real user interaction, not a raw DOM event.
- **co-05 · mock-function** — a stand-in that records calls and returns a controlled value.
- **co-06 · module-mock** — replacing an entire imported module for a test.
- **co-07 · timer-mock** — controlling fake timers for deterministic async code.
- **co-08 · snapshot** — a recorded serialization compared on later runs.
- **co-09 · coverage-report** — lines, branches, and functions a suite exercises.
- **co-10 · test-isolation** — resetting mocks and DOM state between tests.
- **co-11 · async-assertion** — waiting for an element or state to appear.
- **co-12 · accessibility-query** — querying by role and accessible name.
- **co-13 · debug-output** — printing the current DOM to diagnose a failing query.
- **co-14 · custom-render** — a render wrapper that injects providers a component needs.
- **co-15 · flaky-test-diagnosis** — telling a real race condition from a bad wait.
- **co-16 · ci-reporting** — a machine-readable report for a pipeline.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each tool's API is a set of small, independently runnable patterns (a query, a mock, a timer), which By Example teaches well as short verifiable cases.

| Target             | Value                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                       |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                  |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                           |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                         |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                      |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                    |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                             |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: tools-and-practices`, no `status: outline` |

Anchor runtimes: Node.js with the pinned TypeScript toolchain, Vitest, and Testing Library, no network, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Vitest basics** (ex-01 to ex-08, 8 examples).
- **Cluster: Testing Library queries** (ex-09 to ex-17, 9 examples).
- **Cluster: User-event interaction** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Mocking modules and functions** (ex-26 to ex-34, 9 examples).
- **Cluster: Fake timers and async code** (ex-35 to ex-44, 10 examples).
- **Cluster: Snapshots** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Coverage and gaps** (ex-54 to ex-61, 8 examples).
- **Cluster: Custom render wrappers** (ex-62 to ex-70, 9 examples).
- **Cluster: Flaky-test diagnosis** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a unit-test suite for a small fixture component library (a form, a list, and an async-loading widget) reaching a stated coverage floor with no snapshot left unreviewed. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: pick the right query for an ambiguous element; decide what to mock versus render for real; read a coverage gap and write the missing test.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: replace a test-id query with a role query; mock a flaky external call; convert a brittle snapshot into a targeted assertion.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example performs a real network call; every async case uses fake timers or a local fixture.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
