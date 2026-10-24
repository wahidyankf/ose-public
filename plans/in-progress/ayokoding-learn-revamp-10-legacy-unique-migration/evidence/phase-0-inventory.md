# Phase 0 Inventory — Plan 10 Legacy-Unique Migration (2026-10-20)

Method: [tech-docs/001](../tech-docs/001-current-state-and-inventory-method.md) per-topic
recursive walk against every row of the mapping table, run 2026-10-19/20 with a tolerant
parser (backticked rows; file paths count as 1, directories walked recursively).

- 104 backticked topic rows: every claimed Files count matches a fresh walk exactly.
- Row 105 (65 pure-navigation `_index.md`/`overview.md` shells): consistent with the
  disposition table (Obsolete 4 rows / 113 files = 1 + 46 + 1 + 65).
- **Mismatches: none.** No cause to record; nothing blocks Phase 1 on inventory grounds.

Corpus totals: legacy 1150 `.md` files; courses 182 (`category:`); outlines 62, all in
unexecuted plans 06–09 scope (recorded order deviation, see `phase-0-baseline.md`).
Slug collision check: 48 new slugs vs `origin/main` course dirs — zero overlap
(`comm` empty; full re-validation in `phase-0-mapping.md`).
