# ERP Security and Controls (Annotated-Concept)

**Course ID**: `erp-security-and-controls` · **Format**: Annotated-Concept.

**Scope note**: Designs roles, permissions, segregation of duties, approval limits, master-data change control, privileged and emergency access, and access review. It excludes authentication protocols and infrastructure security (security-essentials).

**Short summary**: Controls limit who can start, approve, post, change, and review each event.

## Why this exists · the big idea

- **The problem before the solution**: One user can create a vendor, release a payment, and post the entry, and no report shows it.
- **Keep-this-if-you-forget-everything**: Separate the duties that must not meet in one person, and prove the separation by running the check.

## Learning objectives

After this course you can:

1. model roles and permissions and evaluate access requests.
2. build a segregation-of-duties conflict matrix and report violations.
3. route approvals by limit and enforce maker-checker.
4. control sensitive master-data changes with dual approval.
5. grant emergency access with expiry and review, run an access recertification, and keep control-test evidence.

## Prerequisites

- **Prior courses**: `erp-module-map-and-architecture`, `audit-controls-and-compliance`, `just-enough-python`.
- **Assumed knowledge**: Internal control concepts from the audit and compliance course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `audit-controls-and-compliance`, `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- COSO, Internal Control - Integrated Framework (2013) for control vocabulary.
- ANSI INCITS 359-2004, Role-Based Access Control, for the role model. Verify the standard identifier against the publisher.
- Stable domain facts about segregation of duties.

## Concepts

- **co-01 · role** — a named set of permissions.
- **co-02 · permission** — an allowed action on a kind of object.
- **co-03 · segregation-of-duties** — keeping conflicting duties with different people.
- **co-04 · sod-conflict-matrix** — a table of permission pairs that must not be combined.
- **co-05 · approval-limit** — the maximum value a person may approve.
- **co-06 · maker-checker** — one person prepares and a different person approves.
- **co-07 · master-data-change-control** — reviewed changes to sensitive master data.
- **co-08 · privileged-access** — elevated rights with extra oversight.
- **co-09 · emergency-access** — time-boxed elevated access with review afterwards.
- **co-10 · access-review** — periodic confirmation that access is still needed.
- **co-11 · preventive-vs-detective-control** — stopping a problem versus finding it later.
- **co-12 · control-test-evidence** — proof that a control operated.
- **co-13 · data-scope** — limiting records by company, plant, or cost center.
- **co-14 · delegation** — temporarily passing authority with limits.
- **co-15 · joiner-mover-leaver** — adjusting access when people join, move, or leave.
- **co-16 · control-exception-log** — a record of overrides and their approval.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Control design mixes models, matrices, rules, and process, and each concept needs its own medium plus a runnable evaluator. Annotated-concept fits; the topic is code-demonstrable, so it is not a no-code course.

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

- **Theme A: Roles and permissions** (page `learning/theme-a-roles-and-permissions.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · role-permission-eval** (Python 3.14) — evaluate whether a user may perform an action given their roles, then verify a denied request names the missing permission.
- **Theme B: SoD basics** (page `learning/theme-b-sod-basics.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · sod-pair-check** (Python 3.14) — check a user's permissions against conflicting pairs, then verify a violating combination is flagged.
- **Theme C: Approval limits** (page `learning/theme-c-approval-limits.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · limit-routing** (Python 3.14) — route an approval by amount and limit, then verify an over-limit request reaches the next approver.

### Themes 4 to 6 (18 examples)

- **Theme D: The SoD matrix** (page `learning/theme-d-the-sod-matrix.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · sod-matrix-report** (Python 3.14) — report SoD conflicts across all users from a matrix, then verify each finding lists the user and the permission pair.
- **Theme E: Maker-checker** (page `learning/theme-e-maker-checker.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · same-user-blocked** (Python 3.14) — block a user from approving their own request, then verify the block holds under delegation.
- **Theme F: Master-data controls** (page `learning/theme-f-master-data-controls.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · bank-detail-dual-approval** (Python 3.14) — require two approvers for a bank-detail change, then verify the change stays pending with one.

### Themes 7 to 9 (15 examples)

- **Theme G: Emergency access** (page `learning/theme-g-emergency-access.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · emergency-grant-expiry** (Python 3.14) — grant emergency access that expires on a virtual clock, then verify the access ends at expiry and a review item is created.
- **Theme H: Access reviews** (page `learning/theme-h-access-reviews.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · recertification-run** (Python 3.14) — run a recertification and revoke unconfirmed access, then verify revoked users lose the permission.
- **Theme I: Control testing** (page `learning/theme-i-control-testing.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · control-test-evidence** (Python 3.14) — sample transactions against a control and record evidence, then verify an exception is logged with the sample and the result.

## Capstone spec

Build an access-control analyzer with roles, an SoD matrix, approval limits, emergency access, an access review, and an evidence report over a synthetic user and permission set. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: assess a request that grants vendor setup, payment release, and posting to one user; set approval limits; review a recertification result.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: evaluate an access request; find SoD conflicts; expire emergency access.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Users, roles, and limits are invented.
- Time uses a virtual clock.

## Lineage

- The archived syllabus file [erp-security-and-controls](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/erp-security-and-controls.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 26 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 26 of 30.
