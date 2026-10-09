# Product Requirements — Legacy Removal

## Personas

| Persona                      | Who they are                                                                                                              | What they need from this plan                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Dewi, a returning reader** | Follows a bookmark, a search result, or a link on another site to an old AyoKoding address she found years ago.           | The old address still works: it takes her, once, to the course that now teaches the topic, or to the catalog if no course matches. |
| **A web crawler**            | Indexes AyoKoding and re-crawls addresses it knows.                                                                       | A permanent redirect (HTTP 308) with a `Location` it can follow, and a `robots.txt` that lets it read the redirect.                |
| **Bayu, a docs contributor** | Edits the style guides under `docs/explanation/software-engineering/` and follows the "learning path" prerequisite links. | Every prerequisite link opens a real page: the course that replaced the topic. The sentence around the link stays true.            |
| **Rina, a content owner**    | Maintains the course library and its tests.                                                                               | No test, spec, or rule still depends on pages that are gone, and the renderer keeps its end-to-end coverage.                       |
| **The series owner (user)**  | Decided that the series must end with real content only and that the old tree goes.                                       | One gate that proves the end state, a plan that does not delete anything until it is proven, and a clean closure.                  |
| **The release engineer**     | Merges, deploys, and watches the live site.                                                                               | A change that can be reviewed in order, checked on production, and reverted completely if needed.                                  |

## User Stories

- **US1.** As Dewi, I want an old legacy address to answer with a permanent redirect to the course for its
  topic, so that my bookmark keeps working.
- **US2.** As Dewi, I want an old address with no equivalent course to land on the course catalog, so that I
  am never left on a 404.
- **US3.** As Dewi, I want the older pre-IA address (`/en/learn/software-engineering/...`) of the same page to
  reach the same place in one step, so that even very old links work.
- **US4.** As a crawler, I want the redirect to be permanent (308) and `robots.txt` to allow `/`, so that I can
  transfer the old addresses to the new ones.
- **US5.** As Dewi, I want the Learn pages, the sidebar, the sitemap, and the search to show no legacy section,
  so that I am not offered pages that are redirects.
- **US6.** As Bayu, I want every prerequisite link in `docs/` to point to the right course, so that I do not
  hit a dead link, and the sentence around it must not promise tracks that the course does not have.
- **US7.** As Rina, I want the rendering tests (code highlighting, callouts, tabs, steps, math, Mermaid) to run
  on a stable fixture page, so that deleting the legacy pages does not delete that coverage.
- **US8.** As Rina, I want the specs, unit tests, step definitions, and both end-to-end projects to name no
  deleted page, so that they pass for the right reasons.
- **US9.** As a contributor, I want the governance text, conventions, and skills to stop describing a tree that
  no longer exists, so that I am not misled.
- **US10.** As the series owner, I want a terminal gate that measures the end state of the whole series and
  blocks archival when it is not met, so that a series that is not finished cannot report itself finished.
- **US11.** As the release engineer, I want the change reviewable commit by commit and fully revertible, so that
  a mistake costs one revert.
- **US12.** As the series owner, I want closure to verify that all 14 plans are archived and the temporary
  artifacts are cleaned, so that nothing is left behind.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                                                                                | Story     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR1  | Each of the 1,150 URLs that answered 200 under `/en/learn/legacy/` answers HTTP 308 with a `Location` equal to the destination plan 10's mapping requires: `/en/learn/courses/<first-listed-slug>` for a `Covered` or `New course` row, `/en/learn/courses` for an `Obsolete` row, a navigation page, or an unmatched URL. | US1, US2  |
