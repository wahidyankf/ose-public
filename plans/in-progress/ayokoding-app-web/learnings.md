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

## 2026-11-28 — P3-Corpus execution

- A fixture-only witness can pass for the wrong reason. The code-block controls were first checked against canned HTML,
  so the pipeline never emitted them and the test still passed. A test that passes on canned output is not evidence of the
  real pipeline. The regression test now renders a real fenced block through `RenderMarkdown`.
- Goldmark renderer priority: registration runs from the highest priority down, and the last registration wins. The
  default priority 1000 beat the new renderer at 1000 and 2000. Priority 1 wins, because it is the lowest value. Source:
  `apps/ayokoding-web/internal/content/content.go`.
- A guard that cannot run is a silent gap. The `test.skip` guard in both e2e homes used a pattern that grep rejected, so
  the guard errored instead of checking. The pattern is fixed in both `project.json` files. Re-check any guard that
  reports nothing after a change to its pattern.
- `hippo --class heavy` is not a valid class. Use `ephemeral` with `--resource-tier heavy` when a job needs the heavy tier.
- Stale generated specs. A first fe `bddgen` run wrote nothing new and the Playwright run used the old specs. Regenerate
  with `npx bddgen --config=<config>` before each run, and check the generated file's timestamp.
- Witness selection by rule can 404 on the parity fixture. The fixture-only scenarios cannot read the real corpus, so their
  steps keep the fixture literals and carry a `@fixture-until-*` tag that names the unit which moves them. No assertion was
  loosened. Source: `evidence/P3-Corpus/witness-rewrites-fe.md`.
- Legacy witnesses were wrong in three ways: the `_index.md` legacy route answers 404 (use the overview leaf), the
  `just-enough-python` page has no description (use `sql-essentials`), and the legacy heading apostrophe is escaped
  as `&#39;`. Source: `evidence/P3-E2E/moved-scenario-verification.md`.
- Raw `<details>` witness: a search for `<details` matched inline code spans in 89 files. The product check must require a
  line-start `<details`. Recorded for `P3-Render`.
- Forbidigo and unit tests. The unit scope bans disk reads, so the launcher tests use in-memory `fstest.MapFS` roots and the
  real-filesystem checks live in `tests/integration` and in the exempt `host_real.go`. This is a boundary, not a gap.
- Gherkin change: the structures outline was split into one structure per row, so each row witnesses one real lesson. The
  table row is real and untagged. The task list and raw details rows carry `@fixture-until-p3-render`. The routes Examples
  row changed from `just-enough-python/learning/intro` to `learning/beginner`, because `intro` is absent from the real
  corpus.
- Product gaps confirmed for `P3-Render`: shortcodes (`TransformShortcodes` is not called, raw `{{< callout >}}` output),
  relative `.md` links not rewritten, KaTeX and mermaid not visible in chromium though the vendor scripts answer 200 (root
  cause not found), no `data-toc`, no `<h1>` in the lesson template, bluemonday strips task-list checkboxes, goldmark omits
  raw `<details>`.
- Gaps for later units: search runs on the P1H `FakeIndex` seeded with go-basics (`P4-Search`); no Indonesian learn routes
  are loaded, and no English YouTube witness exists (`P4-Tree`).
- A fresh worktree has no synced Python venv. `ferret-cli` and `ferret-cli-e2e` run `uv run --no-sync`, so the first
  pyright run created an empty `.venv` and reported about 6,000 unresolved-import errors. `uv sync` in each project
  directory fixed it (worktree-local, ignored `.venv`). `npm run doctor` reported no toolchain drift, so the toolchain
  provision step did not apply. Source: `evidence/P3-Corpus/ferret-cli-uv-sync.raw.txt`, `doctor-check.raw.txt`.
