# Web Backends in the JVM with Vert.x (By Example)

**Course ID**: `web-backends-in-the-jvm-with-vertx` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/jvm-vertx` (5 files, 33,246 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Vert.x as a dedicated HTTP backend framework in the JVM: routing, middleware, request and response handling, and testing. It excludes general backend architecture, already in `backend-essentials` and `backend-at-scale`, which use Python and FastAPI.

**Short summary**: Vert.x has its own routing, middleware, and concurrency model; this course teaches it in the JVM the way `backend-essentials` teaches FastAPI in Python.

## Why this exists · the big idea

- **The problem before the solution**: `backend-essentials` and `backend-at-scale` are Python and FastAPI specific; nobody teaches the JVM developers Vert.x's own framework idioms at the depth this legacy corpus already reaches.
- **Keep-this-if-you-forget-everything**: A route handler is a pure function from request to response until you deliberately reach for shared state.

## Learning objectives

After this course you can:

1. define routes, handlers, and middleware in Vert.x for a small HTTP service.
2. parse and validate a request body and return a typed, well-formed response.
3. use Vert.x's own concurrency model correctly under concurrent requests.
4. write automated tests against the running service without a real network call.
5. compare Vert.x's design choices (routing, middleware, error handling) against the FastAPI backend course's choices.

## Prerequisites

- **Prior courses**: `just-enough-java`, `backend-essentials`.
- **Assumed knowledge**: Basic HTTP concepts (methods, status codes, headers) from backend-essentials.
- **Language medium (prerequisite rubric rule L1)**: every example is written in the JVM using Vert.x, so `just-enough-java` is listed; `backend-essentials` supplies the shared HTTP vocabulary for comparison. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-java`, `backend-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Vert.x's own documentation, read and dated at writing time, for API shape and version-specific behaviour.
- The pinned toolchain version is the source of truth for any version-specific syntax.

## Concepts

- **co-01 · route-definition** — mapping a method and path to a handler.
- **co-02 · middleware** — code that runs before or after a handler for every matching route.
- **co-03 · request-parsing** — reading path, query, header, and body data into typed values.
- **co-04 · response-shaping** — producing a status code, headers, and body consistently.
- **co-05 · error-handling** — converting a failure into a well-formed error response.
- **co-06 · dependency-injection** — supplying a handler with the services it needs.
- **co-07 · concurrency-model** — how Vert.x runs many requests at once.
- **co-08 · graceful-shutdown** — finishing in-flight requests before stopping.
- **co-09 · testing-without-network** — exercising a handler in-process instead of over a real socket.
- **co-10 · validation** — rejecting a malformed request before it reaches business logic.
- **co-11 · routing-group** — nesting or grouping related routes.
- **co-12 · content-negotiation** — choosing a response format from the request's Accept header.
- **co-13 · structured-logging** — emitting logs a machine can parse.
- **co-14 · health-check-endpoint** — a route that reports service readiness.
- **co-15 · static-typing-at-the-boundary** — typed request and response models at the HTTP edge.
- **co-16 · framework-trade-off** — where Vert.x's design costs more or less than FastAPI's.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Vert.x's API surface (routing, middleware, request/response handling) is a set of small, independently runnable server scenarios, which By Example teaches well, matching the pattern already used for `backend-essentials`.

| Target             | Value                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                           |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                      |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                               |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                             |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                          |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                        |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                                 |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: application-development`, no `status: outline` |

Anchor runtimes: Java (the JVM) on the merged `java` toolchain's hash-locked jar recipe (no recipe change needed), with Vert.x's event-loop and verticle model (`io.vertx:vertx-core`, `vertx-web`, and `vertx-web-client` 5.2.1 in `learning/code/jars.lock`), no external service, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Routes and handlers** (ex-01 to ex-08, 8 examples).
- **Cluster: Request parsing and validation** (ex-09 to ex-17, 9 examples).
- **Cluster: Response shaping and status codes** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Middleware and error handling** (ex-26 to ex-34, 9 examples).
- **Cluster: Dependency injection** (ex-35 to ex-44, 10 examples).
- **Cluster: Testing without a real network call** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Concurrency under load** (ex-54 to ex-61, 8 examples).
- **Cluster: Graceful shutdown** (ex-62 to ex-70, 9 examples).
- **Cluster: Comparing design choices against FastAPI** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a small order-tracking HTTP service in Vert.x with five routes, request validation, structured error responses, a health-check endpoint, and an in-process test suite, matching the shape of the `backend-essentials` capstone for direct comparison. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: design a middleware chain for authentication and logging; decide what belongs in a handler versus a dependency; diagnose a concurrency bug under load.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add request validation that rejects a malformed body; convert a blocking call into the framework's async idiom; write an in-process test for a new route.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every test exercises the service in-process (no real socket, no real network); the service binds to a loopback test port chosen by the harness, never a fixed port.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
