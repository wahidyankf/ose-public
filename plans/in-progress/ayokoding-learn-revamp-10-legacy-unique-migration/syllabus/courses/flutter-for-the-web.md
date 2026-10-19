# Flutter for the Web (By Example)

**Course ID**: `flutter-for-the-web` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/dart-flutter-web` (5 files, 37,569 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches deploying a Flutter app to the web target: rendering trade-offs, routing, responsive layout, and the service-worker and PWA concerns specific to the web build. It excludes Flutter's mobile and desktop targets, already in `hybrid-app-development`.

**Short summary**: The same widget tree now has to behave like a web page: a URL, a back button, and a first paint budget; this course covers what changes.

## Why this exists · the big idea

- **The problem before the solution**: `hybrid-app-development` ships one Flutter app to mobile and desktop; nobody teaches the web target's specific concerns (routing that matches browser history, responsive breakpoints, first-paint size, service workers).
- **Keep-this-if-you-forget-everything**: A Flutter web app still needs a real URL for every screen a user might bookmark or share.

## Learning objectives

After this course you can:

1. configure a Flutter project's web build and explain its renderer trade-offs.
2. wire Flutter's router to real, bookmarkable URLs with correct browser back/forward behaviour.
3. build responsive layouts that adapt across phone-, tablet-, and desktop-sized browser windows.
4. reduce first-paint size and measure the result.
5. add a service worker and basic PWA metadata to a Flutter web build.

## Prerequisites

- **Prior courses**: `just-enough-dart`, `hybrid-app-development`.
- **Assumed knowledge**: Basic Flutter widget-tree concepts from hybrid-app-development.
- **Language medium (prerequisite rubric rule L1)**: every example is Dart/Flutter targeting the web build, so `just-enough-dart` and `hybrid-app-development` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-dart`, `hybrid-app-development`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Flutter's own web-support documentation, read and dated at writing time, since web-renderer support has changed across releases.
- The pinned Flutter toolchain version is the source of truth for any version-specific flag or API.

## Concepts

- **co-01 · web-renderer** — how Flutter paints to the browser's canvas or DOM.
- **co-02 · deep-linkable-route** — a URL that reloads directly into the right screen.
- **co-03 · browser-history-integration** — making the browser back button do the right thing.
- **co-04 · responsive-breakpoint** — a layout decision keyed to window width.
- **co-05 · first-paint-budget** — how much must load before the user sees something useful.
- **co-06 · code-splitting** — loading only the code a route needs.
- **co-07 · asset-optimization** — shipping images and fonts sized for the web.
- **co-08 · service-worker** — offline caching and update behaviour for a web app.
- **co-09 · pwa-manifest** — the metadata that lets a browser treat the app like an installable app.
- **co-10 · accessibility-on-web** — keyboard focus and screen-reader behaviour in a Flutter web app.
- **co-11 · seo-limitation** — what a client-rendered Flutter web app cannot offer a search crawler.
- **co-12 · platform-detection** — branching behaviour only where the web target truly differs.
- **co-13 · state-restoration** — recovering UI state after a browser reload.
- **co-14 · web-specific-testing** — testing the web build's routing and layout.
- **co-15 · build-size-measurement** — measuring and tracking the compiled web bundle's size.
- **co-16 · deployment-target** — serving a Flutter web build from a static host.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each web-specific concern (routing, responsiveness, paint budget, service worker) is best shown as a runnable, checkable example against a real Flutter web build, matching the By Example pattern already used for `hybrid-app-development`.

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

Anchor runtimes: Dart/Flutter, building for the web target and testing with Flutter's widget-test harness (no real browser launch required for correctness checks), in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Web build configuration** (ex-01 to ex-08, 8 examples).
- **Cluster: Deep-linkable routes** (ex-09 to ex-17, 9 examples).
- **Cluster: Responsive breakpoints** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Browser history integration** (ex-26 to ex-34, 9 examples).
- **Cluster: First-paint budget and code splitting** (ex-35 to ex-44, 10 examples).
- **Cluster: Asset optimization** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Service worker and PWA manifest** (ex-54 to ex-61, 8 examples).
- **Cluster: Accessibility on the web** (ex-62 to ex-70, 9 examples).
- **Cluster: Build-size measurement over time** (ex-71 to ex-78, 8 examples).

## Capstone spec

Convert a small fixture Flutter app (from the hybrid-app-development capstone shape) to a deployable web build with deep-linkable routes, a responsive layout, a service worker, and a measured first-paint budget, with a golden build-size report. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose a renderer for a given app's needs; design a responsive breakpoint set for three device classes; diagnose a slow first paint from a build report.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a deep-linkable route; wire browser back/forward correctly; add a service worker with a cache-busting update strategy.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Build-size and first-paint measurements compare against a golden fixture report; no example requires a real browser launch, since widget tests run headless.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
