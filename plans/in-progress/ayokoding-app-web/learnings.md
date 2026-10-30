# Learnings: ayokoding-app-web

<!-- Append sanitized observations during implementation. Triage every entry before archival. -->

## 2026-10-30 — P2-Tools codec migration (execution)

- Stale test expectations outlive the code they pin: after the seed moved from fake engines to
  shared datasets, web/BDD/E2E tests still asserted the retired codec while the product was
  already correct per plan 004. Arbiters that settled it: the current old-app `url-state.ts`
  codecs plus plan 004, not the loudest test file. When product and maintained tests disagree,
  check which one the plan and the live parity source bless before editing either.
- Shared-data vectors make cross-runtime assertions honest: fixtures keyed by current-codec query
  state (`harness=command-code-pro&tier=planning`) let Go and TypeScript prove the same figures
  without copying each other's output. Hand-written figure literals in step code are the smell.
- `pkill -f <pattern>` matches the shell running the command when the pattern appears in its own
  command line; two sessions died to this. Kill owned listeners by port (`fuser -k 3102/tcp`) or
  exact process name instead.
- Pre-existing failures in foreign-owned content (stale `estimatedHours` in two courses) are
  findings to route, not defects to repair: this plan never owns course content, so the check
  stays red and the owners get the row. Repairing it here would be scope theft.
- A HIPPO memory-pressure shed is transient infra, not a verdict: the old-app unit rerun shed
  after 173 passing checks with no failure signal. Focused reruns separate shed from genuinely
  red; record which one it was.

## Triage (2026-10-30, pre-archival)

All five entries above are execution-instance observations, not repo-rule changes: no governance,
skill, or shared-doc edit is proposed from them. Disposition: retained in this plan's archived
record as execution evidence. No entry is routed to another durable owner; none is discarded —
each names its concrete proof (failing suites, logs, wire captures) in `delivery.md` and
`evidence/`. Revisit only if a second plan hits the same shape (codec-stale tests, pkill
self-match, foreign-content reds, shed-vs-failure ambiguity).
