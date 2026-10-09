# Paths — Accounting Manifest Specifications

Each file below specifies one accounting skills path after this plan: description, `assumes`, every
phase with positions and outcomes, the path page copy, and the exact manifest JSON the restructure
phase writes. Course membership does not change: the conventional path keeps its 19 courses and the
Sharia path its 24.

| Path ID                          | File                                                                                       | Courses | Phases | `assumes`                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------- | ------ | ------------------------------------------------------------ |
| `skills/conventional-accounting` | [manifest-skills-conventional-accounting.md](./manifest-skills-conventional-accounting.md) | 19      | 6 core | `backend-essentials`, `just-enough-python`, `sql-essentials` |
| `skills/sharia-accounting`       | [manifest-skills-sharia-accounting.md](./manifest-skills-sharia-accounting.md)             | 24      | 7 core | `backend-essentials`, `just-enough-python`, `sql-essentials` |

## Input and Changes Against It

Plan 02 (`ayokoding-learn-revamp-02-path-model`) wrote both manifests in a mechanical shape (one
`all-courses` phase, `assumes: []`, and `restructurePendingIn: "plan-06"`) and drafted phases and
outcomes as input for this plan. Series decision 39 (user, 2026-10-09) moved the real restructure to
this plan, in the same PR as the filled courses. This plan reads that draft read-only and records here
what it changes and why.

| #   | Change against plan 02's draft                                                                                       | Reason                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `journal-entries-and-posting-mechanics` moves to position 3 and `financial-statements-and-close-cycle` to position 4 | The rewritten statements course builds statements from posted entries, so its target prerequisites include the journal course. Today's order (statements first) would fail the prerequisite-ordering rule. See [tech-docs/008](../../tech-docs/008-decision-records.md). |
| 2   | `assumes` gains `just-enough-python`                                                                                 | Every course's code is Python (decision D1 in tech-docs/008). Plan 02's rubric rule L1 makes the language course a prerequisite of each course that teaches through it, and the closure rule then requires it in `assumes`.                                              |
| 3   | Every phase outcome is rewritten                                                                                     | The draft was written before the courses had objectives. The new outcomes state what the finished courses teach, in plain words, and are checked against each course's learning objectives.                                                                              |
| 4   | The last conventional phase has no `cannotYet`; the Sharia path's sixth phase has a new `cannotYet`                  | The conventional path ends there. In the Sharia path the reader continues to Sharia-specific modelling, so the sixth phase says what is still ahead.                                                                                                                     |
| 5   | Path page bodies differ from plan 02's proposed copy                                                                 | They now say that the code runs, which courses use PostgreSQL, and how a Sharia board decision is shown, and they keep the path-context sentence the career pages use.                                                                                                   |
| 6   | Descriptions are kept from the draft                                                                                 | They already state the audience (decision 16) and contain no internal terms.                                                                                                                                                                                             |

## Rules Both Manifests Pass

After this plan, neither manifest carries `restructurePendingIn`, so every integrity rule from plan 02
applies (R1–R10 in plan 02's integrity design): unresolved and duplicate IDs, phase shape, closure, no
outline course in the core, exact `assumes`, the skills rule (no extension phase), marker usage, and
prerequisite ordering. The closure check for every course is written out in
[tech-docs/005](../../tech-docs/005-path-restructure-and-integrity.md#closure-proof).

## Shared Structure

The Sharia path's first 19 positions equal the conventional path in the same order, with the same
phase IDs, titles, and outcomes, except that the sixth phase adds a `cannotYet`. The existing
composition test (the Sharia order starts with the full conventional order) keeps holding.
