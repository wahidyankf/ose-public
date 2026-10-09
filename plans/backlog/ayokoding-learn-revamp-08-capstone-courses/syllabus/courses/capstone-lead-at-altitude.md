# Capstone · Lead at Altitude (Capstone, Annotated-Concept No-Code)

**Course ID**: `capstone-lead-at-altitude` · **Format**: Capstone (`format: capstone`); teaching mode:
Annotated-Concept, no-code sub-mode.

**Scope note**: Takes the Relay service from `capstone-concurrency-and-systems` and asks you to lead
it as a technical lead: read its reliability, set a strategy, choose what to build and what to refuse,
run the team's operating rhythm, and look back on your own growth. It teaches decisions and written
artifacts, not code. It excludes people management (`engineering-management` owns it) and the SLO
mechanics (`site-reliability-engineering` and the concurrency capstone own them).

**Short summary**: You inherit a service with numbers, a team, and a backlog. By the end you have
written the five documents a technical lead is expected to produce, each backed by the service's own
data, and a plain-language look back at what you can now do and which team habits keep it going.

## Why this exists · the big idea

- **The problem before the solution**: strong engineers are promoted into lead roles and keep
  solving problems alone. The job changes: you now decide what the team does not do, explain why with
  evidence, and keep the system and the people healthy over months.
- **Keep-this-if-you-forget-everything**: strategy does not replace operating evidence. When the error
  budget is burning, reliability work outranks new features until the service is stable again, and you
  write that rule down before the pressure arrives.

## Learning objectives

- Read a service's reliability posture from an SLO report, an error-budget status, on-call load, and a
  dependency map, and say what you would worry about first.
- Write a one-page technical strategy that links reliability investments to customer outcomes and
  names leading indicators.
- Make and record prioritisation decisions, including the work you reject and the error-budget policy
  that triggers a feature freeze.
- Run a blameless incident review and keep its action items alive.
- Communicate upward, sideways, and downward: an executive update, a respectful "no" backed by data,
  and an alignment plan for a risky migration.
- Describe what you can now do across the whole learning journey and which team practices keep each
  capability alive.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `capstone-concurrency-and-systems`,
  `site-reliability-engineering`, `engineering-management`.
- **Edge changes against plan 02's graph**: none. Each edge is kept because the written course uses it
  (the Relay case study, SLO and on-call reading, and the leadership practices). No language
  primer applies because the course has no code.
- **Assumed knowledge**: you know what an SLO and an error budget are; you have read a postmortem; you
  can write a short document in Markdown.
- **Tools**: a text editor. No toolchain, no account, nothing to run.

## Mode and targets

- **Mode**: Annotated-Concept, no-code sub-mode. **Reason**: the adapter assigns leadership and
  governance topics to the no-code sub-mode, and every deliverable here is a decision document. The
  deterministic SLO and burn-rate numbers are produced in the concurrency capstone's harness; this
  course reuses them as a fixed case study, so its arithmetic is checked there (see "Case study data"
  below).
- **Scenarios**: floor 20, band 20–30, in four themes of six (24 scenarios). Each ends in a filled-in
  decision artifact.
