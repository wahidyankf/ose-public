# AyoKoding Go Web Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: These Gherkin scenarios describe the rewrite's observable
> behavior. Gherkin expresses an initial situation, one action, and its expected result so the
> same contract can guide unit, integration, and browser tests.

## Status and interpretation

All scenarios are **bound**. A scenario is evidence of an implemented test only through its
adapters. Each domain below requires Unit proof, applicable Integration proof, and Playwright E2E
proof. Browser-only progress uses the JavaScript/TypeScript Unit adapter and the Playwright home,
which binds it at integration and e2e level. The unit godog scope covers the whole corpus.

Two Playwright homes bind the corpus at E2E level, partitioned by feature file. The HTTP home,
`ayokoding-web-be-e2e`, binds the nine HTTP-only feature files, and the browser home,
`ayokoding-web-fe-e2e`, binds every other feature file.

The plan carries the full source-scenario parity inventory. These domains supplement rather than
silently reduce the existing [`www` behavior corpus](../../www/behaviours/README.md).

## Domains

- [Local development](./local-development/README.md) — separate ports, read-only shared sources,
  and independent local operation.
- [Shell](./shell/README.md) — bilingual layout, themes, keyboard access, and responsive behavior.
- [Content](./content/README.md) — Markdown, frontmatter, links, embeds, math, diagrams, and code.
- [Navigation](./navigation/README.md) — locale entries, redirects, sidebars, and lesson navigation.
- [Search](./search/README.md) — locale-scoped results, dialog behavior, and tool discovery.
- [Courses](./courses/README.md) — catalog metadata, path ordering, prerequisites, and fallback.
- [Learning progress](./learning-progress/README.md) — browser-only storage, privacy, recovery,
  reset, and cross-tab updates.
- [Tools](./tools/README.md) — benchmark and calculator results, shared data, and URL state.
- [Discovery documents](./discovery/README.md) — canonical metadata, sitemap, feed, and robots.
- [Parity tools](./parity-tools/README.md) — the old site's URL inventory and the gap report against the new app.
