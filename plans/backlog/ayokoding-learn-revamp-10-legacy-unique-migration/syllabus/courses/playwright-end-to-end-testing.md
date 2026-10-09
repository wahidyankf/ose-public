# Playwright End-to-End Testing (By Example)

**Course ID**: `playwright-end-to-end-testing` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-testing/tools/playwright` (32 files, 146,397 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Playwright itself in depth: selectors, waiting, fixtures, network interception, visual and accessibility checks, and CI integration. It excludes general test-strategy material already in `software-testing`.

**Short summary**: Playwright automates a real browser; this course teaches it as a dedicated tool, from a first script to a CI-ready suite.

## Why this exists · the big idea

- **The problem before the solution**: `software-testing` teaches testing strategy broadly and uses Playwright only incidentally; nobody teaches Playwright's own API, waiting model, and failure modes in depth.
- **Keep-this-if-you-forget-everything**: Wait for a condition, never for a fixed time.

## Learning objectives

After this course you can:

1. write Playwright tests that select elements robustly and wait for real conditions, not fixed delays.
2. use fixtures, page objects, and test hooks to keep a growing suite maintainable.
3. intercept and mock network requests to test a page without its real backend.
4. run visual and accessibility checks inside a Playwright suite.
5. run a Playwright suite in CI with traces, videos, and retries configured for debugging, not for hiding flakiness.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `software-testing`.
- **Assumed knowledge**: Basic DOM and HTTP concepts from frontend-essentials.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript driving the Playwright Node API, so `just-enough-typescript` is listed; `software-testing` is listed for shared testing vocabulary. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `software-testing`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Playwright's own documentation, read and dated at writing time, since its API evolves between major versions.
- The pinned Playwright version in `apps/ayokoding-cli`'s node toolchain lockfile is the single source of truth for behaviour; no example claims a behaviour the pinned version does not have.

## Concepts

- **co-01 · locator** — a resilient, auto-waiting reference to an element.
- **co-02 · auto-waiting** — Playwright's built-in wait for actionability before an action.
- **co-03 · fixture** — reusable setup and teardown injected into a test.
- **co-04 · page-object** — a class wrapping a page's locators and actions.
- **co-05 · network-interception** — intercepting, inspecting, or mocking a request.
- **co-06 · trace-viewer** — a recorded, replayable trace of a failing run.
- **co-07 · visual-comparison** — a pixel or snapshot comparison against a baseline.
- **co-08 · accessibility-scan** — an automated check for accessibility violations.
- **co-09 · test-isolation** — each test gets its own browser context.
- **co-10 · retry-policy** — how and when a flaky-looking test reruns, and why that is a last resort.
- **co-11 · parallel-sharding** — splitting a suite across workers safely.
- **co-12 · authentication-state** — reusing a logged-in session across tests.
- **co-13 · component-testing** — testing a UI component in isolation.
- **co-14 · api-testing** — using Playwright's request context to test an API directly.
- **co-15 · flakiness-diagnosis** — telling real flakiness from a genuine race in the app.
- **co-16 · ci-integration** — running headless, with traces and videos, in a pipeline.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Playwright's API surface (locators, waiting, network mocking, tracing) is best learned as many short, runnable, verifiable scripts, which is exactly what By Example provides.

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

Anchor runtimes: Node.js with the pinned TypeScript toolchain and the pinned Playwright browser binaries, run headless with no real network (local fixture server only), in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Locators and actions** (ex-01 to ex-08, 8 examples).
- **Cluster: Waiting and assertions** (ex-09 to ex-17, 9 examples).
- **Cluster: Fixtures and hooks** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Network interception and mocking** (ex-26 to ex-34, 9 examples).
- **Cluster: Page objects and suite structure** (ex-35 to ex-44, 10 examples).
- **Cluster: Authentication state reuse** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Visual and accessibility checks** (ex-54 to ex-61, 8 examples).
- **Cluster: Tracing and flakiness diagnosis** (ex-62 to ex-70, 9 examples).
- **Cluster: CI sharding and reporting** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a Playwright suite against a small fixture web app (served locally, no real network) covering navigation, a form, an authenticated page, and one intercepted API call, with a CI-style report and a trace captured on failure. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: fix a flaky locator; design a fixture for a logged-in state; decide what to mock versus run for real.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: replace a fixed delay with a real wait; convert a brittle selector into a resilient locator; intercept a request and assert on it.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example opens a real external site; every target is a local fixture server started by the `run.yaml`'s `services` block.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
