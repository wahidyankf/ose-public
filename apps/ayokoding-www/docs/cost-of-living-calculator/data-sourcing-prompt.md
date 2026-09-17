---
title: "Cost-of-Living Calculator — Data-Sourcing Prompt"
description: Copy-paste prompts for an external research tool (Perplexity, etc.) that return data matching the calculator's schema, ready to drop into the dataset modules.
category: how-to
---

# Cost-of-Living Calculator — Data-Sourcing Prompt

## Purpose

The calculator is driven by three hand-curated data modules. This page holds the prompts you paste
into an external web-research tool (Perplexity, ChatGPT with browsing, etc.) to (re)source that data
so the result drops straight into the schema. Run them when refreshing the snapshot or adding a
city/country/role.

| Output of the prompt                | Lands in                                                     |
| ----------------------------------- | ------------------------------------------------------------ |
| FX rates (USD per 1 unit)           | `src/features/cost-of-living-calculator/core/data/fx.ts`     |
| City costs + country tax/healthcare | `src/features/cost-of-living-calculator/core/data/cities.ts` |
| Role × country salary matrix        | `src/features/cost-of-living-calculator/core/data/roles.ts`  |

Because the full dataset is far larger than any tool's single response, the work is split into three
prompts; run the city and salary prompts **one region (or one country) at a time**.

## Conventions every prompt must follow

These are the non-negotiable rules baked into the schema. They are repeated inside each prompt, but
read them once here:

- **Currency of amounts**: every cost and salary figure is **monthly** and in the **city's local
  currency** — except `nonSalaryComp.annualLocal` (annual, local), `bandThresholdsUsd` (USD), and
  the FX table (USD per 1 unit).
- **Tax `effectiveRate`**: a decimal fraction, not a percent — `0.10` means 10%. One value per income
  band: `low`, `mid`, `high`.
- **FX direction**: `ratesUsdPerUnit[CCY]` = the USD value of **1 unit** of `CCY` (so `IDR ≈
0.000056`, `GBP ≈ 1.34`). A city never stores its own rate — it is derived from `city.currency`.
- **Confidence flag** on every figure: `"high"` (direct, current local source), `"moderate"` (older,
  ranged, or thin-market source), or `"proxy"` (derived from a published multiplier vs a baseline —
  never fabricated).
- **Source note** on every figure: a short string naming the source **and its date** (e.g.
  `"Numbeo Jun 2026: 1BR city center ~3,300–3,700 SGD/mo"`). No figure ships without provenance.
- **Bilingual names**: `name: { en, id }` (English + Indonesian) for every country and city.
- **Exclusions**: no Israeli cities. Keep `region` to one of: `asean`, `japan`, `europe`, `nordics`,
  `americas`, `mena`, `asia`, `oceania`, `africa`.
- **Snapshot date**: stamp each dataset with the ISO date the figures were gathered.

## Current coverage (match this unless extending)

- **28 countries / 31 cities** (Japan has Tokyo + Osaka): `singapore, bangkok, jakarta,
kuala-lumpur, ho-chi-minh-city, manila, tokyo, osaka, london, berlin, amsterdam, lisbon, zurich,
warsaw, prague, paris, stockholm, copenhagen, oslo, helsinki, san-francisco, new-york, austin,
toronto, sao-paulo, mexico-city, dubai, bengaluru, seoul, sydney, nairobi`.
- **15-role ladder** (fixed — do **not** re-source the ladder; only source per-country salaries):
  `SWE I, SWE II, Senior SWE, Engineering Manager, Staff SWE, Senior Engineering Manager, Senior
Staff SWE, Director of Engineering, Principal SWE, Senior Director of Engineering, Distinguished
Engineer, VP Engineering, Fellow, SVP Engineering, CTO`.

---

## Prompt 1 — FX snapshot (`fx.ts`)

```text
You are a financial-data researcher. Return an up-to-date foreign-exchange snapshot.

For EACH currency below, give the USD value of 1 unit (i.e. USD per 1 unit of the currency, so
1 IDR ≈ 0.000056, 1 GBP ≈ 1.34). Use mid-market rates as of today. Cross-check each rate against at
least two independent sources (e.g. ECB euro reference rates, Xe.com, x-rates.com) and flag any
currency where a parallel/unofficial market materially diverges from the official rate.

Currencies: USD, IDR, MYR, SGD, THB, VND, PHP, KHR, LAK, MMK, BND, JPY, GBP, EUR, CHF, PLN, CZK,
SEK, DKK, NOK, ISK, CAD, MXN, BRL, ARS, CLP, AED, INR, KRW, TWD, CNY, AUD, KES, NGN, EGP.

Output format — one line per currency, exactly:
  CCY: <usd_per_unit_to_6_significant_figures>  // <source> <date>; <confidence: high|moderate|proxy> + any peg/parallel-market note

Also state the single ISO snapshot date you used for all rates. Do not invent rates; if a currency
cannot be sourced, say so explicitly rather than guessing.
```

