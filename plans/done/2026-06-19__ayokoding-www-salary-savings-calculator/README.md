# ayokoding-www Cost of Living Calculator

> **Plan folder vs shipped tool**: this plan folder keeps its original slug
> (`ayokoding-www-salary-savings-calculator`), but the shipped tool's user-facing name is
> **Cost of Living Calculator** and its route is **`/[locale]/tools/cost-of-living-calculator`**.

Add a bilingual (en/id) interactive tool to `apps/ayokoding-www` — the **Cost of Living
Calculator** — that models the **real cost of living and net-of-tax savings** across major tech-hub
cities worldwide. The tool is organised into three distinct tabs: **Cost of living** (per-city
monthly expense-category breakdown + one-time relocation), **Savings** (gross salary → net take-home
→ savings across cities), and **Minimum role** (given a savings baseline, the lowest
**software-engineering** role anywhere that clears it). All tabs share a **Region → Country → City**
cascading filter (every row shows both Country and City, with both names as links), and clicking a
city name opens a single-city Cost-of-living **detail** view while clicking a country name opens the
Cost-of-living tab filtered to that country. Roles are software-engineering roles (IC + management),
with salaries modeled as a per-role × country p25 / median / p75 distribution. Every figure is a
modeled, confidence-tiered, snapshot-dated dataset value — there are no rule-of-thumb budgeting
percentages.

## Intended use

The tool is built for two real decisions:

- **Salary negotiation** — see a role's **p25 / median / p75** salary distribution per country plus
  the typical **non-salary comp** (RSU/equity + bonus) → total compensation, so you can benchmark a
  real offer and set a defensible target before or during a negotiation.
- **Relocation evaluation** — see **net-of-tax take-home**, the full per-category expense
  composition, **two savings figures** (after essentials, after lifestyle), and the one-time
  relocation budget (sunk costs + a liquidity reserve) per city, so you can compare destinations
  realistically rather than on gross salary alone.

## Status

Done (created 2026-06-16, completed 2026-06-19)

## Context

`ayokoding-www` is a bilingual educational site (Next.js 16, App Router, `[locale]` routing). Today
its pages are markdown-driven content. This plan adds the site's first **interactive tool page** — a
client-side calculator — establishing a `tools/` area that future calculators can reuse.

The tool answers three practical questions for tech workers and relocation planners: _"What does it
actually cost to live in each hub?"_, _"For my gross salary, where do I save most after tax?"_, and
_"For a savings goal, what is the lowest engineering role anywhere that reaches it?"_

## Scope

**In scope:**

- New interactive route `/[locale]/tools/cost-of-living-calculator` (client component).
- Shared across all three tabs: a **Region → Country → City** cascading filter (region narrows
  countries; country narrows cities), a **Country column immediately to the left of the City column**
  in every table, and **both Country and City names as links** — a City link opens a single-city
  Cost-of-living **detail** view (deep-linkable as `?tab=cost&city=<id>`), a Country link opens the
  Cost-of-living tab **filtered to that country** (deep-linkable as `?tab=cost&country=<id>`).
