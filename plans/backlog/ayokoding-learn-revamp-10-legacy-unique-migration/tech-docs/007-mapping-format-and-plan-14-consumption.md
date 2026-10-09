# 007 — Mapping Format and Plan 14 Consumption Contract

## Why a dedicated format, not prose

Plan 14 is a later plan, in a later worktree, written by an agent that did not do this plan's research.
It must be able to build its 308-redirect set and repoint its 94 `docs/` files by **parsing** this plan's
output, not by re-reading 1,150 legacy files and re-deriving the same classification. The mapping file's
own header (in
[syllabus/legacy-to-course-mapping.md](../syllabus/legacy-to-course-mapping.md#row-format-exact-for-plan-14s-mechanical-consumption))
is the authoritative, self-contained definition; this document records the design reasoning behind that
format and the exact algorithm plan 14 is expected to run, so a reviewer can check the format is fit for
that purpose before plan 14 ever needs it.

## The six-column row and its derived destination

| Field                            | Type                                                 | Plan 14 uses it to...                                                                                                    |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Legacy path                      | backtick-quoted relative path, a file or a directory | Build the `source` of a redirect rule, and find every `docs/` file whose link falls under this path                      |
| Files                            | integer                                              | Cross-check its own file-system walk still finds the same count (a drift signal if not)                                  |
| Words                            | integer                                              | Not consumed mechanically; a human sanity check only                                                                     |
| Disposition                      | `covered`, `new`, or `obsolete`                      | Decide whether the redirect's destination is a course (`covered`/`new`) or the catalog (`obsolete`)                      |
| Target                           | comma-separated course slug(s), or `-`               | Build the `destination` of a redirect rule: `/en/learn/courses/<first-listed-slug>`                                      |
| Evidence                         | prose                                                | Not consumed mechanically; a human reviewer's check only                                                                 |
| Redirect destination for plan 14 | derived from Disposition and Target, not a column    | `/en/learn/courses/<first-listed-slug>` for `covered` and `new`; `/en/learn/courses` for `obsolete`; plan 14 computes it |

## The algorithm plan 14 runs (restated, not reimplemented by this plan)

1. Read every row of the mapping table.
2. For each row, construct one or more redirect rules from `source: /en/learn/legacy/<legacy path or its
known sub-paths>` to `destination: <the row's derived redirect destination>`, `permanent: true` (a 308),
   following the same two-rule-per-domain (exact bare, then wildcard) pattern
   `src/redirects/learn-three-bucket.ts` already established, so a bare topic URL and a nested page URL
   both redirect in one hop.
3. For the 65-file navigation-index bucket row and the `obsolete` rows generally, the destination is the
   catalog (`/en/learn/courses`), the stated fallback (series decision 34).
4. For the 94 `docs/` files, read
   [syllabus/legacy-to-course-mapping.md](../syllabus/legacy-to-course-mapping.md#the-94-docs-files-that-link-into-learnlegacy-measured-2026-10-09)'s
   own directory-grouped table directly (it already names each group's destination course); repoint each
   file's link and, where the surrounding sentence says "learning path" or "educational foundation",
   rewrite that one sentence to name the destination course instead.
5. Re-validate every Target slug against the real course corpus at the time plan 14 runs (a course could
   have been renamed by an intervening plan), per
   [syllabus/README.md](../syllabus/README.md)'s own stated maintenance contract.

This plan does not implement steps 1 to 5; it only guarantees the mapping table and the `docs/`
repoint table are complete and in the stated format so that a later plan can.

## What this plan's own completion gate checks (not plan 14's job)

- Every one of the 1,150 real legacy files matches exactly one mapping row (FR1 in
  [prd.md](../prd.md#functional-requirements)).
- Every `covered` and `new` row's Target slug resolves to a real, existing course directory (FR7).
- The 94-file `docs/` table's total matches the series brief's own measured count of 94 (cross-checked in
  [brd.md](../brd.md#evidence-measured-2026-10-09-at-originmain-bb7f90137)).

These three checks are this plan's contribution to making plan 14 mechanical; they are not a substitute
for plan 14 actually running its own redirect-generation and link-repoint steps, which this plan does not
do (series decision 34 splits migration, this plan's job, from deletion and redirection, plan 14's job).