## Prompt 2 — City costs + country tax/healthcare (`cities.ts`)

Run this **once per city** (and once per country for the country block). Substitute `{CITY}`,
`{COUNTRY}`, `{LOCAL_CCY}`.

```text
You are a cost-of-living researcher. Produce structured monthly cost data for {CITY}, {COUNTRY}.
ALL amounts are MONTHLY and in {LOCAL_CCY} (the city's local currency) unless a field says otherwise.
Every figure needs (a) a confidence flag — high | moderate | proxy — and (b) a source note naming
the source and its date. Prefer current local sources (Numbeo, government statistics offices,
transit authorities, PwC tax summaries). Do not fabricate; mark derived figures "proxy".

CITY block — a single adult professional, city-center baseline, monthly {LOCAL_CCY}:
- housing: rent of a 1-bedroom apartment in the city centre
- food: mid-range restaurant meals + groceries for one
- transport: a monthly public-transit pass (or typical commuting cost)
- utilities: electricity + water + gas for a 1-bedroom
- healthcare: typical out-of-pocket only (GP copay, dental) — NOT insurance premiums
- childcare: median full-time private preschool, per child
- lifestyle: gym + entertainment + clothing for one
- schoolMedianLocal.public: monthly cost of public/state primary schooling (fees, supplies)
- schoolMedianLocal.private: monthly cost of private/international primary schooling
- relocation.sunkCosts: deposit, keyMoney (0 if not customary), moving, visaAdmin (one-off {LOCAL_CCY})
- relocation.liquidityReserve.cashCushion: recommended emergency cash (~3× monthly essentials)

COUNTRY block for {COUNTRY}:
- bandThresholdsUsd: { lowToMid, midToHigh } — monthly gross income thresholds in USD that separate
  low/mid/high earners locally
- effectiveRate: { low, mid, high } — the EFFECTIVE total payroll burden (income tax + mandatory
  social contributions) as a DECIMAL fraction (0.10 = 10%) at each band
- healthcareModelType: "oop" | "tax-funded" | "mixed"
- compulsoryInsurance: { health: boolean, socialSecurity: boolean, note }
- subNational (only if a state/province income tax materially changes net pay): name + per-band
  effectiveRate, same shape as above

Output as a JSON object with keys `city` and `country`, each field as
{ amount|rate, confidence, note } (and nested objects where the schema nests). Bilingual names:
name: { en, id }.
```

## Prompt 3 — Role × country salary matrix (`roles.ts`)

Run this **once per country**. The 15-role ladder is fixed — do not change it. Substitute
`{COUNTRY}`, `{LOCAL_CCY}`.

```text
You are a tech-compensation researcher. For {COUNTRY}, give the MONTHLY GROSS base salary
distribution in {LOCAL_CCY} for each software-engineering level below, plus annual non-salary
compensation (equity/bonus/RSU value) in {LOCAL_CCY}.

Levels (ladder rank 1→15): SWE I, SWE II, Senior SWE, Engineering Manager, Staff SWE, Senior
Engineering Manager, Senior Staff SWE, Director of Engineering, Principal SWE, Senior Director of
Engineering, Distinguished Engineer, VP Engineering, Fellow, SVP Engineering, CTO.

For each level provide:
- p25, median, p75 of MONTHLY gross base salary in {LOCAL_CCY}
- nonSalaryComp: ANNUAL non-salary comp in {LOCAL_CCY}
Each value carries a confidence flag (high | moderate | proxy) and a source note with date. Prefer
levels.fyi, ravio.com, local job boards, and Glassdoor/PayScale. Where a level is rare locally,
derive it as a published multiple of a well-sourced lower level and mark it "proxy" with the
multiplier in the note. Do not fabricate.

Output one JSON object keyed by level, each = { p25, median, p75, nonSalaryComp }, each leaf =
{ amount, confidence, note }.
```

## After you get the data

1. Translate the tool's JSON into the existing TypeScript literal shapes in `fx.ts` / `cities.ts` /
   `roles.ts` (the `m(...)`, `sp(...)`, `dist(...)` helpers keep the literals terse).
2. Update the `snapshotDate` / `fxSnapshotDate` at the top of each module.
3. Run the dataset's own guards:
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:unit` (the
   `*.unit.test.ts` files beside each data module check structural invariants), then
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:typecheck`.
4. Spot-check a few cities in the running calculator before committing.

## See also

- Schema source of truth: the `type` definitions at the top of
  [`cities.ts`](../../src/features/cost-of-living-calculator/core/data/cities.ts),
  [`fx.ts`](../../src/features/cost-of-living-calculator/core/data/fx.ts), and
  [`roles.ts`](../../src/features/cost-of-living-calculator/core/data/roles.ts).
