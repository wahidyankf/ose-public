# Usability Evaluation: ayokoding-www Cost-of-Living / Salary Calculator

> **SUPERSEDED (2026-06-20)** — A fresh, re-verified combined exploratory + usability fix plan now
> covers this surface end-to-end (findings + tech-docs + TDD delivery + UI mockups). Use this archived
> copy only as historical context; the live work is in
> **[`plans/in-progress/ayokoding-www-cost-of-living-calc-test-fixing`](../../in-progress/ayokoding-www-cost-of-living-calc-test-fixing/README.md)**.

**Plan status**: Superseded (was In Progress)
**Evaluation date**: 2026-06-19
**Plan path**: `plans/in-progress/ayokoding-www-calc-usability-findings/`

## Context

This plan documents a spec-blind heuristic usability evaluation of the ayokoding-www Salary Savings
Calculator at `http://localhost:3101/en/tools/cost-of-living-calculator` (English) and
`http://localhost:3101/id/tools/cost-of-living-calculator` (Indonesian / Bahasa Indonesia). The
evaluator worked as a first-time visitor with no prior context, no access to specs, source, or
mockups. Ground truth was established usability principles, prevailing web conventions, and the
page's own internal consistency.

## Target URLs and Environment

| Property          | Value                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| English URL       | `http://localhost:3101/en/tools/cost-of-living-calculator`                                         |
| Indonesian URL    | `http://localhost:3101/id/tools/cost-of-living-calculator`                                         |
| App               | `ayokoding-www` (Next.js 16, dev server port 3101)                                                 |
| Evaluation date   | 2026-06-19                                                                                         |
| Browser           | Chromium (Playwright headless)                                                                     |
| Evaluation method | Heuristic evaluation (Nielsen 10) + Cognitive walkthrough + URL naturalness + Responsive usability |

## Usability Goal

Evaluate whether a first-time visitor can understand and use this cost-of-living / salary calculator
without instructions — judging predictability, information scent, cognitive load, learnability,
feedback, error prevention/recovery, and consistent behaviour across breakpoints and locales.

## Persona

First-time visitor: a software professional considering international relocation, with no prior
knowledge of AyoKoding or this tool. English primary; Indonesian secondary persona. Uses both
mobile and desktop devices.

## Tasks Evaluated

1. Orient to the page: understand what this tool does and what the three tabs offer.
2. Filter by region/country/city and read the resulting cost estimate.
3. Enter a salary in the Savings tab and interpret the comparison table.
4. Determine what role/salary is the minimum viable in a target city (Minimum role tab).
5. Switch to the Indonesian locale and confirm equivalence.

## Depth

Standard plus thorough URL/IA naturalness and responsive check (320, 375, 768, 1280, 1440).

## Coverage Map

| Dimension                                               | Covered     | Breakpoints / Locales     | Notes                                                         |
| ------------------------------------------------------- | ----------- | ------------------------- | ------------------------------------------------------------- |
| Predictability / conformity                             | Yes         | 1280, 375                 | Desktop and mobile                                            |
| Internal consistency                                    | Yes         | 1280, 375, 768            | Across tabs and locales                                       |
| External consistency                                    | Yes         | 1280                      | Convention checks via web research                            |
| Information scent / wayfinding                          | Yes         | 1280, 375                 | Nav, links, tab labels                                        |
| Information flow / visual hierarchy                     | Yes         | 1280, 1440, 375, 320, 768 | All breakpoints                                               |
| Recognition over recall                                 | Yes         | 1280, 375                 | Filter state, tab state                                       |
| Feedback / system status                                | Yes         | 1280, 375                 | Salary input, area toggle, URL params                         |
| Error prevention / recovery                             | Yes         | 1280                      | Zero-salary state, invalid param state                        |
| Cognitive load / decision cost                          | Yes         | 1280, 375, 768            | Table density, terminology                                    |
| Affordance / clickability                               | Yes         | 375                       | Touch targets per WCAG 2.5.8                                  |
| URL naturalness / IA legibility                         | Yes         | —                         | Curl + Playwright URL probes                                  |
| Responsive usability                                    | Yes         | 320, 375, 768, 1280, 1440 | All five breakpoints                                          |
| Deep a11y audit (contrast, ARIA wiring, keyboard traps) | Not covered | —                         | Deferred to `swe-ui-checker`                                  |
| Form submission / error messages                        | Partially   | 1280                      | No invalid-input states triggered; no submission form present |

## Overall Usability Impression

The calculator delivers substantial data but presents several first-timer friction points. The most
critical are: (1) the page H1 says "Salary Savings Calculator" while the URL slug reads
`cost-of-living-calculator` — a direct scent mismatch that confuses orientation and search-engine
linking; (2) the `html[lang]` attribute remains `en` on the Indonesian locale page — a WCAG 3.1.1
failure that breaks screen readers and browser translation for ID users; (3) the `Total` column in
the cost-of-living table silently exceeds the "Total" shown in the summary card by a constant
amount (250 SGD for Singapore) with no explanation — users cannot tell which number to trust;
(4) filter selects (Region, Country, City) are below the 44 px touch target recommendation and
below the 29 px mark on mobile; and (5) visiting a URL with state parameters (`?tab=cost&country=sg`)
does not update the visible filter dropdowns, so a bookmarked or shared URL silently ignores
user-set context. All five are reproducible across locales and breakpoints.

## Document Map

| Document                | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `README.md` (this file) | Context, coverage, overall impression                          |
| `brd.md`                | Business framing: cost of friction, success metrics            |
| `prd.md`                | Personas, user stories, Gherkin acceptance criteria            |
| `findings.md`           | Usability finding catalog (UWT-001 … UWT-014), severity-sorted |
| `walkthrough.md`        | Step-by-step cognitive walkthrough transcripts                 |

## Spec-Blind Discipline

This evaluation deliberately did not read `specs/**`, app source, i18n catalogs, design mockups,
or PRDs. Every "expected" behaviour stated in `findings.md` is grounded in a named usability
principle or established web convention, not in product intent. There is therefore no
`spec-gaps.md` — proposing spec coverage requires knowing what the spec says, which this agent
refuses to learn.

## Promotion Path

When promoted to `plans/in-progress/` (already there), `plan-maker` should add `tech-docs.md` and
`delivery.md` with TDD-shaped delivery steps. `tech-docs.md` and `delivery.md` are intentionally
absent here — they are produced by `plan-maker` during promotion grilling.

## Screenshots Evidence Trail

All screenshots are saved to `local-temp/` with prefix `uwt-`:

- `uwt-desktop-1280-en-initial.png` — initial desktop state, English
- `uwt-desktop-1440-en.png` — wide desktop
- `uwt-desktop-1280-id.png` — Indonesian locale desktop
- `uwt-mobile-375-en-initial.png` — mobile initial state
- `uwt-mobile-320-en.png` — 320 px reflow
- `uwt-tablet-768-en.png` — tablet
- `uwt-desktop-savings-zero.png` — savings tab at zero salary
- `uwt-desktop-savings-8000.png` — savings tab with salary entered
- `uwt-desktop-minrole-full.png` — minimum role tab controls
- `uwt-mobile-375-savings-detail.png` — savings tab on mobile
- `uwt-mobile-375-costtab-detail.png` — cost tab on mobile
- `uwt-desktop-area-rural.png` — after Rural area toggle
- `uwt-desktop-url-param-country.png` — URL param state (filter mismatch)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
