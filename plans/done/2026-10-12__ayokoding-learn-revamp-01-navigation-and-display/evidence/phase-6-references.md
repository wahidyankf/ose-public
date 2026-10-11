# Phase 6 Evidence — References Conversion (S10)

> Execution context: continuation of plan 01 after the Phases 0–5 checkpoint PR #680 merged to
> `main` at `73634ddce`. Work resumed 2026-10-11 in the re-provisioned execution worktree.

## Baseline reconciliation (re-measure before conversion)

The Phase 0 accuracy inventory (committed 2026-10-10) recorded **150 files in 42 courses**. A fresh
run of the same five-pattern logic (`local-tmp/ayokoding-learn/plan-01/accuracy-inventory.py`, the
Phase 0 patterns; run post-checkpoint before any conversion) measures:

| Pattern                | Pre-mechanical (today)  | After mechanical pass   |
| ---------------------- | ----------------------- | ----------------------- |
| accuracy-note text     | 255 matches / 146 files | 200 matches / 106 files |
| anchor                 | 36 / 27                 | 0 / 0                   |
| `[Unverified]`         | 121 / 43                | 121 / 43                |
| `[Needs Verification]` | 11 / 7                  | 11 / 7                  |
| `[Verified …]`         | 3 / 3                   | 3 / 3                   |
| Files (any pattern)    | 156 in 44 courses       | 134 in 39 courses       |

Diff against the Phase 0 evidence: all 150 recorded files still carry hits today; **6 additional
files** carry hits and were missed by the Phase 0 scan scope (markdown scope gap for
`learning/capstone/**` overviews and a code-scope gap, files verified with author-era git commits
(predating Phase 0), not introduced on main since):

- `apps/ayokoding-www/content/en/learn/courses/evaluating-ai-output-essentials/learning/capstone/code/runner.py`
- `apps/ayokoding-www/content/en/learn/courses/extending-neovim/learning/capstone/overview.md`
- `apps/ayokoding-www/content/en/learn/courses/frontend-essentials/learning/capstone/overview.md`
- `apps/ayokoding-www/content/en/learn/courses/inference-serving-and-model-deployment/learning/capstone/code/operate/operate.py`
- `apps/ayokoding-www/content/en/learn/courses/project-management/learning/capstone/overview.md`

The fifth delta, `capstone-forge-ready/overview.md`, was already inside the frozen 308-file union
ledger (its title was a Phase 0 title-strip target). **Frozen-content-edit-ledger resolution:** the
ledger is extended by the four files above (measured-truth, same rule family, verified pre-existing)
so the Phase 6 zero-hit acceptance over `content/en/learn/courses/**` (the lasting S10 guard's
assertion surface) is reachable. Recorded here because `evidence/phase-0-inventory.md` is committed
history.

## GREEN (snapshot URLs)

`url-snapshot.py` (runs with `python3 -I`, from the worktree root) recorded
`local-tmp/ayokoding-learn/plan-01/urls-before.json`: **156 entries** (one per current accuracy-set
file, including files without URLs), snapshotted before any content conversion took place.
`url-check.py` ran against it before conversion: "No missing URL." (sanity baseline).

## GREEN (mechanical pass — rule steps 1–2)

`rename-sections.py` (`--dry-run` then apply; both `python3 -I` from the worktree root):

- Dry run matched the recorded Phase 0 values exactly: **23 headings** renamed (21 × `## Accuracy
notes`, 1 × `## Accuracy notes and citations`, 1 × `### Accuracy notes`; same heading level kept),
  **36 anchors** fixed (`…#accuracy-notes` → `…#references`), **32** "Accuracy notes" link texts
  renamed to "References" (the 4 remaining anchors carry non-Accuracy link texts such as
  "Overview"/"topic overview", which the rule leaves unchanged), across **48 ledger files**. Checked:
  no replacement touched text outside the marker spans; sampled before/after lines verified.
- Apply rerun after a read-only diff of dry-run vs. applied state: same totals, exit 0.
- Post-apply residual per-pattern (see table above): anchors 0; prose/label/tag patterns unchanged
  (they belong to the content pass, steps 3–10).

## Known follow-ups recorded during the phase (not edited here)

Four course overviews name sections with "Accuracy"-vocabulary headings that match none of the five
§4.4 zero-hit patterns (`## Accuracy and safety notes` in analytics-and-experimentation,
containers-and-orchestration, bare-metal-virtualization; `## Accuracy boundary` in
windows-app-development). The plan's rule is a closed list and names no such variant; the lasting
guard does not flag them. Recorded for the Phase 10 follow-ups and for plan 08 (course rewrites)
instead of an out-of-rule edit now.

## Review cycle counts

(maintained during the phase)

| Actor                                       | Cycle | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| apps-ayokoding-www-general-maker set 1      | 1     | 45/45 files converted; zero residual per set; URLs kept; mirrors byte-identical. One flagged preservation resolved in integration: capstone Done-bar sentence rewritten to a plain confirmed-run claim (no sandbox/date process wording)                                                                                                                                                                                                                                                                                                                                                                                      |
| apps-ayokoding-www-general-maker set 2      | 1     | 24/45 files carried matches, converted; 21 had none; URLs kept; 2 extra mirror-obligated code files edited (rule 9) and verified byte-identical; pre-existing fence drift in security-essentials ex-38/39 + nosql ex-53 unchanged and not introduced here                                                                                                                                                                                                                                                                                                                                                                     |
| apps-ayokoding-www-general-maker set 3      | 1     | 44/44 files converted; zero residual; URLs kept; stale-library claims resolved as links (courses verified present); mirrors identical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Integration owner (zero-hit × URL × mirror) | 2     | accuracy-inventory rerun: **0 every pattern**, re-confirmed after integration fixes; url-check "No missing URL." both passes; mirror-check 48 pairs, 0 mismatches both passes                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| content-checker honesty review              | 2     | cycle 1: F1 HIGH (false sourcing claim in agentic-coding capstone/trust-verify-log) + F2–F4 MEDIUM (process wording left in converted lines) + F5 cluster (≈25 dangling "this topic's References" mentions, rewritten to name real sources inline or plain statements) + F6 (hedge pointing at nonexistent links, reworded plainly) — all fixed in the integration pass; cycle 2: **zero such findings** over 161 changed files (five systematic sweeps). 2 LOW pre-existing observations: stale github URL (capstone-first-working-software) fixed inline; extending-neovim hl_op alias unsourced claim reported for plan 08 |
| apps-ayokoding-www-link-checker             | 1     | 0 broken internal links/anchors introduced (1206 scanned with the site's real slug pipeline); 2 pre-existing broken anchors fixed at root cause; cache bookkeeping per contract (19 orphaned entries pruned, sort, no external probes in scope)                                                                                                                                                                                                                                                                                                                                                                               |
| Harness unit guard (UNIT-NODE hygiene)      | 1     | exit 0 — 8/8 assertions pass (S9 + S10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