- Three tabs via a tab toggle:
  - **Cost of living** — no salary input; per city, the full monthly expense-category breakdown
    (housing, food, transport, utilities, healthcare, childcare, school, lifestyle) with an essentials
    subtotal and a total, plus a separate one-time **relocation sunk-cost** line and a separately
    labelled **liquidity reserve**, and an always-shown **healthcare funding-scheme** badge. The
    **Healthcare (OOP)** column header is explained on screen (**OOP = out-of-pocket** — healthcare you
    pay yourself, on top of any tax-funded or insurance coverage). Lists tech-hub cities worldwide,
    narrowed by the shared cascading filters; each city name links to its single-city detail.
  - **Savings** — enter a **gross salary** as **monthly or annual** (both shown; annual = 12 ×
    monthly), USD; for each city the tool converts gross to **net take-home** via the country's
    federal banded effective tax rate plus any city sub-national rate, subtracts the modeled
    essentials, and shows **two savings figures** (after essentials, and after lifestyle) with
    percentages across cities, sortable, plus an informational **non-salary comp** (RSU/equity +
    bonus) column and a **total compensation** view (base monthly + annual plus non-salary comp →
    total annual comp) for negotiation context.
  - **Minimum role** — set a savings **baseline** (own salary, a reference city + role, or a raw
    savings target), and the tool runs the canonical **software-engineering** role ladder (IC +
    management) through the same **net → essentials → essential-savings** engine using each role ×
    country's **median** salary, ranks roles by absolute USD **essential savings** (lifestyle
    excluded), marks the **lowest qualifier**, and **reorders** the ladder so qualifying roles sit
    above the minimum and non-qualifying roles below a divider. Each row shows the best city + its
    country, the role × country **p25 / median / p75** distribution, and the typical **non-salary
    comp → total compensation** (base + non-salary comp) for negotiation context. **Every money
    column — p25, median, p75, non-salary comp, total comp, and essential savings — is shown dual
    (the city's local currency + USD, with a user-chosen display currency on the primary line).** The
    same shared **household / area / school-type cost-basis controls** apply here, so the **minimum role
    depends on the household + area** (e.g. SWE I may suffice when single but not at married + 2 kids in
    the city center).
- Shared cost-basis controls (apply to all three tabs):
  - **Household** — single/married (1–2 adults) plus counts of pre-school children and school-age
    children (scales expenses on an OECD-modified basis; pre-school kids drive childcare, school-age
    kids drive schooling).
  - **Area** — city center vs rural (discounts mainly housing).
  - **School type** — public vs private median per-school-age-child cost, shown only when the
    household has school-age children.
- The **expense-composition model** (no budgeting heuristics): seven modeled monthly categories per
  city (incl. childcare), plus a per-country **federal banded effective tax rate** and per-city
  **sub-national** rate for US/CA/CH (`net = gross × (1 − (federalRate[band] + subNationalRate[band]))`),
  plus a per-city one-time **relocation** total split into sunk costs (deposit, key money, moving,
  visa/admin) and a liquidity-reserve cash cushion, all kept out of the monthly savings math.
- Modeled transport **assumes public transport** (a monthly transit pass) in every city; car
  ownership/fuel/parking is not modeled (fixed v1 assumption, not a toggle).
- Static, hand-curated, **`web-researcher`-sourced** datasets:
  - `fx.ts` — the authoritative **FX snapshot**: a table mapping ISO-4217 currency code → USD value
    per 1 unit, plus a `fxSnapshotDate`. This is the **single source** for every currency conversion
    in the app (local → USD, USD → chosen display currency); per-city `fxToUsd` is **derived** from
    this table via the city's `currency`.
  - `cities.ts` — per city: name (en/id), country FK, currency, the seven expense categories (incl.
    childcare), per-pre-school-child childcare median, per-school-age-child public/private school
    median, split one-time relocation components (sunk costs incl. key money + liquidity reserve), an
    optional sub-national tax rate (US/CA/CH), and a region tag; plus per-country federal banded
    effective tax rates + healthcare funding model and the shared OECD-modified household/area
    multipliers. The city's **FX-to-USD is sourced from `fx.ts`** (not a standalone hand-entered
    field). Every modeled cell carries a confidence tier (`high` | `moderate` | `proxy`) and the
    dataset carries a snapshot date.
  - `roles.ts` — the canonical **software-engineering** role ladder (IC + management) + a full role ×
    **country** gross-salary **distribution** (p25 / median / p75) plus a typical **non-salary comp**
    (annual RSU/equity + bonus) per role × country; cities inherit their country's distribution.
    Per-cell confidence-tiered and snapshot-dated.
- The whole feature is **client-side rendered (CSR)** — a `'use client'` page; no SSR of results, no
  backend, no runtime network.
