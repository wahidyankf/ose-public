# Web Backends in Elixir with Phoenix and LiveView (By Example)

**Course ID**: `web-backends-in-elixir-with-phoenix-and-liveview` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/elixir-phoenix` (14 files, 67,071 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/elixir-phoenix-liveview` (13 files, 69,266 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Phoenix's HTTP and channel model and LiveView's server-rendered, stateful-process UI model together. It excludes general Elixir language material, covered by `elixir-in-depth`, and general OTP concurrency, covered by `actor-model-concurrency`.

**Short summary**: Phoenix handles the request; LiveView keeps a live process per connected user; this course teaches both as one coherent way to build a web app in Elixir.

## Why this exists · the big idea

- **The problem before the solution**: No course teaches Phoenix or LiveView; `backend-essentials` is Python and FastAPI specific, and `actor-model-concurrency` teaches OTP generically without the web-framework layer on top of it.
- **Keep-this-if-you-forget-everything**: A LiveView is a supervised process with state, not a page that re-renders from scratch.

## Learning objectives

After this course you can:

1. define Phoenix routes, controllers, and plugs for a conventional HTTP request.
2. build a LiveView that holds state in its process and re-renders only the changed part of the page.
3. handle real-time events with Phoenix channels and PubSub.
4. validate input with Ecto changesets at the web boundary.
5. test Phoenix controllers and LiveViews without a real browser.

## Prerequisites

- **Prior courses**: `just-enough-elixir`, `actor-model-concurrency`, `backend-essentials`.
- **Assumed knowledge**: Basic OTP concepts (process, supervisor) from actor-model-concurrency.
- **Language medium (prerequisite rubric rule L1)**: every example is Elixir using Phoenix and LiveView, so `just-enough-elixir` and `actor-model-concurrency` are listed; `backend-essentials` supplies shared HTTP vocabulary for comparison. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-elixir`, `actor-model-concurrency`, `backend-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- The Phoenix and LiveView documentation, read and dated at writing time, for API shape and version-specific behaviour.
- The pinned Elixir and Phoenix toolchain versions are the source of truth for any version-specific syntax.

## Concepts

- **co-01 · router-and-plug** — Phoenix's route table and its composable request pipeline.
- **co-02 · controller-action** — a conventional request-response handler.
- **co-03 · changeset** — Ecto's validated, trackable representation of a change.
- **co-04 · liveview-mount** — initializing a LiveView process's state for a connection.
- **co-05 · liveview-render** — producing the HTML a LiveView's state implies.
- **co-06 · liveview-event** — a client event handled by updating process state.
- **co-07 · diffed-update** — sending only the changed DOM, not a full page.
- **co-08 · channel** — a bidirectional, topic-based real-time connection.
- **co-09 · pubsub** — broadcasting a message to every interested process.
- **co-10 · presence** — tracking who is currently connected to a topic.
- **co-11 · process-per-connection** — one supervised process holding one user's live state.
- **co-12 · supervision-of-web-state** — what happens to a LiveView's state when its process crashes.
- **co-13 · form-handling** — validating and submitting a form through a changeset.
- **co-14 · testing-without-a-browser** — exercising a controller or LiveView in-process.
- **co-15 · telemetry** — Phoenix's built-in instrumentation events.
- **co-16 · framework-trade-off** — where this server-rendered, stateful-process model costs more or less than a client-rendered SPA.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Phoenix and LiveView's API surface (routes, changesets, mount/render/event, channels) is a set of small, independently runnable scenarios, which By Example teaches well.

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

Anchor runtimes: Elixir with the pinned Phoenix and LiveView toolchain, no external service, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Routes, controllers, and plugs** (ex-01 to ex-08, 8 examples).
- **Cluster: Changesets and validation** (ex-09 to ex-17, 9 examples).
- **Cluster: First LiveView: mount and render** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: LiveView events and diffed updates** (ex-26 to ex-34, 9 examples).
- **Cluster: Channels and PubSub** (ex-35 to ex-44, 10 examples).
- **Cluster: Presence tracking** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Supervision of live state** (ex-54 to ex-61, 8 examples).
- **Cluster: Form handling end to end** (ex-62 to ex-70, 9 examples).
- **Cluster: Testing without a browser** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a small live order-tracking dashboard: a Phoenix JSON API, a LiveView page that updates in real time via PubSub as orders change, and an in-process test suite for both. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide what belongs in process state versus a changeset; diagnose a LiveView that re-renders too much; design a channel topic structure for a multi-room feature.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a new LiveView event handler; add a channel broadcast on a state change; write an in-process test for a changeset validation.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every test exercises Phoenix and LiveView in-process (ExUnit's built-in test helpers), never a real browser or network socket.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
