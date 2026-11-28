# Local Development Behaviours

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: Developers can run both sites without port collisions or changes to
> the shared content. The rewrite remains independent of unfinished content plans.

## Contents

- [Local development](./local-development.feature) — ports, configuration failure, an unreadable content directory,
  shared-source safety, and independence from other plans. Bound by `ayokoding-web-fe-e2e` (browser and process
  boundary) and the Go unit and integration drivers. Bindings are implemented.
- [Local development over HTTP](./local-development-http.feature) — static assets, the favicon, an unknown asset
  returning 404, the real content corpus served by default, and the fixture served only when selected. Bound by
  `ayokoding-web-be-e2e` (the real-corpus config binds the real-corpus scenario, the fixture config the fixture one),
  and by the Go unit and integration drivers. Bindings are implemented.
