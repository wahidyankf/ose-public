# AyoKoding Go Web Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: These Gherkin scenarios describe the rewrite's observable
> behavior. Gherkin expresses an initial situation, one action, and its expected result so the
> same contract can guide unit, integration, and browser tests.

## Status and interpretation

All scenarios are **bound**. A scenario is evidence of an implemented test only through its
adapters. Each domain below requires Unit proof, applicable Integration proof, and Playwright E2E
proof. Browser-only progress uses the JavaScript/TypeScript Unit adapter and a documented
Integration exemption. The godog scope covers the whole corpus before static verification.

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
