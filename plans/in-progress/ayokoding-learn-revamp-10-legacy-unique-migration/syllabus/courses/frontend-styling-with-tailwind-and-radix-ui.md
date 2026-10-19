# Frontend Styling with Tailwind CSS and Radix UI (Annotated-Concept)

**Course ID**: `frontend-styling-with-tailwind-and-radix-ui` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/fe-tailwindcss` (7 files, 33,580 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/web/tools/fe-radix-ui` (7 files, 35,262 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches utility-first styling with Tailwind CSS and unstyled, accessible component primitives with Radix UI, used together. It excludes general CSS fundamentals and general accessibility, already touched in `frontend-essentials` and `advanced-frontend`.

**Short summary**: Tailwind styles the pixels; Radix UI supplies the accessible behaviour; this course teaches both so neither is copied in without understanding.

## Why this exists · the big idea

- **The problem before the solution**: `advanced-frontend` mentions Tailwind in passing (14 mentions) and Radix UI not at all as a subject (the earlier 10-mention hit was a false match on 'radix' meaning number base, not the library); nobody teaches either as a dedicated subject.
- **Keep-this-if-you-forget-everything**: Reach for Radix UI's primitive before you reach for a `<div>` with manual keyboard handlers.

## Learning objectives

After this course you can:

1. build a responsive layout and a design-token-consistent component using Tailwind's utility classes.
2. configure Tailwind's design tokens (color, spacing, typography) so a team cannot drift from them by accident.
3. use Radix UI primitives (dialog, dropdown, tooltip, tabs) to get correct keyboard and focus behaviour for free.
4. compose Tailwind classes onto a Radix UI primitive without breaking its accessibility guarantees.
5. test that a composed component keeps its accessible role, focus order, and keyboard behaviour.

## Prerequisites

- **Prior courses**: `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`.
- **Assumed knowledge**: Basic CSS and React component concepts.
- **Language medium (prerequisite rubric rule L1)**: every example is TypeScript and CSS using Tailwind CSS and Radix UI inside a React component, so `just-enough-typescript`, `frontend-essentials`, and `advanced-frontend` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-typescript`, `frontend-essentials`, `advanced-frontend`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Tailwind CSS's and Radix UI's own documentation, read and dated at writing time, for current utility names and primitive APIs.
- The pinned Node/TypeScript toolchain versions are the source of truth for any version-specific class name or primitive prop.

## Concepts

- **co-01 · utility-first-styling** — composing small, single-purpose classes instead of writing custom CSS.
- **co-02 · design-token** — a named, constrained value for color, spacing, or type.
- **co-03 · responsive-variant** — a utility applied only above or below a breakpoint.
- **co-04 · state-variant** — a utility applied only on hover, focus, or another state.
- **co-05 · design-system-constraint** — configuring Tailwind so arbitrary values cannot drift from the token set.
- **co-06 · unstyled-primitive** — a Radix UI component that supplies behaviour, not appearance.
- **co-07 · accessible-focus-management** — where focus goes when a dialog or menu opens and closes.
- **co-08 · keyboard-interaction-pattern** — the expected key bindings for a given widget role (menu, tabs, dialog).
- **co-09 · composition-over-configuration** — wrapping a primitive instead of reimplementing its behaviour.
- **co-10 · portal-rendering** — rendering an overlay outside its logical DOM parent.
- **co-11 · controlled-vs-uncontrolled-state** — who owns a primitive's open/closed or selected state.
- **co-12 · aria-role-and-label** — the accessible role and name a styled primitive must keep.
- **co-13 · class-merging** — safely combining conditional Tailwind classes without conflicts.
- **co-14 · theming** — supporting a light and dark variant consistently.
- **co-15 · accessibility-testing** — automated checks for role, focus order, and keyboard behaviour.
- **co-16 · performance-of-utility-css** — why a utility-first stylesheet stays small as a project grows.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Each theme (tokens, responsive variants, a Radix primitive's behaviour contract) benefits from a diagram-first walkthrough of the accessibility and composition rules, which Annotated-Concept supports better than a flat example list.

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

Anchor runtimes: Node.js with the pinned TypeScript toolchain, rendering components with Testing Library and checking accessible roles and keyboard behaviour (no real browser), in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Utility-first styling basics** (page `learning/theme-a-utility-first-styling-basics.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Design tokens and constraints** (page `learning/theme-b-design-tokens-and-constraints.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Responsive and state variants** (page `learning/theme-c-responsive-and-state-variants.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Radix UI primitives: dialog and dropdown** (page `learning/theme-d-radix-ui-primitives:-dialog-and-dropdown.md`; ex-16 to ex-21, 6 examples).
- **Theme E: Radix UI primitives: tabs and tooltip** (page `learning/theme-e-radix-ui-primitives:-tabs-and-tooltip.md`; ex-22 to ex-27, 6 examples).
- **Theme F: Focus management and keyboard patterns** (page `learning/theme-f-focus-management-and-keyboard-patterns.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: Composing Tailwind onto Radix primitives** (page `learning/theme-g-composing-tailwind-onto-radix-primitives.md`; ex-34 to ex-38, 5 examples).
- **Theme H: Theming (light and dark)** (page `learning/theme-h-theming-(light-and-dark).md`; ex-39 to ex-43, 5 examples).
- **Theme I: Accessibility testing** (page `learning/theme-i-accessibility-testing.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Build a small settings-panel UI (a dialog, a dropdown menu, and tabs) styled with Tailwind and built on Radix UI primitives, with an automated accessibility and keyboard-behaviour test suite and a light/dark theme. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: fix a dialog that traps focus incorrectly; design a token set for a two-theme product; merge conditional Tailwind classes without a conflict.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a keyboard shortcut to a Radix primitive without breaking its default behaviour; convert a hand-rolled dropdown into a Radix primitive; add a dark-mode variant to an existing component.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every accessibility assertion checks a real ARIA role, name, or keyboard event, not just a visual snapshot.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