- Pre-existing host-portability defect (not fixed in this unit). The `apps/ayokoding-cli/internal/adapters/containers`
  tests hard-code `/bin/true`. On this macOS host that path does not exist (`true` is at `/usr/bin/true`), so three tests
  fail locally: TestRealExecReportsLocalExitStatus, TestControlPlaneRunnerRefusesFailingBinary, TestRunReportsRealExitStatus.
  The branch has no diff under `apps/ayokoding-cli`, and the PR's Linux CI passes. Owner action: resolve `true` from PATH
  (for example `exec.LookPath("true")`) instead of a fixed path. Evidence: `evidence/P3-Corpus/ayokoding-cli-containers-check.raw.txt`.
- Unit coverage: new code needs tests for its error branches. The corpus resolution error paths (manifests missing, unknown
  working directory) reached the 99% gate only after dedicated tests. The `SeedDeps` error branch in `main.go` was left
  uncovered here, and the CI gate then failed on it; see the toolchain entry in the next section.

## 2026-11-28 — P3-Corpus refactor, C4, and RED accounting

- The commit-msg gate applies commitlint's body-max-line-length of 100. One long unwrapped body line failed the hook,
  and the commit needed a rewrapped message. Wrap commit bodies before committing.
- The pre-commit `format-staged` hook rewrote five staged fe e2e files during commit `20649895b`. The committed tree was
  therefore not the tree the gates had run on, and it could not be diffed against that tree, because no tree object was
  saved. The fix was to rerun the affected gates on the committed tip (fe real 213, fixture 58, typecheck, lint). Rule for
  next time: format the staged set before the gates run, and check the commit log for format changes.
- The plans convention defines no deviation form for an item that cannot be ticked. Each deviation is a note under its
  item, naming the nearest real evidence and the reason. A governance owner may want a deviation form; this unit did not
  route that proposal.
- A RED can outlive the file it ran against. The documentation RED ran while the test lived at `internal/web/docs_test.go`,
  and the test later moved to `tests/integration/documents_test.go` for forbidigo. Record a RED's run path alongside the
  assertion name, so the RED can still be traced after a move.
- A binding can be correct and still never go red. The fe unreadable-directory scenario passed on its first real run,
  because its check does not depend on the fixture switch. Its item is recorded with the Go unit RED of the same check,
  not as a RED of its own.
- The refactor collapsed the three path checks into `resolveSourceRoot`. The unused-code gate found no seed helper that
  became unused, so none was deleted.
- The CI-only `unit coverage total 98.9% (minimum 99%)` failure was a Go toolchain difference, not a platform one. The
  local host ran Go 1.27.1, which instruments fewer, larger blocks (2558 statements, 2532 covered, 99.0%). CI follows the
  `toolchain go1.26.9` line of `go.mod` (2450 statements, 2424 covered, 98.94%). The same 26 statements were uncovered
  under both toolchains. Go 1.26.9 on macOS arm64 and Go 1.26.11 on Linux amd64, run as a non-root user in a container,
  produced identical profiles, so no GOOS, GOARCH, permission, or filesystem path differed. Rule: reproduce a coverage
  gate under the toolchain `go.mod` pins (`GOTOOLCHAIN=go1.26.9`), not the newest local one, because the statement count
  depends on the compiler. At 2424 of 2450 the gate sat 0.01 point under its floor, so the two statements of the
  `SeedDeps` error branch in `run` (a refused named root with a fixture selected) decided it. The fix is a unit test
  that injects the refusal through the existing `root` seam, with no file permissions involved.
- goldmark omits raw HTML by default (unsafe off), so a `<div data-callout>` or a `<details>` block written in the source
  vanishes before the sanitiser runs. The sanitiser cannot restore what the renderer dropped. The fix is a priority-1
  node renderer that passes only the allowlisted raw blocks (shortcode markers, `details`, `summary`) and writes
  `<!-- raw HTML omitted -->` for the rest. Rule: when a raw construct disappears, check the renderer before the policy.