| FR2  | The pre-IA twin of each of the 1,148 legacy URLs that sit under one of the six former domains answers 308 to the same destination in one hop.                                                                                                                                                                              | US3       |
| FR3  | Every sub-page of a mapped topic redirects to that topic's course root; no destination carries the sub-path.                                                                                                                                                                                                               | US1       |
| FR4  | Every destination is terminal and answers 200: the 74 course roots and the catalog.                                                                                                                                                                                                                                        | US1, US2  |
| FR5  | The chained cases (`/c/` bookmark, historical learn-reorg rename, mixed-case locale, trailing slash) reach the same destination in at most two hops.                                                                                                                                                                       | US3       |
| FR6  | No new rule captures `/en/learn/courses/**`, `/en/learn/paths/**`, `/en/learn/fundamentally-strong/**`, `/en/learn`, `/en/learn/overview`, or anything under `/id`.                                                                                                                                                        | US5       |
| FR7  | The redirect rules are a typed table proven equal to plan 10's mapping, with a frozen 1,150-line inventory that a permanent unit test and a permanent real-server crawl read, and a build-level check that the compiled rules equal the table.                                                                             | US4, US11 |
| FR8  | `apps/ayokoding-www/content/en/learn/legacy/` (1,150 files) is deleted, only after FR1 to FR7 hold and every mapped destination course exists on `origin/main`. The Learn section then has exactly two structural buckets, `courses` and `paths`.                                                                          | US5       |
| FR9  | The Learn home, the sidebar, the path rail, the browse index, the breadcrumb, the sitemap, the feed, and the search data show no legacy entry; `robots.txt` still allows `/`; `isLegacySlug` and the `noindex` branch are removed.                                                                                         | US4, US5  |
| FR10 | The 94 `docs/` files that link into the legacy tree link to the course that replaces each topic; no `docs/` file mentions `learn/legacy`; no link carries a fragment; the link validator exits 0; the software-engineering separation convention is satisfied (its gate is updated to the as-merged course shape).         | US6       |
| FR11 | The six links in the 2023 CliftonStrengths rant lose their targets and keep their text.                                                                                                                                                                                                                                    | US5       |
| FR12 | Specs, unit tests, step definitions, and both end-to-end projects are updated so that none names a deleted page; the rendering coverage moves to one draft fixture page; `paths/skills/e2e-fixture-*` stay; the search-scope scenario uses a title that survives; the architecture-cases-routes feature is deleted.        | US7, US8  |
| FR13 | Governance, convention, skill, and README text that describes the legacy tree is updated through the rules-propagation route (RC1 to RC6) and passes the Rules Quality Gate in at most 2 cycles; no new rule is created.                                                                                                   | US9       |
| FR14 | The series-completion gate (SC-01 to SC-17) passes before the plan archives itself; on failure nothing is archived or merged.                                                                                                                                                                                              | US10      |
| FR15 | After the merge, the deploy, and a live check, closure verifies plans 01 to 14 are archived with README entries and cleans the temporary artifacts; no new plan is created.                                                                                                                                                | US12      |
| FR16 | `apps/ayokoding-www/content/id/**` is not changed.                                                                                                                                                                                                                                                                         | US5       |

## Non-Functional Requirements

- **Correctness over speed.** A redirect that lands on the wrong page is worse than one that lands on a course
  root. Destinations come from the mapping, proven by two independent derivations.
