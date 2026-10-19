# Modern Frontend Meta-Frameworks: Next.js and TanStack Start (Annotated-Concept)

**Course ID**: `modern-frontend-meta-frameworks` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/fe-nextjs` (13 files, 56,298 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/fe-tanstack-start` (5 files, 30,342 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches the meta-framework layer on top of a component library: file-based routing, server rendering and data loading, and deployment. It excludes component-level React teaching, already in `frontend-essentials` and `advanced-frontend`.

**Short summary**: A meta-framework decides where your code runs (server or browser) and when; this course teaches that decision in two frameworks that make it differently.

## Why this exists · the big idea

- **The problem before the solution**: `advanced-frontend` mentions Next.js only in passing (9 mentions, not a dedicated subject) and never covers TanStack Start; nobody teaches file-based routing, server rendering, and data loading as a dedicated, compared subject.
- **Keep-this-if-you-forget-everything**: Decide, per page, what must run on the server and what can run in the browser, and let the framework's routing convention make that decision visible.

## Learning objectives

After this course you can:

1. build file-based routes with layouts and nested routes in both frameworks.
2. load data on the server before a page renders, and explain when that beats client-side fetching.
3. choose between server-rendered, statically generated, and client-rendered pages for a given use case.
4. handle a server action or mutation safely from a client component.
5. compare Next.js's and TanStack Start's routing and data-loading conventions on the same example app.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`.
- **Assumed knowledge**: Basic React component and hook concepts.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript using Next.js or TanStack Start, so `just-enough-typescript`, `frontend-essentials`, and `advanced-frontend` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Both frameworks' own documentation, read and dated at writing time, since their routing and data-loading conventions change between major versions.
- The pinned Node/TypeScript toolchain versions are the source of truth for any version-specific API.

## Concepts

- **co-01 · file-based-routing** — a route determined by a file's path in the project.
- **co-02 · nested-layout** — a layout shared by a route and its children.
- **co-03 · server-rendering** — producing HTML on the server before sending it to the browser.
- **co-04 · static-generation** — pre-rendering a page at build time.
- **co-05 · client-rendering** — rendering entirely in the browser after a JavaScript bundle loads.
- **co-06 · server-data-loading** — fetching the data a page needs before it renders, on the server.
- **co-07 · server-action** — a server-side mutation callable from a client component.
- **co-08 · streaming-response** — sending a page's HTML progressively as pieces become ready.
- **co-09 · route-parameter** — a dynamic segment of a file-based route.
- **co-10 · caching-strategy** — how a meta-framework caches a rendered page or a data fetch.
- **co-11 · hydration** — attaching client-side interactivity to server-rendered HTML.
- **co-12 · error-boundary-route** — a route-level fallback for a failed render or load.
- **co-13 · type-safe-routing** — routes and their parameters checked by the type system.
- **co-14 · deployment-target** — where a rendered or static output actually runs.
- **co-15 · framework-comparison** — where Next.js's and TanStack Start's conventions agree and differ.
- **co-16 · progressive-enhancement** — a page that works before its JavaScript has loaded.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Each cross-cutting concept (routing, rendering mode, data loading, actions) benefits from a themed, diagram-first walkthrough comparing both frameworks side by side, which Annotated-Concept supports better than a flat example list.

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

Anchor runtimes: Node.js with the pinned TypeScript toolchain, server-rendering and testing both frameworks' dev/build output without a real browser (a headless request against the built server), in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: File-based routing** (page `learning/theme-a-file-based-routing.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Nested layouts** (page `learning/theme-b-nested-layouts.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Server rendering** (page `learning/theme-c-server-rendering.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Static generation** (page `learning/theme-d-static-generation.md`; ex-16 to ex-21, 6 examples).
- **Theme E: Server data loading** (page `learning/theme-e-server-data-loading.md`; ex-22 to ex-27, 6 examples).
- **Theme F: Server actions and mutations** (page `learning/theme-f-server-actions-and-mutations.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: Caching and streaming** (page `learning/theme-g-caching-and-streaming.md`; ex-34 to ex-38, 5 examples).
- **Theme H: Type-safe routing** (page `learning/theme-h-type-safe-routing.md`; ex-39 to ex-43, 5 examples).
- **Theme I: Framework comparison and trade-offs** (page `learning/theme-i-framework-comparison-and-trade-offs.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Build the same small product-catalog app (list, detail, and a mutating action) twice, once in Next.js and once in TanStack Start, with an identical route and data-loading shape, and write a comparison report. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose a rendering mode for three different page types; design a caching strategy for a frequently read, rarely written page; diagnose a hydration mismatch.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: convert a client-rendered page to server-rendered; add a type-safe dynamic route parameter; add a server action with proper error handling.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every example is checked against the framework's built server output with a local request, never a real deployed URL.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
