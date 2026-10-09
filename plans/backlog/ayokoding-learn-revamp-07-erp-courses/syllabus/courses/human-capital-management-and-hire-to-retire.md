# Human Capital Management and Hire to Retire (Annotated-Concept)

**Course ID**: `human-capital-management-and-hire-to-retire` · **Format**: Annotated-Concept.

**Scope note**: Models worker records, effective-dated assignments, lifecycle events, time and leave, payroll inputs, privacy, and offboarding. It excludes payroll tax computation (payroll-and-tax-accounting-essentials) and recruiting.

**Short summary**: Hire to retire links the worker lifecycle to authorization, time, payroll inputs, and privacy.

## Why this exists · the big idea

- **The problem before the solution**: HR data is changed in place, so nobody can say what a worker's role, manager, or pay inputs were on a given date.
- **Keep-this-if-you-forget-everything**: Record the worker lifecycle as effective-dated events, and treat personal data as a controlled asset.

## Learning objectives

After this course you can:

1. separate the person from employment records and assignments.
2. record hire, transfer, promotion, and termination as effective-dated events.
3. accrue leave with exact arithmetic and route requests through approval chains.
4. export payroll inputs from time and assignment data.
5. classify and mask personal data, apply retention versus erasure, and review offboarding for gaps.

## Prerequisites

- **Prior courses**: `erp-module-map-and-architecture`, `payroll-and-tax-accounting-essentials`, `just-enough-python`.
- **Assumed knowledge**: Payroll concepts from the accounting course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `payroll-and-tax-accounting-essentials`, `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about worker lifecycle and effective dating.
- Data-protection law differs by country. The course uses Regulation (EU) 2016/679, Articles 5 and 17, as one named example and tells readers to check their own jurisdiction; verify the article text before quoting it.

## Concepts

- **co-01 · person-vs-worker** — a human being versus the roles they hold.
- **co-02 · employment-record** — a contract of work between a person and a company.
- **co-03 · assignment** — the job, position, manager, and cost center a worker holds.
- **co-04 · effective-dated-assignment** — assignments valid from one date to another.
- **co-05 · position-vs-job** — a seat in the organization versus a type of work.
- **co-06 · lifecycle-event** — hire, transfer, promotion, or termination.
- **co-07 · time-and-attendance** — recorded hours and presence.
- **co-08 · leave-accrual** — leave earned over time under a policy.
- **co-09 · payroll-input** — the data payroll consumes from HR and time.
- **co-10 · approval-chain** — who approves a request, by relationship.
- **co-11 · privacy-classification** — labelling personal data by sensitivity.
- **co-12 · access-by-relationship** — a manager sees direct reports only.
- **co-13 · retention-and-erasure** — how long records stay and when they must go.
- **co-14 · offboarding-checklist** — access, assets, payroll, and records at exit.
- **co-15 · org-hierarchy-history** — reporting lines over time.
- **co-16 · labour-cost-assignment** — charging labour cost to cost centers or projects.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: The topic mixes data models, rules, process, and privacy policy, and each concept is clearer in its own medium (model, table, run, checklist). Annotated-concept fits.

| Target                         | Value                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                        |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                   |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                              |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                     |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                             |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Worker records** (page `learning/theme-a-worker-records.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · person-vs-employment** (Python 3.14) — model one person with two employment records over time, then verify the person record is stored once.
- **Theme B: Lifecycle events** (page `learning/theme-b-lifecycle-events.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · hire-transfer-terminate** (Python 3.14) — apply hire, transfer, and terminate events, then verify the current state is derived from the events.
- **Theme C: Effective-dated assignments** (page `learning/theme-c-effective-dated-assignments.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · assignment-on-date** (Python 3.14) — look up a worker's manager and cost center on a past date, then verify the answer differs from today's.

### Themes 4 to 6 (18 examples)

- **Theme D: Time and leave** (page `learning/theme-d-time-and-leave.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · leave-accrual-decimal** (Python 3.14) — accrue leave monthly with exact decimals, then verify fractional days do not drift over a year.
- **Theme E: Payroll inputs** (page `learning/theme-e-payroll-inputs.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · payroll-input-file** (Python 3.14) — export hours and rate changes for a period, then verify a mid-period transfer splits the input correctly.
- **Theme F: Approval chains** (page `learning/theme-f-approval-chains.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · manager-chain-approval** (Python 3.14) — route a leave request up the manager chain with delegation, then verify nobody approves their own request.

### Themes 7 to 9 (15 examples)

- **Theme G: Privacy** (page `learning/theme-g-privacy.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · field-classification-mask** (Python 3.14) — classify fields and mask them by viewer role, then verify an unauthorized viewer never sees raw values.
- **Theme H: Retention and erasure** (page `learning/theme-h-retention-and-erasure.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · retention-vs-erasure** (Python 3.14) — apply a retention window and an erasure request, then verify legally retained fields are kept and the rest anonymized.
- **Theme I: Offboarding** (page `learning/theme-i-offboarding.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · offboarding-gap-review** (Python 3.14) — review a termination for access, assets, payroll, and records, then verify each missing item is reported with an owner.

## Capstone spec

Build an HCM core with effective-dated records, lifecycle events, leave accrual, payroll input export, privacy masking, retention, and offboarding checks. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: review an offboarding event for gaps; answer a point-in-time org question; design retention for a record set.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: derive current state from events; accrue leave exactly; mask a field by role.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- All people are invented; no real names or identifiers.
- Legal statements are sourced or hedged and never presented as advice.

## Lineage

- The archived syllabus file [human-capital-management-and-hire-to-retire](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/human-capital-management-and-hire-to-retire.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 24 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 24 of 30.