- **Reversibility.** The change reverts completely with one revert, restoring content and removing the redirects
  ([tech-docs/010](./tech-docs/010-pr-size-rollback-and-series-closure.md#rollback)). A browser may keep a cached 308
  after a revert; this is stated, not hidden.
- **Platform fit.** The final redirect array has about 493 rules against a 1,024 limit; execution stops if the
  total would exceed 800.
- **Search friendliness.** 308 is used (permanent, method-preserving); `robots.txt` keeps `Allow: /`; the sitemap
  lists only live addresses.
- **Accessibility and responsive layout.** No new interface. The removed Learn-home line and sidebar entry must
  not leave a gap or a focus trap; verified in the browser at 375, 768, and 1280 px.
- **Determinism.** No ad-hoc script: counts and checks come from the repository's commands and tests, and
  deterministic tooling stays in `apps/ayokoding-cli` (series decision 37). Tests use no sleeps, retries, or
  loosened assertions.
- **Resource use.** All local compute runs through HIPPO with a stated class and tier; no two heavy runs overlap.
- **Security and privacy.** No secret enters the repository; evidence files hold repository-relative paths only;
  every push passes the push leak review.
- **Language.** English only; `content/id/**` untouched.
- **Quality-gate cap.** Every maker-checker loop and every quality gate runs at most 2 cycles.

## Gherkin Acceptance Criteria

How each scenario binds to tests, layer by layer, is in
[tech-docs/008](./tech-docs/008-testing-strategy.md#scenario-to-test-map-learn-legacy-removalfeature-frontend-13-scenarios).
The redirect examples below use rows of the mapping as measured on 2026-10-09; Phase 2 takes the final example
values from the inventory fixture, so a renamed course changes the example and the fixture together.

### New: `frontend/navigation/learn-legacy-removal.feature`

```gherkin
Feature: Removed learn addresses redirect to the courses that replaced them

  As a reader who follows an old AyoKoding learn link
  I want the old address to take me to the course that now teaches the topic
  So that bookmarks, search results, and links on other sites keep working

  Background:
    Given the app is running

  Scenario: The learn section has only the paths and courses buckets
    When the content tree under the en learn section is inspected
    Then its only structural buckets are paths and courses
    And no former subject domain remains as a direct child of the learn section

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A legacy topic URL redirects permanently to its course
  @integration-exempt
  Scenario Outline: A legacy topic URL redirects permanently to its course
    When a raw HTTP GET is made to "<legacy-url>" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "<course-url>"

    Examples:
      | legacy-url                                                       | course-url                                  |
      | /en/learn/legacy/artificial-intelligence/tools/claude-code       | /en/learn/courses/claude-code-for-engineers |
      | /en/learn/legacy/business/accounting                             | /en/learn/courses/accounting-foundations    |
      | /en/learn/legacy/software-engineering/programming-languages/rust | /en/learn/courses/rust-in-depth             |

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A deep legacy page, at either address, redirects to its course root
  @integration-exempt
  Scenario Outline: A deep legacy page, at either address, redirects to its course root
    When a raw HTTP GET is made to "<deep-url>" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/en/learn/courses/rust-in-depth"

    Examples:
      | deep-url                                                                              |
      | /en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner  |
      | /en/learn/software-engineering/programming-languages/rust/by-example/beginner         |

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A legacy URL with no course equivalent redirects to the catalog
  @integration-exempt
  Scenario Outline: A legacy URL with no course equivalent redirects to the catalog
    When a raw HTTP GET is made to "<legacy-url>" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/en/learn/courses"

    Examples:
      | legacy-url                                                            |
      | /en/learn/legacy/personal-development/tools/cliftonstrengths/overview |
      | /en/learn/legacy/business/overview                                    |
      | /en/learn/legacy/software-engineering/overview                         |
      | /en/learn/legacy                                                       |
      | /en/learn/legacy/does-not-exist-anywhere                               |

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A pre-IA domain URL redirects permanently to the catalog
  @integration-exempt
  Scenario Outline: A pre-IA domain URL redirects permanently to the catalog
    When a raw HTTP GET is made to "/en/learn/<domain>/overview" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/en/learn/courses"

    Examples:
      | domain                  |
      | software-engineering    |
      | artificial-intelligence |
      | information-security    |
      | personal-development    |
      | it-governance           |
      | business                |

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A stale /c-bookmarked legacy domain URL reaches the catalog in two hops
  @integration-exempt
  Scenario Outline: A stale /c-bookmarked legacy domain URL reaches the catalog in two hops
    When a visitor navigates to "/en/c/learn/<domain>/overview"
    Then the current URL should contain "/en/learn/courses"
    And the response status should not be a client or server error

    Examples:
      | domain                  |
      | software-engineering    |
      | artificial-intelligence |
      | information-security    |
      | personal-development    |
      | it-governance           |
      | business                |

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A historical learn-reorg source reaches the catalog in two hops
  @integration-exempt
  Scenario: A historical learn-reorg source reaches the catalog in two hops
    When a visitor navigates to "/en/learn/human/overview"
    Then the current URL should contain "/en/learn/courses"
    And the response status should not be a client or server error

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A live course URL is not rewritten
  @integration-exempt
  Scenario: A live course URL is not rewritten
    When a visitor navigates to "/en/learn/courses/just-enough-nvim"
    Then the current URL should not contain "/legacy/"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A live paths URL is not rewritten
  @integration-exempt
  Scenario: A live paths URL is not rewritten
    When a visitor navigates to "/en/learn/paths/careers"
    Then the current URL should not contain "/legacy/"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A re-homed fundamentally-strong course URL still reaches its course
  @integration-exempt
  Scenario: A re-homed fundamentally-strong course URL still reaches its course
    When a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"
    Then the current URL should contain "/en/learn/courses/just-enough-python"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A redirected legacy URL ends on a live page
  @integration-exempt
  Scenario Outline: A redirected legacy URL ends on a live page
    When a visitor navigates to "<legacy-url>"
    Then the current URL should contain "<final-path>"
    And the response status should not be a client or server error

    Examples:
      | legacy-url                                                                           | final-path                                  |
      | /en/learn/legacy/artificial-intelligence/tools/claude-code                           | /en/learn/courses/claude-code-for-engineers |
      | /en/learn/legacy/software-engineering/programming-languages/rust/by-example/advanced | /en/learn/courses/rust-in-depth             |
      | /en/learn/legacy/personal-development/tools/cliftonstrengths/overview                | /en/learn/courses                           |
      | /en/learn/legacy                                                                     | /en/learn/courses                           |

  # Exemption(integration): the scenario is observable at the public browser boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Learn home links to no legacy address
  @integration-exempt
  Scenario: The Learn home links to no legacy address
    When a visitor navigates to "/en/learn"
    Then the page has no link to an address containing "/learn/legacy"

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Indonesian locale gets no legacy redirect
  @integration-exempt
  Scenario: The Indonesian locale gets no legacy redirect
    When a raw HTTP GET is made to "/id/learn/legacy/business/accounting" with redirects disabled
    Then the response status should not be a redirect
```

### New: `backend/content/legacy-url-redirect-inventory.feature`

```gherkin
Feature: Every removed legacy URL has a permanent redirect

  As the site owner
  I want a frozen list of every removed legacy address and the page it must reach
  So that the guarantee outlives the deleted pages and can be checked on any server

  Background:
    Given the legacy URL inventory is loaded

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-be-e2e:test:e2e / Every inventoried legacy URL redirects permanently to its destination
  @integration-exempt
  Scenario: Every inventoried legacy URL redirects permanently to its destination
    When each inventoried legacy URL is requested with redirects disabled
    Then each answers with status 308
    And each Location header equals the destination the inventory records
    And each pre-IA twin of an inventoried URL answers the same way

  # Exemption(integration): the scenario is observable at the public HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-be-e2e:test:e2e / Every redirect destination is a live page
  @integration-exempt
  Scenario: Every redirect destination is a live page
    When each distinct destination in the inventory is requested
    Then each is the catalog or an existing course root
    And each answers with status 200

  # Exemption(e2e): the compiled rule list is a build artifact that a running server does not expose; alternative-proof: ayokoding-www:test:integration / The compiled redirect rules equal the table
  @e2e-exempt
  Scenario: The compiled redirect rules equal the table
    When the redirect rules are compiled
    Then every legacy-removal rule is a permanent redirect with status 308
    And the number of compiled legacy-removal rules equals the number the table produces
```

### Edited and deleted features

| Feature                                                         | Change                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/navigation/learn-three-bucket.feature`                | **Deleted**; its scenarios are carried to `learn-legacy-removal.feature` ([tech-docs/004](./tech-docs/004-code-spec-and-test-migration.md#specifications-specsappsayokodingwwwbehavioursfrontendnavigation)) |
| `frontend/navigation/architecture-cases-routes.feature`         | **Deleted** (3 scenarios whose subject was routes into the legacy tree)                                                                                                                                      |
| `backend/content/legacy-mapping-completeness.feature` (plan 10) | **Deleted** with its tree-walking step file; the inventory scenarios carry the property                                                                                                                      |
| `frontend/navigation/ia-navigation-revamp.feature`              | Three scenarios swap a legacy URL for a real course URL; the sitemap scenario flips from "contains a legacy URL" to "contains no legacy URL"                                                                 |
| `frontend/navigation/learn-reorg-redirects.feature`             | The platform-web scenario is retitled and ends at `/en/learn/courses` in two hops                                                                                                                            |
| `frontend/navigation/navigation.feature` (plan 04's scenario)   | "The Learn sidebar lists Paths, Courses, and Legacy in that order" becomes "The Learn sidebar lists Paths and Courses in that order and no Legacy entry"                                                     |
| `backend/search/search-api.feature`                             | The scoped-search scenario's title changes from "Spring Security Basics" to a surviving English title chosen in Phase 1                                                                                      |
| `backend/content/course-filler-guard.feature` (plan 09)         | One scenario added: "The filler baseline is empty" (plan 09's own documented hook for this plan)                                                                                                             |

## UI Design Funnel

**Not required.** This plan adds no screen, component, route, or interaction. It removes the Legacy entry from the
sidebar and the Legacy line from the Learn home, and it adds HTTP redirects, which are not a screen. The surface
gates still bind: the plan runs manual browser verification on port 3101 at 375, 768, and 1280 px
([delivery.md](./delivery.md#phase-7-manual-verification-and-tester-gates)), the UI Web Quality Gate, and the
rule-15 tester retest, each with at most 2 cycles. The rule-16 API retest and the API gate are recorded as not
applicable, because no tRPC procedure or payload shape changes.

## Copy Changes

| Place                                             | Before                                                                           | After                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Learn home (plan 04)                              | a line "Looking for older material? Legacy"                                      | removed, with its message key in both dictionaries                                                                      |
| Learn sidebar                                     | Paths, Courses, Legacy                                                           | Paths, Courses                                                                                                          |
| `content/en/learn/_index.md` (generated)          | a Legacy entry with six children                                                 | regenerated without them                                                                                                |
| The 2023 CliftonStrengths rant                    | six words linked to pre-IA pages                                                 | the same six words, unlinked                                                                                            |
| 94 `docs/` files                                  | link text such as "Rust By Example" and sentences that promise by-example tracks | the course title as link text; sentences changed only as far as the claim about the old tracks would otherwise be false |
| FP-variant convention scope (RC1)                 | files under four folders of the legacy tree                                      | any FP-variant by-example page under `learn/`; four dead references removed (RC2)                                       |
| Separation gate question 4 and skill item 4 (RC6) | "its `by-example/` and `in-the-field/` tracks included"                          | "a complete course in the shape the content skill defines, not an outline"                                              |
| Syllabus template lineage example (RC5)           | "a prior narrative in `legacy/<path>`"                                           | "an earlier narrative (cite its path and the commit that last held it)"                                                 |
