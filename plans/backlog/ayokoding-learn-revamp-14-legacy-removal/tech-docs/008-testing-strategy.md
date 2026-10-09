# 008 — Testing Strategy

This page maps every behaviour of this plan to the tests that prove it, layer by layer, says which tests are
permanent and which exist only to get the work done, and says what is deliberately not tested. The scenarios
themselves are in [../prd.md](../prd.md#gherkin-acceptance-criteria); the files they bind to are listed in
[004](./004-code-spec-and-test-migration.md); the checks of the final gate are in
[006](./006-series-completion-gate.md).

## The behaviour contract applied

The repository's behaviour contract says: Gherkin first; a unit binding always; integration, fe-e2e, and
be-e2e bindings where the layer applies; static coverage in the quick run; an exemption only with the exact
comment `# Exemption(<layer>): <reason>; alternative-proof: <project:target> / <scenario title>` and the tag
`@integration-exempt` or `@e2e-exempt`.

For this plan:

- The feature files are written (or edited) **before** any step or product code of the same phase.
- A scenario that turns green only when the tree is deleted (the absence scenarios) is written and observed
  failing **first**, in Phase 5, with the tree still present, and turns green in the deletion commit. Every
  other scenario turns green in the phase that introduces it, and each phase's commit is green.
- The test that proves one property is the test that exists afterwards. Where a temporary test is needed to
  get a permanent artifact (the inventory), the artifact stays and the test goes.

## Which project runs which feature

| Project                     | Runs                                                                                                                          | Notes                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ayokoding-www` unit (node) | `tests/unit/be-steps/**/*.steps.ts` and `*.unit.test.ts`                                                                      | Binds backend features; 99% line threshold on `test:unit`                                                    |
| `ayokoding-www` unit-fe     | `tests/unit/fe-steps/**/*.steps.tsx` and component tests (jsdom)                                                              | Binds frontend features with a simulator, not a server                                                       |
| `ayokoding-www` integration | `tests/integration/{fe-steps,be-steps}`; depends on `build`                                                                   | Real content directory and real build output                                                                 |
| `ayokoding-www-fe-e2e`      | every `frontend/**/*.feature`, three browsers; `tags: "not @e2e-exempt"`                                                      | Browser steps and raw-HTTP steps                                                                             |
| `ayokoding-www-be-e2e`      | every `backend/**/*.feature` plus the one listed frontend feature (`learn-legacy-removal.feature`); `tags: "not @e2e-exempt"` | HTTP and browser steps; no three-browser matrix. The crawl lives here because only this project runs it once |

## Scenario-to-test map: `learn-legacy-removal.feature` (frontend, 13 scenarios)

Binding files: unit-fe N6, integration N7, fe-e2e N8, be-e2e N9
([004](./004-code-spec-and-test-migration.md#new-files-n)). "Exempt" means the scenario carries
`@integration-exempt` with the fe-e2e project as its alternative proof.

| #   | Scenario                                                                | Unit-fe (N6) proves                                                                      | Integration (N7)                  | fe-e2e (N8) and be-e2e (N9) prove                                      | Phase |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------- | ----- |
| 1   | The learn section has only the paths and courses buckets                | `structuralBuckets` over mock entries returns `["courses","paths"]`                      | real `content/en/learn` directory | the same read against the real directory                               | 5     |
| 2   | A legacy topic URL redirects permanently to its course                  | `permanent: true`, so status 308; `Location` equals the course URL                       | exempt                            | raw GET with redirects disabled: status 308 and the `Location` header  | 2     |
| 3   | A deep legacy page, at either address, redirects to its course root     | the same for a deep page at both prefixes; destination has no sub-path                   | exempt                            | the same over HTTP                                                     | 2     |
| 4   | A legacy URL with no course equivalent redirects to the catalog         | obsolete folder, obsolete file, navigation page, bucket root, unmatched URL              | exempt                            | the same over HTTP                                                     | 2     |
| 5   | A pre-IA domain URL redirects permanently to the catalog                | six domains, one hop each                                                                | exempt                            | six requests, first hop 308 to the catalog                             | 2     |
| 6   | A stale /c-bookmarked legacy domain URL reaches the catalog in two hops | six domains, exactly two hops, healthy                                                   | exempt                            | browser navigation ends on the catalog; the final status is below 400  | 2     |
| 7   | A historical learn-reorg source reaches the catalog in two hops         | `human/overview`, two hops, healthy                                                      | exempt                            | browser navigation ends on the catalog                                 | 2     |
| 8   | A live course URL is not rewritten                                      | zero hops                                                                                | exempt                            | the browser stays on the course URL                                    | 2     |
| 9   | A live paths URL is not rewritten                                       | zero hops                                                                                | exempt                            | the browser stays on the paths URL                                     | 2     |
| 10  | A re-homed fundamentally-strong course URL still reaches its course     | one hop to `/en/learn/courses/just-enough-python`                                        | exempt                            | the browser ends on the course                                         | 2     |
| 11  | A redirected legacy URL ends on a live page                             | (the simulator ends on a terminal destination)                                           | exempt                            | navigation ends on the destination and a GET of that page is below 400 | 2     |
| 12  | The Learn home links to no legacy address                               | the Learn home component renders no link containing `/learn/legacy` and no "Legacy" text | exempt                            | the rendered page has no `a[href*="/learn/legacy"]`                    | 5     |
| 13  | The Indonesian locale gets no legacy redirect                           | no rule matches `/id/learn/legacy/...`                                                   | exempt                            | the raw GET is not a redirect (it is a 404)                            | 2     |

Phase 2 holds scenarios 2 to 11 and 13: they pass as soon as the rule table replaces the old module, with
the legacy tree still on disk (the redirect is checked before any file). Scenarios 1 and 12 are the two
that need the tree gone; they are added in Phase 5, observed failing first, then pass in the deletion commit.

## Scenario-to-test map: `legacy-url-redirect-inventory.feature` (backend, 3 scenarios)

| #   | Scenario                                                              | Unit (N12)                                                                                                                                                                | Integration (N13)                                                                            | be-e2e (N14)                                                           |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Every inventoried legacy URL redirects permanently to its destination | 1,150 legacy URLs and 1,148 pre-IA twins follow `redirectRules` for exactly one hop to the fixture's destination; the 2 root files are not captured at the pre-IA address | exempt; alternative proof: be-e2e crawl                                                      | 2,298 requests with `maxRedirects: 0`: status 308 and `Location` equal |
| 2   | Every redirect destination is a live page                             | each destination is terminal (zero hops) and each course destination is an existing course directory                                                                      | exempt; alternative proof: be-e2e crawl                                                      | each of the 75 distinct destinations answers 200                       |
| 3   | The compiled redirect rules equal the table                           | the rule array has the formula's count and every rule is `permanent: true`                                                                                                | the build's routes manifest holds the same number of non-internal redirects, each status 308 | `@e2e-exempt`; alternative proof: the integration binding              |

The unit binding for scenarios 1 and 3 reads the fixture and the rule array and **does not need the
legacy tree**, which is why it survives the deletion. Scenario 3 exists because the unit simulator proves the
list, while the framework could still compile it differently (a source pattern that parses differently,
a rule dropped). The compiled manifest is the framework's own record of what it will serve. Phase 2 reads one
real manifest from a local build before writing the step, to confirm its shape and how internal redirects are
marked.

## Tests that are not Gherkin-bound

These are structural unit tests. They carry no behaviour a reader sees, so they have no scenario; the
behaviour is in the scenarios above.

| File (N-id)                                                          | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/redirects/legacy-removal.unit.test.ts` (N1)              | The builder: a file row yields one rule and a folder row yields an exact rule then a wildcard rule; destinations carry no `:path*`; every rule is permanent; the count equals the formula; fallback pairs come last in each group; no source shadows `courses`, `paths`, `fundamentally-strong`, `/en/learn`, `/en/learn/overview`, or `/id`; no source or destination contains `/c/`; the hop table of [002](./002-redirect-mechanism-and-url-inventory.md#hop-budget) and its 14 edge cases |
| `tests/unit/redirects/helpers/follow-redirects.unit.test.ts` (N2)    | `applyOne` and `followRedirects`: the first test written is the failing case (a wildcard source with a static destination returns the destination whole); a loop returns unhealthy; the eight-hop limit is enforced                                                                                                                                                                                                                                                                           |
| `tests/unit/app/[locale]/(content)/[...slug]/page.unit.test.ts` (T6) | After the edit: a non-legacy slug is not `noindex`. The deleted test's subject no longer exists                                                                                                                                                                                                                                                                                                                                                                                               |
| `tests/unit/app/sitemap.unit.test.ts` (T16)                          | A content map with no legacy entry emits no `/learn/legacy` URL (documents the contract)                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tests/unit/app/robots.unit.test.ts` (T16)                           | `robots()` allows `/` and no rule disallows `/en/learn`, so crawlers can read the 308s                                                                                                                                                                                                                                                                                                                                                                                                        |
| the Learn-home component test (A8, plan 04's file)                   | No legacy line and no link to `learn/legacy`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Temporary tests (created, used, and removed inside this pull request)

| Test (N-id)                                                 | Purpose                                                                                                                                         | Lifecycle                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy-removal-parity.unit.test.ts` (N4)                   | Table equals mapping equals tree; writes the inventory fixture N3 with `toMatchFileSnapshot` the first time (`-u`), then compares byte for byte | RED before the table is complete, GREEN with it; run in Phase 2 and again in Phase 5 before the deletion; deleted in the deletion commit                                                                              |
| `docs-repoint.unit.test.ts` and `docs-repoint-map.tsv` (N5) | Per file: no legacy link; the set of linked course slugs equals the frozen map; no fragment; every target exists on disk                        | RED observed in the working tree with all 16 groups active (all 94 files fail); committed with an empty `ACTIVE_GROUPS` so the commit is green, and each batch commit adds its groups; deleted in the deletion commit |

The parity test is the proof that the table is right. The permanent tests then keep the table right.

## RED, GREEN, REFACTOR by phase

| Phase | RED observed (command, expected failure)                                                                                                                                                               | GREEN                                                                          | REFACTOR                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1     | Scenario step edits first: the fixture does not exist, so the rendering scenarios fail on a missing page; the new search title is absent                                                               | the fixture page exists; steps rebound; all suites green with the tree present | none beyond naming                                                 |
| 2     | N2: the wildcard-with-static-destination case; N1 and N4: no table; S2 and S10: no module                                                                                                              | module, aggregator, fixture, config                                            | the aggregator replaces the two copies of the module list          |
| 3     | N5 with `ACTIVE_GROUPS` set to all 16 groups in the working tree: 94 files fail (then reset to empty and committed green)                                                                              | Batch A, B, C, each adding its groups to `ACTIVE_GROUPS`                       | merge duplicate bullets only where the repoint made them identical |
| 4     | none for text; the RC2 two-way link-validator proof waits for Phase 5, because a re-added legacy link is dead only after the deletion                                                                  | rule edits and propagation                                                     | none                                                               |
| 5     | scenarios 1 and 12 and the flipped sitemap and sidebar assertions fail with the tree present; after the deletion the RC2 re-add of one legacy link fails the link validator, then passes once restored | the deletion commit                                                            | remove temporary tests                                             |

Every RED is run and its output is saved to the phase evidence file **before** the code that fixes it is
written. A test that is green on first run is a characterization test and says so (N11 is the only one in this
plan, with a scratch edit as its failing proof).

## Shared step phrases

Existing phrases reused without change:
`the app is running`, `a visitor navigates to {string}`, `the current URL should contain {string}`,
`the current URL should not contain {string}`, `the response status should not be a client or server error`,
`a raw HTTP GET is made to {string} with redirects disabled`, `the response status should be {int}`,
`the response Location header should equal {string}`,
`the content tree under the en learn section is inspected`,
`no former subject domain remains as a direct child of the learn section`.

New or reworded phrases (each bound in every layer that runs the scenario):

| Phrase                                                         | Used by      | Meaning                                                 |
| -------------------------------------------------------------- | ------------ | ------------------------------------------------------- |
| `its only structural buckets are paths and courses`            | S2 #1        | the sorted directory names equal `["courses", "paths"]` |
| `the response status should not be a redirect`                 | S2 #13       | status is not 3xx                                       |
| `the page has no link to an address containing {string}`       | S2 #12       | no anchor whose `href` contains the text                |
| phrases of S10 (`the legacy URL inventory is read`, and so on) | S10 #1 to #3 | defined with the feature in Phase 2                     |

Because `@amiceli/vitest-cucumber` matches steps by their exact text and scenarios by their title, a scenario
or step that is renamed in a feature file must be renamed in **every** binding in the same commit; the static
coverage check (`test:coverage`) fails the quick run if one layer is left behind.

## Edited existing scenarios

| Feature (spec id)                        | Scenario                                      | Edit                                                                                                                       | Bound in                                                      |
| ---------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `ia-navigation-revamp.feature` (S3)      | bare URL, breadcrumb segments, canonical link | legacy URLs become real course URLs (Phase 0 confirms they answer 200)                                                     | unit-fe, integration, fe-e2e                                  |
| `ia-navigation-revamp.feature` (S3)      | the sitemap scenario                          | "contains a legacy URL" becomes "contains no legacy URL" (Phase 5, with the deletion)                                      | unit-fe, integration, fe-e2e                                  |
| `learn-reorg-redirects.feature` (S4)     | platform-web                                  | retitled; ends at the catalog in two hops                                                                                  | unit-fe, fe-e2e                                               |
| `navigation.feature` (S5)                | the Learn sidebar order                       | Phase 1: relative order tolerant of the fixture; Phase 5: "Paths and Courses in that order and no Legacy entry"            | plan 04's bindings (unit-fe and fe-e2e; Phase 0 locates them) |
| `search-api.feature` (S7)                | Search is scoped to the requested locale      | surviving English title ([D15](./007-decision-records.md#d15-the-search-scope-scenario-gets-a-surviving-english-title))    | unit, integration, be-e2e, fe-e2e (5 files)                   |
| `architecture-cases-routes.feature` (S6) | all 3                                         | deleted with the unit-fe step file ([D14](./007-decision-records.md#d14-the-architecture-cases-routes-feature-is-deleted)) | unit-fe, fe-e2e                                               |

## Quick and full runs

| Run                                     | Contains                                                                                                              | When in this plan                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `UNIT-NODE <file>` and `UNIT-FE <file>` | one file                                                                                                              | inner loop, every RED and GREEN                  |
| `QUICK`                                 | typecheck, lint, `test:unit` (99% line threshold), `test:coverage` (every scenario bound once per non-exempt adapter) | end of every phase                               |
| `E2E-ONE`, `BE-E2E-ONE` (one feature)   | one feature file of the e2e projects, for the rebinds and the new features                                            | Phases 1, 2, and 5 (every RED and GREEN)         |
| `E2E-QUICK`, `BE-E2E-QUICK`             | the quick subsets of the two e2e projects                                                                             | end of Phases 0, 1, 2, 5                         |
| `INTEGRATION`                           | the integration project (builds first), including scenario 3 of S10                                                   | Phases 0, 1, 2, 5, 6, 7, 8, and the gate         |
| `E2E`, `BE-E2E`                         | the full e2e projects, `BE-E2E` including the 2,298-request crawl                                                     | Phases 0, 2 (BE-E2E only), 6, 7, 8, and the gate |

The 99% line threshold is not at risk from the deletions: removing `isLegacySlug` removes the lines and their
test together, and the new redirect code is exercised by N1 and N12 line for line.

## What is deliberately not tested

- **Search engine behaviour.** Whether a crawler drops or keeps a 308'd URL is outside the repository. The
  tests prove the 308, the `Location`, and that `robots.txt` lets crawlers read it.
- **Client caching of a 308.** Browsers cache a permanent redirect; no test can control that. The rollback
  note in [010](./010-pr-size-rollback-and-series-closure.md#rollback) says what it means.
- **The wording of any course.** Content quality belongs to plans 06 to 13 and is only re-run by the gate.
- **Visual layout of the Learn home and sidebar.** Covered by manual verification on port 3101 in Phase 7, not by
  a pixel test.
- **Every deep legacy page individually.** The mapping works by topic, so a page-level check would test the
  wildcard 1,150 times; the crawl tests every URL against its row's destination, which is the same property.

## Manual verification list (port 3101)

Done with the Playwright MCP browser against `DEV` and again against the `START` production build
([../delivery.md](../delivery.md#phase-7-manual-verification-and-tester-gates)):

1. Open 5 legacy URLs (E1, E2, E4, E6, E8 of [002](./002-redirect-mechanism-and-url-inventory.md#http-checks-on-a-real-server)); each lands on the expected page with
   no console error.
2. `/en/learn`: no Legacy line, no legacy link; the sidebar lists Paths and Courses only (the fixture page also
   appears last in the e2e build, never in the public one).
3. `/en/learn/courses`: the catalog still shows 229 courses.
4. One course page for each of the 12 docs destination courses.
5. `/en/browse`: no legacy link.
6. `/id` and one `id` content page render unchanged.
7. At 375, 768, and 1280 px for items 1 to 3.
