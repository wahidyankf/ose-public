# Cross-Platform Mobile with React Native (By Example)

**Course ID**: `cross-platform-mobile-with-react-native` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/mobile/tools/react-native` (6 files, 39,364 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches React Native's component, navigation, and state model for shared iOS/Android logic, tested at the JavaScript/TypeScript layer. It excludes native Android and iOS development, already in `android-app-development` and `ios-app-development`.

**Short summary**: One component tree, two native platforms; this course teaches what React Native shares and what it cannot.

## Why this exists · the big idea

- **The problem before the solution**: `android-app-development` and `ios-app-development` teach each platform's own native toolkit; nobody teaches the cross-platform React Native model that many teams choose instead of two native codebases.
- **Keep-this-if-you-forget-everything**: A React Native component is JavaScript logic plus a native view underneath; test the logic without the native view whenever you can.

## Learning objectives

After this course you can:

1. build React Native components with platform-shared logic and platform-specific overrides where needed.
2. navigate between screens with a typed, stack-and-tab navigation structure.
3. manage app state and side effects (data fetching, persistence) in a React Native app.
4. test component logic and navigation with a Node-based test runner, without an emulator.
5. explain where a feature needs a native module and how that module is bridged.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `frontend-essentials`.
- **Assumed knowledge**: Basic React component and hook concepts from frontend-essentials.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript using React Native, so `just-enough-typescript` and `frontend-essentials` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `frontend-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- React Native's own documentation, read and dated at writing time, since its native-module and architecture (bridge versus the newer architecture) have changed across releases.
- The pinned Node/TypeScript toolchain version and React Native version are the source of truth for any version-specific API.

## Concepts

- **co-01 · component-and-platform-override** — shared logic with a per-platform file or branch where needed.
- **co-02 · stack-navigation** — pushing and popping screens with a back stack.
- **co-03 · tab-navigation** — switching between sibling top-level screens.
- **co-04 · typed-navigation-params** — passing typed data between screens safely.
- **co-05 · state-management** — where app state lives and how it flows to components.
- **co-06 · data-fetching** — loading remote data and handling its loading and error states.
- **co-07 · local-persistence** — storing data on-device between app launches.
- **co-08 · native-module-bridge** — calling platform-native code from JavaScript.
- **co-09 · gesture-and-animation** — handling touch gestures and basic animation.
- **co-10 · accessibility-props** — exposing roles and labels for screen readers.
- **co-11 · testing-without-an-emulator** — testing component logic and navigation with a Node test runner.
- **co-12 · performance-list-rendering** — rendering a long list without dropping frames.
- **co-13 · platform-permission** — requesting a device permission and handling denial.
- **co-14 · over-the-air-update** — updating JavaScript without a full app-store release, and its limits.
- **co-15 · build-variant** — a debug versus release build and what differs.
- **co-16 · new-architecture-awareness** — what changed under React Native's newer architecture and why it matters for native modules.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: React Native's component, navigation, and state patterns are a set of small, independently runnable logic scenarios (testable at the JS/TS layer), which By Example teaches well without requiring an emulator for most of the course.

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

Anchor runtimes: Node.js with the pinned TypeScript toolchain, testing React Native component logic and navigation with a Node-based test runner (no emulator, no native build) for 7 of 9 anchors; 2 of 9 anchors use `mode: static` with reason `android` for native-module-bridge and build-variant examples that require an Android build tool to validate, not run.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): 2 of 9 anchors use `android` as the static reason (native-module-bridge compilation and build-variant configuration), since those need an Android build toolchain to validate, not just TypeScript logic.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Components and platform overrides** (ex-01 to ex-08, 8 examples).
- **Cluster: Stack navigation** (ex-09 to ex-17, 9 examples).
- **Cluster: Typed navigation params** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: State management and data fetching** (ex-26 to ex-34, 9 examples).
- **Cluster: Local persistence** (ex-35 to ex-44, 10 examples).
- **Cluster: Gesture and animation basics** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Native module bridge (static)** (ex-54 to ex-61, 8 examples).
- **Cluster: Performance list rendering** (ex-62 to ex-70, 9 examples).
- **Cluster: Testing without an emulator** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a small cross-platform task-tracker screen set (list, detail, and add-task screens) with typed navigation, local persistence, and a full test suite run without an emulator. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide what needs a platform override versus shared logic; diagnose a dropped-frame list render; design a typed navigation param set for a three-screen flow.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a typed navigation param; replace an untested native-module call with a tested JS wrapper; fix a list that re-renders every item on every scroll.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example requires a running emulator or simulator to pass; the 2 static-mode examples are validated (compiled or linted), not executed, with the reason `android` recorded in their `run.yaml`.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
