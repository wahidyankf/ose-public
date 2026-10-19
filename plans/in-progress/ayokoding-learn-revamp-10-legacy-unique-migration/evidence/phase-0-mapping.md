# Phase 0 Mapping Re-validation — Plan 10 (2026-10-19)

- Table shape: 107 six-column rows = header + separator + 105 topic rows; the only
  other pipe-row tables are the 4-column disposition summary (43 covered / 58 new /
  4 obsolete = 105 rows, 394 + 643 + 113 = 1150 files) and the 3-column docs crosswalk.
- The 58 `new` rows target 48 distinct new-course slugs = the 48 spec files under
  `syllabus/courses/` (filename = slug). Zero overlap with the 182 current course slugs
  (`comm` empty).
- The only `new`-row targets outside the 48 are `domain-driven-design` and
  `object-oriented-design-and-patterns`, both existing filled courses (no `status: outline`).
- Legacy corpus walk: 1150 `.md` files under `learn/legacy/`; course corpus: 182 `_index.md`
  with `category:`; outlines: 62 (`status: outline`), all in unexecuted plans 06-09 scope
  (30 erp-systems, 24 accounting, 8 others) — recorded order deviation, not a blocker.
- Per-row walk (2026-10-19, `python3` tolerant parser): 104 backticked topic rows —
  file paths counted as 1, directories walked recursively — every claimed file count
  matches exactly (BAD 0). The 105th row (65 pure-navigation `_index.md`/`overview.md`
  shells) plus the 3 other obsolete rows (`business/overview.md` 1, `cliftonstrengths` 46,
  `infrastructure/by-concept` 1) sum to 1 + 46 + 1 + 65 = 113, matching the disposition
  table's Obsolete 4 rows / 113 files. Mapping walk: 105/105 rows VERIFIED.