- **Words**: at least 18,000 across the course's markdown pages
  ([tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#word-and-hour-targets)).
- **Diagrams**: at least one Mermaid diagram per theme (four or more).
- **No `code/` directory** anywhere in the course (a rule of the no-code sub-mode). The harness does not
  apply to this course, and the end-state coverage measure counts it as not applicable, like the other
  courses without code.
- **Layout**: `overview.md`; `learning/overview.md`; `learning/theme-a-reading-the-posture.md` to
  `learning/theme-d-cadence-and-communication.md`; `learning/capstone/overview.md`; `drilling/overview.md`.
- **Metadata**: `category: product-and-leadership`; `format: capstone`; `description` kept from plan
  03 ("Lead an existing service as a technical lead, from strategy to retrospective."); `estimatedHours`
  from the drift test (expected 2); no `status`.

## Case study data

The running case is a fictional company, **Everline**, and its Platform team, which owns Relay. The
numbers are given in the course so a reader who skipped the concurrency capstone can still work:
Relay's 99.9% availability SLO over 30 days (43.2 minutes of budget), a month in which 31 minutes were
spent in two incidents, and the burn-rate alert table (14.4, 6, 1). Every figure that also appears in
`capstone-concurrency-and-systems` (the SLO, the budget, the burn-rate table, the simulated outage
timings) is copied from that course's expected output files. The Phase gate for this course runs a
search that every such figure appears in the source file; see
[tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#cross-course-figures).
All names, quotes, and numbers are constructed examples, never claims about a real company.

## Project brief

**You are the technical lead of Everline's Platform team.** Over a quarter you must produce the
"lead's packet" for Relay, in five documents:

1. **Reliability review** (one page): SLO compliance, budget status, toil, and top three risks.
2. **Technical strategy** (one page): diagnosis, guiding policy, and coherent actions, with the
   outcomes each action serves and the leading indicators you will watch.
3. **Prioritisation record**: the quarter's chosen work, the rejected work with reasons, the capacity
   split between features and reliability, and the error-budget policy.
4. **Operating rhythm**: one blameless incident review with tracked actions, and a one-page
   communication plan (executive update, a "no", and a migration alignment plan).
5. **Retrospective**: what you can now do, which team habits sustain each capability, and what you
   will stop doing.

## Milestones

| #   | Milestone                        | Theme | Checkpoint (artifact) |
| --- | -------------------------------- | ----- | --------------------- |
| M1  | Reliability review               | A     | Document 1            |
| M2  | Strategy on one page             | B     | Document 2            |
| M3  | Prioritisation and roadmap       | C     | Document 3            |
| M4  | Rhythm, communication, look back | D     | Documents 4 and 5     |

## Acceptance criteria

There is no code to run, so each criterion is a checkable property of a document. Self-review first,
then a reviewer uses the same list.

| ID   | Criterion                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Every number in the reliability review is traceable to the case-study data, and the budget arithmetic is right        |
| AC-2 | The strategy has a diagnosis, a guiding policy, and at least three actions that follow from the policy                |
| AC-3 | Each action names the customer or business outcome it serves and one leading and one lagging indicator                |
| AC-4 | The prioritisation record lists at least three rejected items, each with a reason that cites evidence                 |
| AC-5 | The error-budget policy states the trigger, the action, who decides, and when the freeze ends                         |
| AC-6 | The incident review is blameless: it names causes in the system, not people, and every action has an owner and a date |
| AC-7 | The executive update fits one page and leads with the decision needed                                                 |
| AC-8 | The retrospective names, for each capability, one team practice that keeps it alive                                   |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher.

| Criterion            | 2 — meets                                                     | 3 — strong                                                        |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Evidence             | Claims cite the case-study numbers                            | Claims also state what evidence would change the decision         |
| Strategy coherence   | Actions follow from the guiding policy                        | A rejected action is shown to contradict the policy               |
| Trade-off honesty    | Rejected work and its cost are named                          | The cost of the chosen path is stated to the people who bear it   |
| Operating discipline | Actions have owners and dates                                 | There is a follow-up check on whether past actions worked         |
| Communication        | Each message states its audience, ask, and deadline           | The same message is reshaped correctly for two audiences          |
| Self-awareness       | The retrospective is specific, not a list of courses finished | It names one habit to start, one to stop, and how you will notice |

**Evidence to keep**: the five documents, plus the reviewer's filled-in rubric.

**Extensions** (not graded): repeat the exercise for a second service; ask a teammate to play the
executive and challenge the update.

## Concepts

- **co-01 · reliability-posture** — the current state of SLO, budget, toil, and dependencies.
- **co-02 · error-budget-policy** — a written rule that changes what the team does when the budget is
  spent.
- **co-03 · strategy-kernel** — diagnosis, guiding policy, and coherent actions.
- **co-04 · outcome-mapping** — a line from each investment to a customer or business result.
- **co-05 · leading-and-lagging-indicators** — what you can watch early versus what you learn late.
- **co-06 · prioritisation-with-rejection** — deciding means naming what you will not do.
- **co-07 · capacity-split** — a stated share of effort for features, reliability, and toil.
- **co-08 · blameless-review** — finding system causes without assigning fault to people.
- **co-09 · action-hygiene** — owners, dates, and a follow-up so actions do not rot.
- **co-10 · audience-shaped-communication** — one decision, framed for the reader's needs.
- **co-11 · capability-and-practice** — a skill you have, and the habit that keeps it from fading.

## Worked examples

Scenarios, not code. Each follows the annotated-concept shape: context, the scenario with reasoning,
the filled-in decision artifact, key takeaway, and "Why It Matters".

### Theme A — Reading the reliability posture (`learning/theme-a-reading-the-posture.md`)

- **sc-01 · slo-compliance-review** — read a month of SLO data — artifact: a three-line status. (co-01)
- **sc-02 · error-budget-status** — 31 of 43.2 minutes spent — artifact: remaining budget and burn
  forecast. (co-01, co-02)
- **sc-03 · toil-and-on-call-load** — pages per week and hours on repetitive work — artifact: a toil
  estimate and a ceiling. (co-01)
- **sc-04 · dependency-risk-map** — three dependencies with different failure modes — artifact: a
  ranked risk table. (co-01)
- **sc-05 · saturation-outlook** — queue depth and peak load trend — artifact: a capacity note with a
  trigger. (co-01)
- **sc-06 · reliability-scorecard** — combine the previous five — artifact: the one-page review
  (milestone M1). (co-01)

### Theme B — From reliability to outcomes (`learning/theme-b-from-reliability-to-outcomes.md`)

- **sc-07 · diagnosis** — what is actually wrong, in one paragraph — artifact: a diagnosis that rules
  out two tempting answers. (co-03)
- **sc-08 · guiding-policy** — the approach that addresses the diagnosis — artifact: a policy with a
  stated trade-off. (co-03)
- **sc-09 · coherent-actions** — three actions that reinforce each other — artifact: an action list
  with sequencing. (co-03)
- **sc-10 · outcome-map** — link each action to a customer result — artifact: a map with one metric
  per link. (co-04)
- **sc-11 · leading-indicators** — choose what to watch early — artifact: an indicator table with
  thresholds. (co-05)
- **sc-12 · strategy-on-one-page** — assemble and cut to one page — artifact: the strategy document
  (milestone M2). (co-03, co-04, co-05)

### Theme C — Prioritisation and roadmap trade-offs (`learning/theme-c-prioritisation-and-tradeoffs.md`)

- **sc-13 · error-budget-policy** — decide the trigger and the freeze rule — artifact: the policy
  text. (co-02)
- **sc-14 · rejected-work-log** — four requests, three declined — artifact: a log with reasons. (co-06)
- **sc-15 · capacity-split** — features, reliability, toil — artifact: a split with a review date.
  (co-07)
- **sc-16 · roadmap-trade-off-memo** — sequence a quarter under a burning budget — artifact: a memo
  stating what slips. (co-06, co-07)
- **sc-17 · build-or-buy** — a decision record with a reversal trigger — artifact: the record. (co-06)
- **sc-18 · sequencing-a-risky-migration** — expand, migrate, contract — artifact: a staged plan with
  stop conditions (milestone M3 with sc-13 to sc-16). (co-06)

### Theme D — Operating rhythm, communication, and looking back (`learning/theme-d-cadence-and-communication.md`)

- **sc-19 · blameless-incident-review** — a 14-minute outage — artifact: a review naming system
  causes. (co-08)
- **sc-20 · action-hygiene** — ten stale actions — artifact: a triage into do, drop, and delegate.
  (co-09)
- **sc-21 · executive-update** — lead with the decision — artifact: a one-page update. (co-10)
- **sc-22 · saying-no-with-data** — decline a feature request — artifact: a reply that offers an
  alternative. (co-10, co-06)
- **sc-23 · aligning-product-and-support** — a change that affects other teams — artifact: an
  alignment plan with who needs what. (co-10)
- **sc-24 · look-back** — name capabilities across the whole learning journey (foundations,
  programming, systems, delivery, internals, leadership) and the team habit that keeps each —
  artifact: the retrospective (milestone M4). (co-11)

## Drilling

`drilling/overview.md` has the five drill sections. This course has no code, so the kata floor is met
by five **design exercises** (each with a worked answer in a `<details>` block), as the no-code
sub-mode allows: write an error-budget policy for a different SLO; rewrite a blame-heavy review;
cut a two-page strategy to one; turn a vague request into a decision memo; draft a "no" that keeps
the relationship. Counts for the other sections follow tech-docs/002.

## Code and harness

None. The course folder has no `code/` directory and no `run.yaml`. The figures shared with the
concurrency capstone are checked by the cross-course search described in tech-docs/004.

## Accuracy notes

- The error budget (43.2 minutes), the burn-rate table (14.4, 6, 1), and the window pairs: Google SRE
  Workbook, "Alerting on SLOs", `https://sre.google/workbook/alerting-on-slos/`, read 2026-10-09; the
  same figures are produced by `capstone-concurrency-and-systems`.
- Strategy kernel (diagnosis, guiding policy, coherent actions): Richard Rumelt, _Good Strategy/Bad
  Strategy_ (Crown Business, 2011): a stable, widely cited framework.
- Blameless postmortem practice: Google SRE Book, chapter "Postmortem Culture: Learning from
  Failure", `https://sre.google/sre-book/postmortem-culture/`, accessed at authoring time.
- Everline and every person, quote, and number in the scenarios are constructed.

## Read more

- **Good Strategy/Bad Strategy** — Richard Rumelt (Crown Business). The source of the strategy kernel.
- **The Site Reliability Workbook** — Beyer et al. (O'Reilly). Error-budget policy examples.
- **An Elegant Puzzle** — Will Larson (Stripe Press). Engineering leadership trade-offs in practice.

## Lineage

This course replaces a 369-word outline. Its retrospective step referred to internal curriculum
"passes" (P0 to P5); the new course describes the same journey as capabilities (foundations,
programming, systems, delivery, internals, leadership) so a reader meets no internal jargon.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "Integrative capstones".
- `careers/immediately-effective/software-engineer` — extension, "Integrative capstones".
- `careers/fundamentally-strong/software-engineer` — extension, "Integrative capstones".
