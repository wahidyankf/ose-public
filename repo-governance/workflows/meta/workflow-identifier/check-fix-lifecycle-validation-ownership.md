---
description: Prevents domain quality gates from repeating checks owned by repository lifecycle gates.
when_to_use: Use before invoking any checker, fixer, or recheck in a *-quality-gate workflow.
---

# \*-quality-gate Lifecycle Validation Ownership

Every `*-quality-gate` starts with **Step 0: lifecycle ownership filtering** so domain validation
retains only repository-unique evidence.

## Step 0: Resolve Ownership

Query both registry projections; never copy their inventory into workflows or prompts:

```bash
rtk ./rhino gate list
rtk ./rhino gate list --output json
```

Text supplies every gate ID and scope, including hand-wired gates; JSON adds metadata such as
`verifies` for dispatcher-managed gates. Union them by exact `id`. A predicate is lifecycle-owned
only when it matches an ID in that union or an explicit `verifies` relationship; never infer from
command similarity. Remove matches from checker, fixer, and recheck prompts. Keep unmatched
semantic, runtime, external, staged-only, and mutation predicates; category never proves
duplication.

Never rerun or imitate a delegated predicate locally to replace absent evidence. Record it as
`pending`. Record `verified` only when every delegated predicate has successful PR CI evidence that
covers it for the current repository, head SHA, and applicable base SHA. Aggregate green CI
does not verify predicates outside its recorded coverage. Use `not-applicable` when Step 0 finds no
delegated predicates. `final-status` remains domain-only and does not absorb lifecycle state.

## Evidence and Invalidation

Reports carry a compact ledger: delegated gate IDs, owning surfaces, status, repository, head and
base SHAs, pending owner, run URL when verified, and invalidation reason when applicable. Requery the
registry after it changes. Invalidate all evidence after repository, head, or applicable base
changes. After a fixer or scope change, invalidate only delegated predicates whose declared scope
intersects the changed files; retain unaffected evidence. Any invalidated or missing item makes
`lifecycle-status: pending`.

## Acceptance Criteria

```gherkin
Scenario: Delegate a registry-owned predicate
  Given a domain predicate matches an exact gate ID or declared verifies relationship
  When Step 0 prepares checker, fixer, and recheck prompts
  Then the prompts exclude that predicate
  And the evidence ledger records its owning lifecycle surface

Scenario: Defer missing lifecycle evidence
  Given a delegated predicate lacks current matching CI evidence
  When the domain quality gate finishes
  Then lifecycle-status is pending
  And the workflow does not rerun or imitate the predicate

Scenario: Reuse exact current CI evidence
  Given PR CI covers and passed every delegated predicate for the current repository, head, and base
  When the workflow evaluates lifecycle evidence
  Then lifecycle-status is verified

Scenario: Retain unique domain validation
  Given a semantic, runtime, external, staged-only, or mutation predicate has no registry match
  When Step 0 filters validation
  Then the domain quality gate retains that predicate

Scenario: Invalidate only affected evidence after a fix
  Given a fixer changes files within one delegated gate's declared scope
  When the workflow prepares its recheck
  Then that gate's evidence becomes pending
  And unaffected delegated evidence remains reusable
```
