# Product Requirements

## Product and users

The new local AyoKoding website serves the same learners and maintainers as the existing site.
Readers browse lessons, follow courses or career/skills paths, search, keep progress in their
browser, and use the two existing tools. Authors continue editing the current source corpus.

## Product boundary

The new surface is `apps/ayokoding-web`; the retained surface is `apps/ayokoding-www`. Its own
Playwright project is `apps/ayokoding-web-e2e` (_new_). The new surface's canonical behavior corpus
is [specs/apps/ayokoding/web](../../../specs/apps/ayokoding/web/README.md), whose proof-ownership
wording execution updates from Phoenix to Go in the same unit that lands the app.

Full parity means the current tested product experience, not Next.js build artifacts or the old
app's internal tRPC wire format. Locale coverage means `en` and `id` with the content that actually
exists in each locale; it does not mean inventing Indonesian counterparts for English-only courses.
No design, course, data-price, or FX snapshot refresh is bundled with the rewrite.

## Acceptance criteria

| ID    | Required outcome                                                                                                                           | Canonical feature destination                                 | Proof                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Both apps run together on distinct ports; the Go developer loop reads shared sources without rewriting them.                               | `local-development/local-development.feature`                 | Unit configuration tests, local filesystem Integration, Playwright and simultaneous-server manual proof.                                          |
| AC-02 | Landing, shell, locale switching, theme, responsive navigation, and keyboard accessibility retain their behavior.                          | `shell/bilingual-shell.feature`                               | Unit, applicable handler Integration, browser E2E, both locales at each breakpoint.                                                               |
| AC-03 | Published Markdown renders with current metadata, shortcodes, math, diagrams, code copying, headings, and relative links.                  | `content/content-rendering.feature`                           | Pure parser Unit, real fixture Integration, rendered browser E2E.                                                                                 |
| AC-04 | Canonical and historical URLs, sidebar/TOC/breadcrumbs, and previous/next navigation remain correct.                                       | `navigation/routes-and-navigation.feature`                    | Unit route/tree vectors, HTTP Integration, browser/HTTP E2E.                                                                                      |
| AC-05 | Search is locale-scoped, includes static tool pages, and preserves dialog, result, empty-state, and keyboard behavior.                     | `search/search.feature`                                       | Unit query/excerpt/matching cases, handler Integration, browser E2E.                                                                              |
| AC-06 | Catalog metadata, phase order, prerequisites, outline state, path framing, and canonical fallback remain correct.                          | `courses/course-catalog-and-paths.feature`                    | Unit manifest/domain tests, real-corpus Integration, browser E2E.                                                                                 |
| AC-07 | Learning progress preserves the v1 schema, browser-only privacy, recovery, reset, cross-tab synchronization, and lesson navigation.        | `learning-progress/browser-progress.feature`                  | Browser-helper Unit plus Playwright storage/network proof; only genuinely browser-only record effects may have documented Integration exemptions. |
| AC-08 | AI benchmark filters, ranking, substitutes, dates, notes, and URL state keep existing results.                                             | `tools/ai-benchmark.feature`                                  | Shared-vector Unit in both runtimes, handler Integration, browser E2E.                                                                            |
| AC-09 | Calculator cost/savings/minimum-role modes, controls, rounding, notes, and URL state keep existing results.                                | `tools/cost-of-living-calculator.feature`                     | Shared-vector Unit in both runtimes, handler Integration, browser E2E.                                                                            |
| AC-10 | Page metadata, canonical URLs, sitemap, robots, RSS, and missing-page behavior use the current source corpus.                              | `discovery/discovery-documents.feature`                       | Unit document/URL tests, HTTP Integration and E2E.                                                                                                |
| AC-11 | godog binds the canonical Gherkin corpus with strict step matching, following the `ayokoding-cli` pattern; no step is unused or ambiguous. | `local-development/local-development.feature` (harness proof) | godog suites, behaviour-coverage static checks, repository validator regressions.                                                                 |
| AC-12 | The rewrite remains independent of all live course plans while tracking their already-merged source changes.                               | `local-development/local-development.feature`                 | Dependency/DAG inspection, shared-source diff and current-main parity ledger.                                                                     |

Feature destinations above are relative to
`specs/apps/ayokoding/web/behaviours/`. The [baseline and parity guide](./tech-docs/001-baseline-and-parity.md)
defines the complete existing-scenario mapping procedure; the initial new corpus is a real starting
contract, not permission to discard unlisted existing scenarios.

### Local coexistence and source ownership

```gherkin
Scenario: Develop the Go website beside the existing website
  Given the existing website listens on port 3101
  When the maintainer starts the Go website with its default configuration
  Then the Go website listens on port 3102
  And both websites remain reachable
  And neither website's listener is replaced

Scenario: Read shared lessons without rewriting the corpus
  Given a lesson exists in the shared Markdown corpus
  When the maintainer opens that lesson in the Go website
  Then the lesson is rendered from the shared source
  And the source bytes are unchanged
```

### Independent execution and privacy

```gherkin
Scenario: Complete the rewrite while course work remains unfinished
  Given a course plan remains unfinished
  And its unmerged output is absent from the rewrite worktree
  When the rewrite satisfies its acceptance criteria against the recorded merged corpus
  Then the unfinished course plan does not block rewrite completion

Scenario: Keep a learner's progress out of server requests
  Given a learner has a valid browser progress record
  When the learner completes a lesson and reloads the page
  Then the browser retains the updated record
  And no progress record is included in any request to the server
```

## UI reference and refactor disposition

This is a behavior- and appearance-preserving implementation rewrite. It adds no product screen,
control, layout choice, or visual redesign. The pure-refactor exemption in
[UI Mockups Scope](../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#scope)
applies: do not invent divergent product designs or manufacture alternative mockups.

The existing app is the reference for landing, content reader, catalog, path landing, Learn home,
tools index, and both tool screens. Ground the implementation in the existing `globals.css`,
shell/navigation components, tool components, and `libs/web-ui-token`; React components from
`libs/web-ui` are references, not components that can be imported into Go templates. Interactive
regions (search dialog, tool filters, progress islands) use htmx partial swaps against small
fragment endpoints, with full-page query-parameter fallbacks that work without JavaScript.

Before changing a behavior slice, capture its existing screen in `en` and `id` where the route
exists, at 375, 768, and 1280 px, in relevant light/dark modes. Preserve mobile sheets and stacked
controls, tablet reflow, desktop side rails, focus order, visible labels, and accessible contrast.
The equivalent Go capture accompanies the comparison. The reader may accept different
framework-generated DOM attributes, not missing content or changed navigation. Unexpected visible
differences are defects unless the user explicitly changes this product boundary.

## Product risks and exclusions

Different ports are different browser storage origins. The new app retains compatible keys and
schemas but does not automatically transfer progress from port 3101 to 3102, and this plan adds no
export/import UI. htmx partial swaps need a reachable server for those regions; the initial
server-rendered HTML, canonical links, and navigation remain usable from the first response.
Deployment, cutover, accounts, databases, redesigned screens, and old-app removal remain excluded.
