# 007 — Decision Records

Fifteen decisions this plan makes. Each states the context, the choice, what was rejected and why, the
evidence, the cost, and what would make the decision worth revisiting. Decisions that the user already
resolved for the whole series (34, 35, 37, 40, 41, 42) are restated in [../brd.md](../brd.md#resolved-series-decisions-this-plan-relies-on)
and are not re-decided here. Dates are 2026-10-09 to 2026-10-10 unless stated.

| Id  | Decision                                                                                        |
| --- | ----------------------------------------------------------------------------------------------- |
| D1  | Redirects are a typed table in `next.config.ts`'s `redirects()`, through one aggregator         |
| D2  | The table is data in the app, proven against the mapping by a temporary parity test             |
| D3  | Every sub-page redirects to the course root                                                     |
| D4  | The fallback is the catalog, with a 308, for obsolete, navigation, and unmatched URLs           |
| D5  | The pre-IA address gets its own direct rules and the old module is deleted                      |
| D6  | A frozen inventory fixture backs a permanent unit test and a permanent end-to-end crawl         |
| D7  | One pull request, ordered commits, no feature flag                                              |
| D8  | The 2023 rant keeps its text and loses six links                                                |
| D9  | Each `docs/` link is repointed by its own longest-prefix row, to the course root                |
| D10 | Every link-removing change lands before the single deletion commit                              |
| D11 | Rendering coverage moves to one draft fixture page; the shortcode components stay               |
| D12 | Governance text is edited, not rewritten; no new rule                                           |
| D13 | The terminal gate runs last, blocks archival, has no waiver, and reports earlier plans' defects |
| D14 | The architecture-cases-routes feature is deleted                                                |
| D15 | The search-scope scenario gets a surviving English title                                        |

## D1: Redirects are a typed table in `next.config.ts`'s `redirects()`, through one aggregator

**Context.** 1,150 legacy URLs and their 1,148 older pre-IA twins need a permanent redirect each (series
decision 34). The application already redirects through `next.config.ts` with four small modules under
`src/redirects/`.

**Decision.** Add a fifth module, `legacy-removal.ts`, that builds typed rules from a table, and one new file,
`src/redirects/index.ts`, that exports the full ordered array. `next.config.ts` spreads only that array.
`permanent: true` makes the framework answer HTTP 308.

**Rejected.**

- _Edge middleware._ It runs on every request, including the ones that are static pages today, to answer a
  question the framework already answers before it looks at files. The repository has no middleware file, and
  the unit simulator that proves the existing modules could not exercise it.
- _`vercel.json` redirects._ `vercel.json` here holds headers and build commands only. Rules there bind the
  host, cannot run under `next dev`, `next start`, or the end-to-end projects, and could not be tested by the
  unit simulator.
- _A catch-all page that renders a redirect._ It answers 200 or 307 depending on code, not a cacheable 308.
- _Leaving the module list in both `next.config.ts` and the test._ The test's copy can drift from the config's.
  One exported array removes the second copy.

**Evidence.** The existing modules (86 rules today) and the Next.js documentation for `redirects()` (first match
wins, `permanent: true` is 308). The platform limit for `next.config` redirects is 1,024; the design totals 493.

**Consequences.** 418 rules are added and 12 removed. Order matters (the legacy-removal rules go last), so the
aggregator carries the comment that says why.

**Revisit when** the total would exceed 800 (Phase 0 checks this), or the host changes its redirect handling.

## D2: The table is data in the app, proven against the mapping by a temporary parity test

**Context.** Plan 10's mapping file lives in a plan folder that is archived (moved to `plans/done/`). The
application must not read a plan folder at build time.

**Decision.** `LEGACY_ROUTES` is a typed array of 104 `{ path, course }` rows committed in
`legacy-removal.ts`. A temporary test, run once before the deletion and removed in it, parses the as-merged
mapping and the real tree and fails unless the array equals the mapping and covers every file exactly once.

**Rejected.** _Generate the table at build time from the mapping:_ couples the build to an archivable folder.
_Generate it from the content tree:_ the tree is deleted in the same pull request. _Keep a hand-written table
with no parity test:_ 104 rows copied by hand with nothing to prove them is exactly the error this plan exists to
prevent.

**Evidence.** The mapping is prefix-free and complete (1,150 files, 105 rows), measured 2026-10-10 with a
walk of the tree against the table.

**Consequences.** A reviewer reads 104 lines of data. The temporary test is extra work that leaves no code
behind, but its output (the inventory, D6) does stay.

**Revisit when** a later plan changes a destination: it edits the table and the inventory line together.

## D3: Every sub-page redirects to the course root

**Context.** The mapping works at topic granularity: a row such as
`software-engineering/programming-languages/rust` maps a whole folder (about 100 pages) to one course. A legacy
page deep in that folder (`.../rust/by-example/advanced`) has no one-to-one counterpart in the new course.

**Decision.** A wildcard rule sends everything below a row's path to `/en/learn/courses/<slug>` with no
`:path*` in the destination. The course landing page lists its lessons.

**Rejected.**

- _Carry the sub-path (`/en/learn/courses/<slug>/:path*`)._ The new course's lesson paths do not mirror the old
  ones, so nearly every such URL would 404, and a 404 after a "permanent move" is the worst outcome.
- _Map every page by hand (1,150 rows)._ It invents equivalences the mapping never established and cannot be
  verified by a reviewer line by line.
- _Redirect deep pages to the catalog._ It throws away the topic information the mapping does hold.

**Evidence.** The mapping has 105 topic rows and no page-level rows. The new courses are laid out differently
(`overview.md`, `learning/`, `drilling/`), so an old lesson path has no mirror to point at.

**Consequences.** A visitor who followed a link to one lesson lands on the course root. The inbound link still
works and the course is the right subject. Hop count stays at one.

**Revisit when** a course gains stable lesson paths that mirror the old ones and the user wants deep links.

## D4: The fallback is the catalog, with a 308, for obsolete, navigation, and unmatched URLs

**Context.** 113 files (46 CliftonStrengths, a business overview, a stub, and 65 navigation pages) have no
equivalent course. Any legacy URL that no row matches (a typo, a page deleted before this plan) needs an answer
too.

**Decision.** Answer all of them with a 308 to `/en/learn/courses`, the catalog (series decision 34 names the
catalog as the fallback). A pair of rules at the end of the legacy group and one pair per pre-IA domain catches
anything the rows did not.

**Rejected.** _HTTP 410 Gone for obsolete topics:_ more honest to crawlers, but series decision 34 chose
equivalents with a catalog fallback and a 410 gives a human reader nothing to click. _A 404:_ discards the
inbound link. _The Learn home as fallback:_ the catalog is the page that helps someone looking for a topic.

**Evidence.** Decision 34 (user, 2026-10-09). The catalog page exists and answers 200 at
`/en/learn/courses`.

**Consequences.** Search engines may treat a long run of redirects to one generic page as a soft 404 and drop
those URLs from the index over time. That is acceptable for pages the site chose to retire.

**Revisit when** the user wants retired topics answered with 410.

## D5: The pre-IA address gets its own direct rules and the old module is deleted

**Context.** Today `learn-three-bucket.ts` redirects the six older pre-IA domains
(`/en/learn/software-engineering/...`) to the legacy bucket. Deleting the bucket orphans those 12 rules.

**Decision.** Replace them by 214 rules (202 row rules plus 12 fallback rules) that send each pre-IA address
straight to the destination, one hop. Delete the old module and its `RELOCATED_DOMAINS` list moves into the
new one.

**Rejected.** _Keep the old module and let it chain (pre-IA, then legacy, then course):_ it leaves a module
named "three-bucket" whose target no longer exists, doubles the hops for the oldest links, and keeps a
12-rule loop-safety surface for nothing. _Drop pre-IA redirects:_ those addresses are still printed in
conventions and old posts; this would 404 them.

**Evidence.** Measured: the old module generates exactly 12 rules; about 13 convention and skill files show a
pre-IA address as an example ([005](./005-rules-and-docs-impact.md#report-only-stale-paths)).

**Consequences.** +214 rules (214 of the 493 in the final array). All stay well inside the platform limit. Two files
directly under `legacy/` have no pre-IA twin, so the pre-IA group covers 1,148 URLs, not 1,150.

**Revisit when** nothing links to pre-IA addresses any more (check the server logs); the group could then go.

## D6: A frozen inventory fixture backs a permanent unit test and a permanent end-to-end crawl

**Context.** The best test of "every legacy URL redirects" walks the tree, and the tree is deleted here.

**Decision.** Generate `legacy-url-inventory.tsv` once from the tree and the mapping with a snapshot test, commit
it, and keep two permanent tests that read it: a unit test that follows every URL through the real
`redirectRules`, and a be-e2e step that requests every URL from a real server with redirects disabled.

**Rejected.** _Compare the table with itself:_ proves nothing about the table's correctness. _Keep a copy of
the 1,150 pages for testing:_ 6.65 million words of dead content. _Rely on a sample:_ a sample can pass while
one of 104 rows is wrong.

**Evidence.** The two derivations (tree plus mapping, versus the typed table) are independent, so agreement
means something.

**Consequences.** A 1,150-line fixture lives in the repository. Changing a destination later means editing two
files, which is the point.

**Revisit when** redirects are retired (then the table, fixture, and tests go together).

## D7: One pull request, ordered commits, no feature flag

**Context.** One plan equals one pull request (series rule). The change touches 1,150 deleted files,
about 94 docs files, about 30 test-side files, and new code.

**Decision.** One pull request of ordered commits (listed in [010](./010-pr-size-rollback-and-series-closure.md#pr-size-strategy)).
The deletion is one commit, so the pull request's file count is dominated by deleted files that are trivial to
review. No feature flag: the redirects and the deletion take effect together on deploy.

**Rejected.** _Splitting redirects and deletion into two pull requests:_ against the one-plan-one-PR rule, and
a first PR that adds redirects while the pages still exist would hide the pages (redirects win over files)
without removing them. _A flag:_ there is no runtime behaviour a flag would gate; a redirect table is
either deployed or not.

**Evidence.** GitHub's diff view cannot show a changeset of this size; deleted files collapse in review and
`rtk git diff --stat` carries the proof.

**Consequences.** Review effort concentrates in the redirect table, the tests, the docs repoint, and the
rule edits; the count of changed files besides the deleted ones is in [009](./009-file-impact.md).

**Revisit when** never for this plan; it runs once.

## D8: The 2023 rant keeps its text and loses six links

**Context.** The post
`content/en/rants/2023/04/my-cliftonstrengths-journey-it-makes-me-more-confident-to-take-the-engineering-management-path.md`
links six words to pre-IA CliftonStrengths pages. Those topics map to an obsolete row (46 files; the topic was
classified obsolete by plan 10 for trademark and licensing reasons), so after this plan each of those six links
would 308 to the catalog.

**Decision.** Remove the six link targets and keep the words. The post is a dated personal essay; its sentences
are not rewritten.

**Rejected.** _Leave the links:_ a reader clicking a theme link would land on the course catalog, which says
nothing about CliftonStrengths. It also costs nothing to leave, so this is a quality choice, not a gate; the
user can reverse it. _Link the catalog explicitly:_ the same mismatch, written down. _Rewrite the post:_
changes an author's dated words.

**Evidence.** Measured: six links on lines 16 and 18; the destination row is `Obsolete`
(`personal-development/tools/cliftonstrengths`).

**Consequences.** The post reads the same and links nowhere for those six words. The `id` locale has its own
CliftonStrengths section (untouched; it is Indonesian content, series decision 35), which is a flag in
[../README.md](../README.md#flags-for-the-user).

**Revisit when** the user wants CliftonStrengths content to return under another form.

## D9: Each `docs/` link is repointed by its own longest-prefix row, to the course root

**Context.** 170 links in 94 files point into the legacy tree; plan 10's repoint table groups them in 16
groups, and 11 links in 6 groups differ from their group's destination.

**Decision.** The rule per link: strip everything through `learn/legacy/`, drop the fragment, find the longest
mapping row that is a prefix, link `learn/courses/<first-listed-slug>/`. Edit link text and the carrying
sentence only as far as a claim about the old by-example or in-the-field tracks would otherwise be false.

**Rejected.** _Use the group destination:_ gives 11 links the wrong course. _Keep fragments:_ the validator does not
check anchors, so `#example-8-...` would pass and point nowhere. _Rewrite the surrounding documents:_ the files
are OSE style guides, not tutorials; only the prerequisite statement changes.

**Evidence.** Measured with a longest-prefix lookup of all 170 links against the 105 rows; zero hit an obsolete
row. 12 distinct destination courses.

**Consequences.** The link validator and a temporary verify test prove the 94 files. A reviewer reads 158
changed lines.

**Revisit when** a course is renamed (any slug change must change the docs link in the same commit; the link
validator catches the miss).

## D10: Every link-removing change lands before the single deletion commit

**Context.** The link validator fails the pull request if any `docs/` or governance link points at a deleted
file.

**Decision.** Order: decouple tests (Phase 1), swap the redirect module (Phase 2), repoint docs (Phase 3),
edit rules (Phase 4), then delete the tree (Phase 5). Each commit passes its own checks.

**Rejected.** _Delete first and fix after:_ red commits in the middle of the history, and a rollback of one
commit leaves a broken state. _One giant commit:_ unreviewable and not partially revertible.

**Evidence.** `rtk ./hippo run ... ./rhino md internal-link validate` fails on a missing target (shown by the
negative control in [003](./003-docs-repoint-and-link-validation.md#link-validator-and-its-negative-control)).

**Consequences.** The legacy pages exist, but are unreachable (the redirect wins) from Phase 2 until Phase 5.
That is a state of the working branch only; nothing deploys until the merge.

**Revisit when** never.

## D11: Rendering coverage moves to one draft fixture page; the shortcode components stay

**Context.** Seven end-to-end scenarios prove the renderer (highlighting, callout, tabs, steps, inline and
block math, Mermaid) on legacy pages. The callout, tabs, and steps shortcodes appear in 60 legacy files and in
no file outside the tree.

**Decision.** One draft page, `content/en/learn/e2e-fixture-rendering.md`, carries one of each element, mirroring
the existing `id` fixture. The scenarios keep their assertions and change their URL. The shortcode components
stay in the application with their unit tests.

**Rejected.** _Point the scenarios at real course pages:_ they carry none of the three shortcodes, so three
scenarios would assert absent elements. _Delete the scenarios:_ deletes the only end-to-end proof for
three renderer features. _Retire the shortcodes:_ a separate decision about authoring syntax that this plan
would make by accident; flagged.

**Evidence.** Measured 2026-10-10: shortcode use outside the tree is zero; a draft page is read only when
`AYOKODING_WEB_SHOW_DRAFTS=true`, which the fe-e2e build sets, so it never reaches the public site, the sitemap,
or the search data.

**Consequences.** The fixture shows as a child of Learn in the e2e build only, so the sidebar scenario asserts
relative order, not an exact list.

**Revisit when** a course starts using the shortcodes (the fixture can then shrink), or the user retires them.

## D12: Governance text is edited, not rewritten; no new rule

**Context.** Six rule-bearing surfaces describe the legacy tree ([005](./005-rules-and-docs-impact.md#rule-changes)).

**Decision.** Apply the six edits RC1 to RC6 exactly as written there, through the rules-propagation route
and the Rules Quality Gate. Rescope the FP-variant convention (do not delete it), remove four dead references,
retarget the separation gate's fourth question to the as-merged course shape. Create no new rule.

**Rejected.** _Delete the FP-variant convention:_ it binds nothing today but states how the first F#-and-Clojure
page must look; keeping or dropping a convention is the user's call (flagged). _Copy the new course file list
into the gate and skill:_ it would drift the next time the shape changes. _Add a rule that no public URL is ever
removed without a redirect:_ a policy for the user, not a by-product ([005](./005-rules-and-docs-impact.md#rule-candidates-considered-and-not-created)).

**Evidence.** Re-sweep 2026-10-10: only these surfaces name the tree; the gate's fourth question would fail every
table row after the repoint.

**Consequences.** Every edit shortens or equals the original text, so no word budget is at risk.

**Revisit when** plan 06 or another plan reshapes the same sentences first (Phase 0 re-reads them).

## D13: The terminal gate runs last, blocks archival, has no waiver, and reports earlier plans' defects

**Context.** Series decision 40 requires a gate that blocks archival if the end state is not met.

**Decision.** The gate is Phase 10 of this plan, after the pull request is green and knowledge capture is done,
and before archival. 17 checks, all must pass. A failure in this plan's own work is fixed here (at most 2
cycles); a failure in a course, path, or harness belongs to an earlier plan and is reported to the user as
`BLOCKED`, not fixed here. There is no waiver other than plan 11's `DEFERRED_BY_USER` list.

**Rejected.** _Run the gate first (Phase 0) only:_ it would measure a tree this plan then changes. _Fix earlier
plans' defects inside this pull request:_ it turns the removal pull request into an unreviewable catch-all, and
courses are not this plan's to rewrite. _A softer verdict (`PASS_WITH_FINDINGS`):_ decision 40 is a hard
end state; a soft pass is a waiver by another name.

**Evidence.** [006](./006-series-completion-gate.md). Plans 11 to 13 did not exist when this plan was written, so
Phase 0 runs a readiness probe on the fast checks and stops early if the series is incomplete.

**Consequences.** A late failure can cost a long wait (the full example run takes hours). The readiness probe
moves the likely failures to the start.

**Revisit when** the user amends decision 40.

## D14: The architecture-cases-routes feature is deleted

**Context.** `architecture-cases-routes.feature` (3 scenarios) and its unit-fe steps open the pre-IA addresses of
the legacy "cases" pages and expect HTTP 200 and three legacy-only headings. It was found by the second
census, not by the bucket grep.

**Decision.** Delete the feature, its step file, and their index lines. After this plan those addresses answer
308 to a course root, which the new redirect scenarios and the inventory already prove.

**Rejected.** _Retarget it to course pages:_ the scenario's subject is routes to a section of the legacy tree;
there is no equivalent. _Keep it as a redirect assertion:_ duplicates `learn-legacy-removal.feature`.

**Evidence.** The feature's headings ("In FP — F# / Clojure / TypeScript / Haskell" and two more) occur only in
the legacy tree (text census, 2026-10-10).

**Consequences.** One feature and two READMEs lose lines. The fe-e2e project runs three scenarios fewer.

**Revisit when** never.

## D15: The search-scope scenario gets a surviving English title

**Context.** The scenario "Search is scoped to the requested locale" in `backend/search/search-api.feature`
asserts that an English search finds a page titled "Spring Security Basics". That page exists only in the legacy
tree. The same title is written into five step or mock files across four test layers.

**Decision.** Replace the title, in the feature and in all five files, with an English page title that survives:
distinctive (found by exactly one non-legacy English page), absent from the `id` content (the scenario's
point is that an Indonesian search does not return it), and stable. The executor chooses it in Phase 1 after plan 01
strips the number prefixes from course titles, and records the choice and the two checks in the phase evidence.

**Rejected.** _Choose the title now:_ course titles change in plan 01 and the audits, so a title picked at
authoring may not survive. _Keep the old title by adding a page:_ invents content to satisfy a test. _Delete the
scenario:_ the locale scoping it proves is real and worth keeping.

**Evidence.** Text census 2026-10-10: "Spring Security Basics" occurs only at
`legacy/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-security-basics.md`.

**Consequences.** One Gherkin step text changes in one feature; the four layers must agree because they share
that text.

**Revisit when** the chosen course is renamed (the search steps would then fail loudly, not silently).
