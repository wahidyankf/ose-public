# Audit, Controls, and Compliance (Annotated-Concept)

**Course ID**: `audit-controls-and-compliance` · **Format**: Annotated-Concept.

**Scope note**: Teaches internal control over financial reporting from an engineer's side: risks and
controls, segregation of duties, journal-entry and reconciliation controls, evidence, sampling,
control testing, and automated compliance checks. It excludes external audit methodology in depth,
tax compliance (`payroll-and-tax-accounting-essentials`), and Sharia audit
(`sharia-accounting-and-aaoifi-standards` introduces Sharia governance).

**Short summary**: Auditors trust a system when its controls leave evidence. You learn to design
controls that address real risks, build them into code, and produce the evidence an auditor or a
reviewer can check.

## Why this exists · the big idea

- **The problem before the solution**: a finance system with powerful users, editable history, and no
  review evidence fails audits and invites fraud, even if every number is right today.
- **Keep-this-if-you-forget-everything**: every control answers a named risk and leaves evidence that
  someone else can review.

## Learning objectives

- Build a risk and control matrix and classify controls as preventive or detective, manual or
  automated.
- Detect segregation-of-duties conflicts from roles and permissions.
- Implement journal-entry, approval, and reconciliation controls with evidence.
- Draw reproducible audit samples and test control design and operation.
- Automate compliance checks and manage exceptions to closure.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics` (posting controls),
  `financial-statements-and-close-cycle` (reconciliations and close), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: controls are judgement plus mechanism; annotated
  risk and control tables pair with Python checks that produce evidence. The no-code sub-mode was
  rejected because the audience builds these controls in software.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Design controls that
  address real risks and leave reviewable evidence."); `estimatedHours` from the drift test.

## Accuracy notes

- COSO "Internal Control — Integrated Framework", originally issued in 1992 and refreshed in 2013:
  `https://www.coso.org/internal-control`, accessed 2026-10-09. The maker cites the five components
  from a COSO source before listing them.
- Sarbanes-Oxley section 404 is mentioned only as an example of a regime requiring management
  assessment of internal control; the maker cites a primary source (SEC) before stating its rules.

## Concepts

- **co-01 · control-objective** — what could go wrong (a risk) and what must be true instead.
- **co-02 · control-types** — preventive and detective; manual and automated; application and IT
  general controls.
- **co-03 · risk-control-matrix** — risks, controls, owners, frequency, and evidence in one table.
- **co-04 · segregation-of-duties** — no one person controls a transaction end to end.
- **co-05 · access-reviews** — periodic review of who can do what.
- **co-06 · approval-controls** — thresholds, maker-checker, and delegation.
- **co-07 · journal-entry-controls** — review of manual and unusual entries.
- **co-08 · reconciliation-controls** — reconciliations as evidenced controls.
- **co-09 · audit-trail** — immutable, complete records of who did what and when.
- **co-10 · evidence** — what a reviewer needs to re-perform or inspect a control.
- **co-11 · sampling** — reproducible samples for testing.
- **co-12 · control-testing** — design effectiveness and operating effectiveness.
- **co-13 · exceptions** — deficiencies, remediation, and closure.
- **co-14 · continuous-monitoring** — automated checks that run every day and alert on exceptions.

## Worked examples

### Theme A — Risks and control design (`learning/theme-a-risks-and-controls.md`)

- **ex-01 · what-could-go-wrong** — list risks for a payment process — verify each maps to an
  assertion (existence, completeness, accuracy, cut-off). (co-01)
- **ex-02 · control-types-table** — classify ten controls — verify. (co-02)
- **ex-03 · risk-control-matrix** — build an RCM as data — verify every risk has a control. (co-03)
- **ex-04 · uncovered-risk-finder** — find risks without controls — verify. (co-03)
- **ex-05 · preventive-in-code** — implement a preventive limit check — verify the refusal. (co-02)
- **ex-06 · detective-in-code** — implement a detective duplicate-payment report — verify. (co-02)
- **ex-07 · control-owner-and-frequency** — assign owners and frequencies — verify the schedule.
  (co-03)
- **ex-08 · itgc-preview** — list IT general controls around a ledger service — verify. (co-02)
- **ex-09 · control-flow-diagram** — draw where controls sit in a process (Mermaid) — verify. (co-03)

### Theme B — Segregation of duties and access (`learning/theme-b-sod-and-access.md`)