- Pure calculation functions in `core/`, fully unit-tested (TDD).
- UI built from the shared `@open-sharia-enterprise/web-ui` kit; the one missing piece — a **`Table`**
  primitive shared by all three tabs — is added to `libs/web-ui` as a prerequisite (see delivery
  Phase 2).
- Bilingual UI strings (en/id) via the existing i18n mechanism.
- Vitest unit tests for the calculation modules and components; one fe-e2e smoke test.

**Out of scope (future iterations):**

- Live cost-of-living / FX / salary / **tax** APIs (datasets are static for v1).
- **Full progressive tax-bracket engines**, **social-contribution caps**, **benefits-in-kind**,
  **pension / retirement contribution modeling**, **clothing / personal-care as separate categories**,
  **PPP-adjusted (real purchasing-power) comparison**, **equity/RSU/bonus modeling into savings** (the
  typical non-salary comp is displayed as context only, never in the savings math), **per-city
  role-salary granularity** (salary is per role × country; cities inherit it), **deduction
  optimization**, **per-individual tax situations** — the tax model is a simplified federal +
  sub-national (US/CA/CH) banded effective rate only.
- Savings-rate goals, currency other than the city default, per-city household/area-cost overrides.
- Israeli cities are deliberately excluded from the dataset. This is a country-level choice about the
  state of Israel and its political stance, **not** a choice about any ethnic, racial, or religious
  group. People of any background are out of scope of the exclusion — only the country Israel and its
  political stance are.
- Persisting user inputs, sharing/export, charts.

## Approach Summary

1. **Phase 0 — Setup & baseline**: worktree, deps, green baseline for `ayokoding-www`.
2. **Phase 1 — FX + city data + calculation core (TDD)**: `fx.ts` (authoritative ISO-4217 → USD
   snapshot, the single source for all conversions) + `cities.ts` (per-category expenses incl.
   childcare + federal tax bands + per-city sub-national rates + healthcare model + split relocation,
   FX-to-USD derived from `fx.ts`, all `web-researcher`-sourced) + pure `calc` module (net via
   federal+sub-national bands, essentials sum, two savings figures, relocation split, conversions via
   `fx.ts`) with tests.
3. **Phase 1b — Role-salary data + reverse-lookup core (TDD)**: source the software-engineering role
   ladder + role × **country** salary distribution (p25/median/p75) + non-salary comp via
   `web-researcher` into `roles.ts`; add pure `geo-filter` selectors + `roleLookup` functions
   (median-ranked baseline resolution, filter-scoped candidate ranking, reordered minimum-role) with
   tests.
4. **Phase 2 — Interactive page (TDD)**: add the missing `Table` primitive to `libs/web-ui`, then
   build the `/[locale]/tools/cost-of-living-calculator` page, all three tabs (incl. the Region →
   Country → City cascading filters and the single-city detail view), and component tests.
5. **Phase 3 — Bilingual strings + polish**: en/id UI strings (category names, tax/net, relocation,
   country filter), accessibility, responsive.
6. **Phase 4 — E2E + local quality gates**: fe-e2e smoke test covering all three tabs,
   typecheck/lint/test:quick.
7. **Phase 5 — Post-push CI verification**.
8. **Phase 6 — Plan archival**.

## Worktree

Worktree path: `worktrees/ayokoding-www-salary-savings-calculator/`

Provision (run from repo root):

```bash
claude --worktree ayokoding-www-salary-savings-calculator
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Documents

| Document                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| [brd.md](./brd.md)             | WHY — business rationale, affected roles, success metrics, risks |
| [prd.md](./prd.md)             | WHAT — user stories, Gherkin acceptance criteria, product scope  |
| [tech-docs.md](./tech-docs.md) | HOW — architecture, design decisions, file impact, dependencies  |
| [delivery.md](./delivery.md)   | DO — phased execution checklist                                  |

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