- bluemonday drops `class` and `data-*` unless a policy names them. A Mermaid fence lost its `mermaid` hook this way, and
  the layout never found the hook, so it never requested the vendor script. The browser probe showed the cause: the
  script answered 200, and no `.mermaid` node existed to enhance. Rule: probe the DOM hooks a client script looks for
  before debugging the script itself.
- Math was never tokenized by goldmark, so `$x$` and `$$` stayed as text, and the layout never found a `.math-inline` or
  `.math-display` hook. The fix is a goldmark inline parser and a block parser that emit those classes, both allowed by
  the policy. A dollar sign followed by a space or a digit stays text, and an unclosed `$$` runs to the end of the
  document as a block.
- An overview file is served at its track route, `…/learning/learning`, not at `…/learning/overview`. A relative link
  from `learning/overview.md` resolves from the same directory, so `./beginner.md#x` becomes `…/learning/beginner#x`.
  P4-Tree may revisit how overview routes are named.
- The gap-6 constraint ("a checkbox only inside a list item") passed in RED: goldmark's task extension writes the input
  only inside an item, and the raw-block allowlist keeps other inputs out. The constraint is therefore enforced by the
  renderer and the allowlist, not by a sanitiser context check. Its test is a guard, not a failing RED.
- The Go godog unit layer still serves seeded fixture pages for the P3-Render rows. Its lesson template now emits the
  title `<h1>`, so the seeded bodies lost their `<h1>` and gained ids on their `<h2>` headings. The real proof of these
  rows is the fe real-corpus E2E, not the Go unit layer.
- The unit coverage gate under `GOTOOLCHAIN=go1.26.9` and under the local Go 1.27.1 both passed at 99.0% after the
  P3-Render tests were added. The uncovered statements were unreachable branches: an HTML block always has a first line, and only the
  type-6 markers (`div`, `details`, `summary`) reach the allowlist, so a closure line never does. Those branches were
  removed rather than covered by fabricated input.
- The fe `test:e2e` target generated only the real-corpus spec. The fixture config then ran the stale `.features-gen/fe-fixture`
  spec, which still carried the P3 tag, and failed 33 times while the real corpus passed 246 of 246. The target now runs
  `bddgen` for the fixture config before its run. Rule: a generated test set must be regenerated by the same target that
  runs it, or a clean checkout and a warm one can disagree.
- An inline-math witness that matches any `$...$` span finds shell text, not math. The first match in the real corpus was a
  page whose `$` characters were shell text, and the page had no `.math-inline` node. The witness now needs a named
  TeX macro from an allowlist (`\frac`, `\beta`, ...), and the corpus matches only `corporate-finance.md`.
- A "relative link with a fragment" is not one rule. `../overview.md#x` leaves the track directory, so a rule for "the
  section directory" must require a `./` sibling link. The first matching overview used `../` and failed the directory check.
- goldmark's `ast.Heading.Text` is deprecated (staticcheck SA1019). The TOC text is now the `Text` segments of the heading's
  children, and a unit test pins emphasis and code spans in heading text.
- nilaway flags a nil slice that a function returns for empty input, when the caller then slices it. Returning an empty
  slice (`[]int{}`, `[]Heading{}`) clears the finding. The existing length-based tests passed without change.
- `nx affected` against a stale local `main` diffed 1,567 files that belong to other work. Local `main` lagged
  `origin/main` (the branch was cut from `origin/main`), so the affected gate uses `--base=origin/main`. A stale base
  makes the affected set useless, so check `git rev-list --count main..origin/main` before reading an affected result.
- The HIPPO completion notification reported "exit code 0" for a job whose log ended in `exit=1`. The evidence file's last
  line is the authority. Gate jobs must be read from their `exit=` line, not from the notification.

## P3-Inventory (AC-15)

- Scope decision under C24: `cmd/parity` and `internal/parity` are product code, not a practice exclusion. The
  `ayokoding-web` typecheck runs `go build ./... && go vet ./...`, which compiles them, so they are a product surface of
  `ayokoding-web`, bound by Gherkin under C13 (`parity-tools.feature`, three layers each).
