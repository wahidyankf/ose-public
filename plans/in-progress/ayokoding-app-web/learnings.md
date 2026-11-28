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

## 2026-11-28 — Amendment authoring (plan-level)

- Knowledge Capture is reopened by the parity amendment (Phase 9 of `delivery.md`). Append execution
  observations of Phases 3 to 8 above this line and triage them in Phase 9; the pre-archival triage
  above covers only the five entries that existed on 2026-10-30.
- A fixture default hides gaps: the first plan declared "full parity" while the app served a canned
  corpus, so no test could fail for missing real content. When a plan's bar is "same as the live site",
  its proof must run on the live site's real data and enumerate the live site's URLs, not only its
  scenarios. Disposition: open. The Phase 9 triage action in `delivery.md` routes it to one durable owner
  and records its terminal state.

## 2026-11-28 — P3-E2E execution

- Behaviour coverage moved by one scenario, not zero. The baseline `ayokoding-web-e2e:test:behaviour:coverage` checked
  1001 scenarios; after the moves and the split it checks 1002, with no findings. The +1 is the fixture-only split row
  "A fixture-only old URL redirects 308 to its current page", which the unit adds on purpose. Eighteen moved scenarios
  were removed from their source files and eighteen were added to the four new files. Evidence:
  `evidence/P3-E2E/coverage-before-moves.raw.txt` and `evidence/P3-E2E/coverage-after-moves.raw.txt`.
- Real-corpus drafts are not lessons. Two `draft: true` files exist in the real corpus, `paths/skills/e2e-fixture-alpha`
  and `-beta`, and both are path index pages. The lesson-level draft scenarios still have no real witness. Source:
  `evidence/P3-E2E/moved-scenario-verification.md`.
- Literal fixture text in moved scenarios. The legacy-archived scenario asserts "Legacy Software Engineering" and
  "Archived canonical content", which the real corpus does not contain, although the real page exists. `P3-Corpus`
  rewrites these assertions to rule-found text.
- WebKit on macOS does not move keyboard focus to links with Tab by default. The scenario "Keyboard readers can skip the
  repeated navigation" fails on the WebKit project on this host both on this unit's tree and on the base revision
  (`origin/main`), with the same assertion. Chromium and Firefox pass it. The owner decides how the suite proves
  skip-link keyboard access on WebKit.
- A browser suite needs the Playwright browsers installed on the host. The first fe run failed at browser launch, and
  `npx playwright install` under the transactional guard fixed it. The repository's CI action runs the same command.
- A port-collision retry inside a server-start helper is a retry under another name. The fe helper's start loop retries
  on `bind: address already in use`. The be helper does one start with no retry. It still picks its port with a
  check-then-bind (`freePort`), which leaves a small race that the owner should look at.

- Root cause of the WebKit skip-link failure (fixed in the step, not skipped): on macOS, WebKit moves focus to links on
  plain Tab only when the system keyboard-navigation setting is on. Option+Tab (`Alt+Tab`) focuses them. The probe is
  `evidence/P3-E2E/webkit-focus-probe.cjs`. The base revision failed the same way, so the defect was host behaviour, not
  this unit's change. Record: `evidence/P3-E2E/webkit-skip-link-root-cause.md`.
- Root cause of the savings vector failure on arm64: the Go compiler fused a multiply with a later subtraction across
  statements (FMSUBD, then FNMSUBD). An explicit `float64(...)` conversion did not stop it on Go 1.26.1, so the fix uses a
  non-inlined `mulRounded` call. The shared vector equals the plain IEEE result that the TypeScript reference computes
  (`apps/ayokoding-www/.../calc.ts`, which JavaScript never fuses). Record:
  `evidence/P3-E2E/savings-arm64-fusion.md`. Triage: the fusion is a toolchain fact, not a repo rule; no rule edit proposed.
- A port-collision retry hides the real port. The binary prints nothing at startup, so an ephemeral port cannot be read
  back; the suite cannot remove the freePort race without a product change (print the bound address). Recorded in
  `evidence/P3-E2E/server-port-and-retry.md`; the product change is not part of this unit.