- **ex-10 · incompatible-duties** — define incompatible pairs — verify the matrix. (co-04)
- **ex-11 · role-permission-model** — model roles and permissions — verify. (co-04)
- **ex-12 · sod-conflict-scan** — scan users for conflicts — verify the report. (co-04)
- **ex-13 · mitigating-control** — record a mitigating control for an accepted conflict — verify.
  (co-04)
- **ex-14 · access-review** — produce an access review list — verify. (co-05)
- **ex-15 · leaver-access** — find accounts of people who left — verify. (co-05)
- **ex-16 · privileged-access-log** — review privileged actions — verify. (co-05, co-09)
- **ex-17 · emergency-access** — grant time-limited access with review — verify. (co-05)
- **ex-18 · sod-in-api** — enforce SoD at the API — verify a forbidden action fails. (co-04)

### Theme C — Journal-entry and reconciliation controls (`learning/theme-c-je-and-reconciliation-controls.md`)

- **ex-19 · manual-je-review** — route manual entries for review — verify. (co-07)
- **ex-20 · unusual-entries** — flag weekend, round, and late entries — verify. (co-07)
- **ex-21 · rarely-used-accounts** — flag postings to rarely used accounts — verify. (co-07)
- **ex-22 · approval-thresholds** — enforce thresholds — verify. (co-06)
- **ex-23 · delegation-trail** — record delegated approvals — verify. (co-06)
- **ex-24 · reconciliation-control** — require preparer, reviewer, and evidence — verify. (co-08)
- **ex-25 · stale-reconciling-items** — flag old reconciling items — verify. (co-08)
- **ex-26 · reconciliation-completeness** — check every balance-sheet account is reconciled — verify.
  (co-08)
- **ex-27 · close-controls** — check the period lock and close sign-off — verify. (co-08, co-09)

### Theme D — Evidence, sampling, and testing (`learning/theme-d-evidence-and-testing.md`)

- **ex-28 · evidence-package** — assemble evidence for one control run — verify completeness. (co-10)
- **ex-29 · tamper-evident-log** — hash-chain an evidence log — verify detection of a change. (co-09)
- **ex-30 · random-sample** — draw a seeded random sample — verify the list is reproducible. (co-11)
- **ex-31 · monetary-unit-sample** — draw a monetary-unit sample — verify large items are favored.
  (co-11)
- **ex-32 · sample-size-table** — choose sample sizes from a stated table — verify. (co-11)
- **ex-33 · test-of-design** — walk through a control — verify the design checklist. (co-12)
- **ex-34 · test-of-operation** — re-perform a control on the sample — verify exceptions. (co-12)
- **ex-35 · deficiency-evaluation** — rate a deficiency — verify the rating rule. (co-13)
- **ex-36 · remediation-tracking** — track remediation to closure — verify. (co-13)

### Theme E — Compliance in systems (`learning/theme-e-compliance-in-systems.md`)

- **ex-37 · continuous-monitoring-job** — run daily checks and raise exceptions — verify. (co-14)
- **ex-38 · exception-workflow** — assign, resolve, and close exceptions — verify. (co-13, co-14)
- **ex-39 · retention-rules** — keep records for a stated retention period — verify the purge guard.
  (co-10)
- **ex-40 · change-management** — require approved changes to posting rules — verify. (co-02)
- **ex-41 · config-drift** — detect unapproved configuration changes — verify. (co-14)
- **ex-42 · evidence-export** — export evidence for an auditor — verify the manifest. (co-10)
- **ex-43 · controls-as-tests** — express controls as automated tests — verify. (co-14)
- **ex-44 · compliance-dashboard-data** — compute control status — verify. (co-14)
- **ex-45 · audit-readiness-pack** — produce the pack — verify every control has evidence. (co-10,
  co-12)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-sod-scan-misses-inherited-role`, `kata-02-sample-not-reproducible`,
  `kata-03-self-review-allowed`, `kata-04-log-editable`, `kata-05-exception-never-closed`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A controls toolkit for the ledger.** An RCM as data, an SoD scanner, journal-entry analytics,
reconciliation evidence checks, seeded sampling, a tamper-evident evidence log, and a daily monitoring
job with an exception workflow, run against the earlier posting engine's data. The `run.yaml` runs a
scripted month and compares the audit-readiness pack.

## Code and harness

- Python standard library only; sampling always uses a seed stated in `run.yaml`.

## Lineage

- Replaces the 189-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 5 (Controls, payroll, and treasury), position 15.
- `skills/sharia-accounting` — Phase 5 (Controls, payroll, and treasury), position 15.
