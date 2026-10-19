# Rust In Depth (By Example)

**Course ID**: `rust-in-depth` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust` (20 files, 108,663 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/cli-with-rust` (5 files, 33,733 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Rust itself in depth, beyond the `just-enough-rust` primer: idioms, the standard library, error handling, testing, and tooling a working Rust developer needs day to day. It excludes any specialized angle already owned by another course (noted in Why this exists).

**Short summary**: `just-enough-rust` gets you reading and writing Rust; this course gets you fluent in it.

## Why this exists · the big idea

- **The problem before the solution**: `just-enough-rust` is an explicit primer (1 to 15 estimated hours); nobody teaches Rust's idioms, standard library, error handling, and tooling at the depth this legacy corpus already reaches.
- **Keep-this-if-you-forget-everything**: Write Rust the way its own standard library and idiomatic style guide do, not the way your first language would.

## Learning objectives

After this course you can:

1. use Rust's idiomatic control flow, collections, and error-handling style instead of translating another language's style into it.
2. use Rust's standard library for common tasks (text, files, time, collections) without reaching for a dependency first.
3. write and run Rust's own standard test tooling, including a failing-test-first workflow.
4. package and build a small Rust project the idiomatic way, including its dependency and version-pinning convention.
5. read and explain a non-trivial, idiomatic Rust code sample written by someone else.

## Prerequisites

- **Prior courses**: `just-enough-rust`.
- **Assumed knowledge**: Comfort with Rust's basic syntax from just-enough-rust.
- **Language medium (prerequisite rubric rule L1)**: every example is Rust, so `just-enough-rust` is listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-rust`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Rust's own official documentation and standard-library reference, read and dated at writing time, since standard-library APIs change between versions.
- The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have.

## Concepts

- **co-01 · idiomatic-control-flow** — Rust's preferred way to branch, loop, and handle the common cases.
- **co-02 · error-handling-idiom** — Rust's own convention for a recoverable failure (exceptions, result types, or error values).
- **co-03 · collection-and-iteration** — the language's core collection types and how to iterate them idiomatically.
- **co-04 · standard-library-text-and-io** — reading, writing, and formatting text and files with the standard library.
- **co-05 · standard-library-time** — working with dates, times, and durations correctly.
- **co-06 · module-and-package-layout** — how a project's code is organized into reusable units.
- **co-07 · dependency-and-version-pinning** — the language's own convention for declaring and locking dependencies.
- **co-08 · testing-convention** — the standard or idiomatic way to write and run a test.
- **co-09 · concurrency-primitive-overview** — what the language offers for concurrent work, at a survey level.
- **co-10 · generic-or-polymorphic-code** — writing code that works over more than one type, idiomatically.
- **co-11 · immutability-and-value-semantics** — where the language favors immutable values over mutation.
- **co-12 · tooling-and-linting** — the language's standard formatter, linter, or static checker.
- **co-13 · interop-boundary** — calling into or being called from another language or runtime, at a survey level.
- **co-14 · idiomatic-naming-and-style** — the community style guide and why it exists.
- **co-15 · performance-aware-idiom** — a common idiom that exists specifically for performance, and its cost if skipped.
- **co-16 · reading-someone-elses-code** — a systematic way to read and explain an unfamiliar, idiomatic sample.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Rust fluency is best built from many small, independently runnable idiom demonstrations, which By Example teaches well and which matches this legacy corpus's own shape.

| Target             | Value                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                         |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                    |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                             |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                           |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                        |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                      |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                               |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: programming-languages`, no `status: outline` |

Anchor runtimes: Rust, standard library and Cargo only, no lockfile beyond Cargo.lock, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Idiomatic control flow and collections** (ex-01 to ex-08, 8 examples).
- **Cluster: Error-handling idiom** (ex-09 to ex-17, 9 examples).
- **Cluster: Standard library text, files, and time** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Modules, packages, and dependencies** (ex-26 to ex-34, 9 examples).
- **Cluster: Testing convention** (ex-35 to ex-44, 10 examples).
- **Cluster: Generics and value semantics** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Concurrency primitives (survey)** (ex-54 to ex-61, 8 examples).
- **Cluster: Tooling, linting, and style** (ex-62 to ex-70, 9 examples).
- **Cluster: Reading and explaining idiomatic code** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a small, idiomatic Rust command-line tool (reads input, transforms it, writes output) using the standard library's testing convention, the idiomatic error-handling style, and the standard dependency-pinning convention, with a golden expected transcript. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: rewrite a non-idiomatic Rust sample (translated from another language) into idiomatic Rust; choose the right error-handling approach for three different failure scenarios; find the standard-library function that replaces a hand-rolled helper.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: convert an exception-style error into the language's idiomatic error-handling style (or vice versa, whichever is not the default); write a test using the standard testing convention; replace a hand-rolled utility with its standard-library equivalent.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every example's pinned Rust toolchain version is the one declared in `apps/ayokoding-cli`; a change to that pinned version triggers the full examples run (plan 05's toolchain-change rule).

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
