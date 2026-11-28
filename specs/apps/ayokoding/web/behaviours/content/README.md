# Content Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: Readers see the existing lessons rendered from the shared Markdown
> corpus, including rich formatting and interactive examples, without a Next.js runtime.

## Contents

- [Content rendering](./content-rendering.feature) — frontmatter, rich Markdown, shortcodes, links,
  code copying, math, and diagrams. Bound by `ayokoding-web-fe-e2e` (browser) and the Go unit and integration drivers.
  Bindings are implemented.
- [Content rendering over HTTP](./content-rendering-http.feature) — direct HTML reads, drafts (`@fixture`), and missing
  pages. Bound by `ayokoding-web-be-e2e`, through its real-corpus and fixture configs, and by the Go unit and integration
  drivers. Bindings are implemented.