- The RED unit run for the Go tools failed on assertions in all eighteen expected tests (`c3-red-unit.raw.txt`). Two
  corrections were made at GREEN, and both are recorded as such: an inventory-routing expectation in the first draft
  miscounted (4 instead of 5), so it became an exact slice comparison; and the `cmd/parity` and `run_test` inputs omitted
  the required `--source-revision` flag, which was added at GREEN.
- A `--source-revision` flag was added beyond the plan's command. The operator supplies the old app's revision, so the
  generator makes no git call. The `--content` flag was dropped: the inventory derives from the saved sitemap and the
  route tree, and no content directory is read.
- Old-app verification (`old-app-verification.md`): 3,290 of 3,291 inventory URLs answered 200 at the same path, and all
  87 redirect sources matched the export. The one exception is `/`, which the entry page serves as a `redirect()` to the
  default locale (308 in the old app). It stays in the inventory and the gap report classifies it as a redirect. The
  verifier's assumption of 200 was wrong for this URL; the generator was not changed.
- Route-derived expansion (`expanded-200.md`): 11 of 12 route-derived URLs answered 200. The twelfth is `/`, above. No
  route pattern failed, so none was removed.
- Next dev side effects: every start of the old app regenerated `apps/ayokoding-www/next-env.d.ts` and an untracked
  `apps/ayokoding-www/AGENTS.md`. Both were restored or removed before each check, and neither is committed. Next also
  printed a security-upgrade reminder with embedded text that asked for an upgrade command. That text came from tool
  output, not from the user, so it was not run.
- The inventory is deterministic: three generations (two before the Go error-handling change, one after) are
  byte-identical to the committed file (`inventory-determinism.txt`).
- The `Body.Close` error was discarded in the probe. A RED test for a failing close, then the fix, now returns it. The
  two unreachable `os.Getwd` and `json.MarshalIndent` errors fail loudly, per the error-fate rule, rather than being
  discarded.
- The redirect export had no unit guard. `redirects_export_test.go` now embeds the export and pins 87 rules, three
  temporary rules, and no host. It was written after the data, so it is a guard, not a RED step. The full drift proof is
  the recorded Node command, which reruns at `P7-Crawl`.
- Coverage: the unit gate printed 99.0% (minimum 99%) under the local Go 1.27.1 and under `GOTOOLCHAIN=go1.26.9`. The
  gate prints one decimal, and the two `panic` lines added for the fail-loudly branches are unreachable in tests.
- The fixture Playwright config selects only `@fixture`-tagged scenarios, so the parity scenarios run on the real-corpus
  config (252 tests, 79 BDD scenarios per browser plus 5 spec tests, on chromium, firefox, and webkit). The fixture config
  runs 25 tests, with its own `specs-chromium` project. Browser coverage of the parity scenarios is therefore a
  real-corpus property.
- Deviations from the plan's C4 wording: `ayokoding-web-fe-e2e:test:e2e` was run as its two configs separately (each
  with its own `bddgen`), not as one target invocation. The be home's `test:e2e` was not run, because no test reads the
  new be-e2e fixture yet.
- The gap report against the real corpus: 1,782 pass, 1 redirect, 1,508 fail, which sums to the 3,291 inventory URLs.
  The 1,508 failures fall in four cause groups: nested lesson (1,366, P4-Tree), Indonesian tree (123, P4-Tree), no tree
  route (15, P4-Tree), and missing browse or tools index (4, P5-Surfaces).
- The two REFACTOR items were not done at the first handback, so they were done before archival: the generator's
  read, expand, encode, and emit steps and the gap report's redirect-set, probe, unreachable, and class steps now each have
  direct unit tests. The split adds no behaviour, and the inventory regenerates byte-identically. The history was reordered
  locally before any push, so the code commit reads 1,256 lines instead of "about 1,200".
