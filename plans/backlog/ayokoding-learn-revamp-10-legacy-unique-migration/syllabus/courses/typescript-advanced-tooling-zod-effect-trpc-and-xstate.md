# TypeScript Advanced Tooling: Zod, Effect, tRPC, and XState (Annotated-Concept)

**Course ID**: `typescript-advanced-tooling-zod-effect-trpc-and-xstate` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/ts-zod` (7 files, 28,397 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/ts-effect` (6 files, 38,237 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/ts-trpc` (6 files, 29,984 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/ts-xstate` (6 files, 63,421 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches four widely used TypeScript libraries that each close a specific typed-safety gap: runtime validation (Zod), typed effects and errors (Effect), end-to-end typed APIs (tRPC), and explicit state machines (XState). It excludes `type-systems`' language-level type theory.

**Short summary**: TypeScript's compiler cannot see a network boundary, an error path, or a UI's valid states; these four libraries each make one of those visible to the type checker.

## Why this exists · the big idea

- **The problem before the solution**: `type-systems` teaches the language's own type features; `object-oriented-design-and-patterns` only mentions finite-state-machine concepts generically (48 mentions of the concept, none of the XState library); nobody teaches these four specific, widely used libraries.
- **Keep-this-if-you-forget-everything**: If a boundary can fail (a network call, a JSON payload, a UI flow), make its valid shapes and transitions something the type checker can check.

## Learning objectives

After this course you can:

1. validate untrusted input at a boundary with Zod and derive a static type from the same schema.
2. model an operation that can fail with Effect's typed error channel instead of throwing.
3. build an end-to-end typed API with tRPC so a client and server share one source of truth for types.
4. model a UI flow as an explicit state machine with XState and render different views per state.
5. decide which of the four tools (if any) a given problem actually needs.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `frontend-essentials`.
- **Assumed knowledge**: Basic TypeScript generics and union types.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript using Zod, Effect, tRPC, or XState, so `just-enough-typescript` and `frontend-essentials` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `frontend-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Each library's own documentation, read and dated at writing time, since all four have had breaking major-version changes.
- The pinned Node/TypeScript toolchain versions are the source of truth for any version-specific API.

## Concepts

- **co-01 · schema-as-single-source-of-truth** — deriving a static type from a runtime-checked schema instead of writing both by hand.
- **co-02 · parse-dont-validate** — turning untrusted input into a trusted, typed value once, at the boundary.
- **co-03 · typed-error-channel** — a function signature that states what it can fail with.
- **co-04 · effect-composition** — combining effects (including failures) without nested try/catch.
- **co-05 · dependency-injection-via-effect** — supplying a typed dependency an effect needs to run.
- **co-06 · end-to-end-type-inference** — a client that knows a server procedure's input and output types without codegen.
- **co-07 · procedure-and-router** — tRPC's unit of a typed remote call and how routers compose.
- **co-08 · state-machine** — a model with named states and guarded, explicit transitions.
- **co-09 · state-chart** — nested and parallel states for a non-trivial UI flow.
- **co-10 · guard-and-action** — a condition that allows a transition, and a side effect a transition triggers.
- **co-11 · invalid-state-elimination** — making an impossible UI state unrepresentable.
- **co-12 · library-interoperability** — using more than one of these four libraries together coherently.
- **co-13 · runtime-vs-compile-time-safety** — what each library checks at runtime versus what TypeScript alone checks at compile time.
- **co-14 · migration-cost** — what adopting one of these libraries costs an existing codebase.
- **co-15 · tool-selection** — matching a specific gap (validation, errors, API typing, UI flow) to the right tool.
- **co-16 · testing-each-tool** — testing a Zod schema, an Effect pipeline, a tRPC procedure, and an XState machine.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Four distinct libraries each need their own themed walkthrough with diagrams (a schema, an effect pipeline, a typed RPC call, a state chart), which Annotated-Concept supports and a single flat example list would blur together.

| Target                         | Value                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                              |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                         |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                                    |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                           |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                                   |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                        |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                                 |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: application-development`, no `status: outline` |

Anchor runtimes: Node.js with the pinned TypeScript toolchain, no network (tRPC examples use an in-process client-server pair), in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Zod schemas and inference** (page `learning/theme-a-zod-schemas-and-inference.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Parsing untrusted input** (page `learning/theme-b-parsing-untrusted-input.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Effect's typed errors** (page `learning/theme-c-effect's-typed-errors.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Effect composition and dependencies** (page `learning/theme-d-effect-composition-and-dependencies.md`; ex-16 to ex-21, 6 examples).
- **Theme E: tRPC procedures and routers** (page `learning/theme-e-trpc-procedures-and-routers.md`; ex-22 to ex-27, 6 examples).
- **Theme F: End-to-end type inference** (page `learning/theme-f-end-to-end-type-inference.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: XState machines and transitions** (page `learning/theme-g-xstate-machines-and-transitions.md`; ex-34 to ex-38, 5 examples).
- **Theme H: State charts (nested and parallel)** (page `learning/theme-h-state-charts-(nested-and-parallel).md`; ex-39 to ex-43, 5 examples).
- **Theme I: Choosing and combining the four tools** (page `learning/theme-i-choosing-and-combining-the-four-tools.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Build a small typed order-submission flow: a Zod-validated input schema, an Effect pipeline that can fail with typed errors, a tRPC procedure exposing it end to end, and an XState machine driving the submission UI through its states. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide whether a given bug is a validation gap, an untyped error path, an API type mismatch, or a missing UI state; redesign a boolean-flag-heavy component as a state machine; add a new tRPC procedure to an existing router without breaking client types.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: convert a hand-written type guard into a Zod schema; convert a throwing function into an Effect with a typed error; add a guard to an XState transition.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example performs a real network call; the tRPC examples wire an in-process client directly to its server router.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
