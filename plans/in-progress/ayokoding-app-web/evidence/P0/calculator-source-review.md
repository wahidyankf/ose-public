# Calculator source review

Review date: 2026-10-26. Status: **source review and focused Unit proof accepted; full gates pending**.
This evidence covers the existing `ayokoding-www` calculator and its dedicated FE E2E owner.
It does not complete the calculator repair action, Phase 0, or the Phoenix implementation.

## Independent result

An independent SWE reviewer traced all 127 scenario definitions, including two outlines with four
Examples rows, into 129 identities and 387 layer obligations. The final source review found zero
remaining source findings across the 57 consolidated original findings.

| Existing-owner layer | Static result                                                                       | Runtime state                                                    |
| -------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Unit                 | 129 substantive source proofs; no exemptions                                        | Complete focused file 527/527 passed; current full quick pending |
| Integration          | 129 existing public-boundary exemptions with substantive named browser alternatives | Alternative runtime proof pending                                |
| E2E                  | 129 substantive source proofs; zero missing or ambiguous bindings                   | Pending all required calculator scenarios/browsers               |

All titles, Examples identities and layer obligations remain. The source review also verified exact
Unit step-label matching, actual production invocation, independent outcome observations and
fixture cleanup. These old-owner Integration dispositions do not assign exemptions to the new
Phoenix application's local resource boundaries.

The accepted packet 7 report has SHA-256
`2f7c5d808ea3ef405d9e5bfd691986e1f441ec41471dd5f6d879f2fedcedd663`.
Its manifest has SHA-256
`df46222df1800e96c900a0961a7cc285f4cd7a7b5597dd91a72893188cfab480`.
Detailed immutable review records remain in ignored execution state. Root read the final report
and separately verified that the live source/dependency files match the accepted pins below.

## Historical packet 7 source pins

| Repository path                                                                        | SHA-256                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `specs/apps/ayokoding/www/behaviours/frontend/tools/cost-of-living-calculator.feature` | `c122b685ff8689e89a636b261291ea66c44abe79a9fbdfb3ff13f71ebe452803` |
| `apps/ayokoding-www/tests/unit/fe-steps/cost-of-living-calculator.steps.tsx`           | `c2375c50d0a47178979bf86b1246d1ccc813ff9a447108376fb2a5fb865e44e6` |
| `apps/ayokoding-www/tests/unit/fe-steps/helpers/calculator-oracles.ts`                 | `af7119cb96b32a0634f580a00689e893f53b2a326911b3a8b1aac674baac82c4` |
| `apps/ayokoding-www/tests/unit/fe-steps/helpers/scenario-user.ts`                      | `f179f90be1faa18c2a1c98c419c458f5284f68ab6d8aca2b16ee40afbc8c550d` |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/cost-of-living-calculator.steps.ts`         | `c633cc74b2e54d2fdf57f92abc6cf0c14e19368f950c66be8f49c73a2cc61820` |
| `apps/ayokoding-www-fe-e2e/tests/e2e/helpers/calculator-oracle.ts`                     | `704d7c7779ebbe96ec10a98ee4990d0164f89e7b431faf8b85ec5cf48aeb5cbf` |

Any later source change must be reconciled with this proof. A matching hash establishes artifact
identity; it does not establish that a test executed.

## What the repairs prove in source

- Numerical assertions use raw frozen fixtures and separate FX literals rather than calling the
  production calculator or role lookup to manufacture expected values. Independent arithmetic
  calibrated all 15 Austin roles, the exact 13 qualifying roles at target 8000, their order and
  minimum rank, plus a no-qualifier case. Other original multi-city cases remain intact.
- Assertions observe actual rendered monetary amounts, role identities, per-cell conversions,
  selected filters, localized copy, URL restoration through a fresh mount, body-column positions,
  divider placement and dimmed state. They account for the existing 12-row nonqualifier preview.
- Driver cleanup preserves lazy independent input sessions and restores viewport/timer state on
  failure. The browser debounce fixture installs an explicit clock origin before navigation,
  pauses on a later instant after readiness, then advances exactly 299 and one milliseconds.
- Canonical wording preserves accepted current behavior: radio checked state, associated
  descriptions with only the selected description visible, and Minimum-role's combined
  City/Country cell. Cost/Savings retain strict adjacent Country/City columns. Healthcare checks
  use every represented frozen scheme; no fictitious country or data refresh was introduced.

## Accepted runtime repair delta

The first complete focused calculator run exposed twelve failures and one unhandled transport
error (515/527 passing). Diagnosis corrected raw fixture selection, jsdom link selection, exact
independent floating-point expectations, reference-control observations, real-tab activation
before fake time, and unrelated typed transport fixtures. The real drawer, exact observations,
timer boundary, original scenarios and independent numeric oracles remain.

PG01 was confirmed as a missing visible Lifestyle row. Two new localized component regressions
produced assertion RED (15/17), then GREEN (17/17) after adding one existing six-line Row using
the existing label and flat raw expense. No calculation or raw data changed. Complete focused
calculator session `19942` then passed 527/527 with zero errors in 260.95 seconds. These results
precede the dependency repin and are producer receipts rather than reviewer-run tests.

An independent delta review accepted all four changed files with zero actionable findings,
revalidating nine affected identities and retaining the complete map: 129 identities / 387 layer
rows, 258 source PASS / 129 source EXEMPT / zero FAIL. It verified unchanged sequences of all
127 Unit titles and 375 complete browser declarations (372 string literals and three regex).
The producer manifest's historical count of 340 was an undercount, corrected by this complete
extraction; no binding changed. The review report SHA-256 is
`1bfb10f3c04f97a546f5f458f9efff549e536962edaddbc32a2e9c34a20dd2f1`.

| Runtime-delta repository path                                                                 | Accepted SHA-256                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/ayokoding-www/src/features/cost-of-living-calculator/shell/city-detail.tsx`             | `493e6c598a05a70dad08c12a79170d17aad2d00318bf9def6e7da9829f75a237` |
| `apps/ayokoding-www/tests/unit/features/cost-of-living-calculator/shell/city-detail.test.tsx` | `3ce3cdb34cb7bb94ab9f8eaa7675141b1fb216c06aa4e487550092a4d01df273` |
| `apps/ayokoding-www/tests/unit/fe-steps/cost-of-living-calculator.steps.tsx`                  | `51f6bcb05bcc7fffe9de176f2a06fc2897e42ca06c997edd83c0337c6312a59f` |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/cost-of-living-calculator.steps.ts`                | `9d41408e53da75ffa063e4d2ac4afb65a8473015eac5992bb6f8415a148550e4` |

The feature and three helper pins above remain unchanged. These four delta pins supersede
the two affected historical step-file pins; the immutable packet 7 record remains provenance.
The accepted build-worker packet's six files also remain unchanged by this repair.

## Outstanding full gates

Required next proof includes complete relevant calculator E2E execution with unchanged assertions
and zero retries, current full quick/static gates after the dependency repin, and the original
Integration target. The earlier 4,180-test quick success belongs to the lifecycle-repair checkpoint
and does not prove this current source. Browser corrections have static checks only. PG01's
source and focused Unit repair is substantiated; browser rendering and full gates remain open.
The source repair action stays unchecked until all required proof is accepted.
