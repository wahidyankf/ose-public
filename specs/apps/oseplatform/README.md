# OSE Platform Web Specs

Specifications for the oseplatform-web Next.js application — the OSE Platform marketing and
updates site. The specs cover content retrieval, search, RSS feed, health, SEO, and
frontend UI behaviour.

## Structure

```
specs/apps/oseplatform/
├── README.md              # This file
├── be/                    # Backend specs (HTTP-semantic)
│   └── gherkin/           # Backend Gherkin scenarios
│       ├── content-retrieval/
│       │   └── content-retrieval.feature
│       ├── search/
│       │   └── search.feature
│       ├── rss-feed/
│       │   └── rss-feed.feature
│       ├── health/
│       │   └── health.feature
│       └── seo/
│           └── seo.feature
└── fe/                    # Frontend specs (UI-semantic)
    └── gherkin/           # Frontend Gherkin scenarios
        ├── landing-page.feature
        ├── navigation.feature
        ├── theme.feature
        └── responsive.feature
```

## Backend vs Frontend

| Aspect      | Backend (be/)                               | Frontend (fe/)                    |
| ----------- | ------------------------------------------- | --------------------------------- |
| Perspective | HTTP-semantic (service calls, status codes) | UI-semantic (clicks, types, sees) |
| Background  | `Given the API is running`                  | `Given the app is running`        |
| Transport   | tRPC / Route Handlers over HTTP             | Browser interactions              |
| Domains     | 5 domains                                   | 4 domains                         |

## Backend Domains

| Domain            | File                                          | Description                                  |
| ----------------- | --------------------------------------------- | -------------------------------------------- |
| content-retrieval | `content-retrieval/content-retrieval.feature` | Page retrieval by slug, update post listings |
| search            | `search/search.feature`                       | Full-text search across all content          |
| rss-feed          | `rss-feed/rss-feed.feature`                   | RSS 2.0 feed generation for update posts     |
| health            | `health/health.feature`                       | Service liveness check                       |
| seo               | `seo/seo.feature`                             | Sitemap and robots.txt generation            |

## Frontend Domains

| Domain       | File                   | Description                                          |
| ------------ | ---------------------- | ---------------------------------------------------- |
| landing-page | `landing-page.feature` | Hero section and social icons on the home page       |
| navigation   | `navigation.feature`   | Header links, breadcrumbs, prev/next between updates |
| theme        | `theme.feature`        | Light/dark mode default and toggle behaviour         |
| responsive   | `responsive.feature`   | Mobile and desktop viewport layout                   |

## Scenario Summary

| Area      | Feature File      | Scenarios |
| --------- | ----------------- | --------- |
| Backend   | content-retrieval | 4         |
| Backend   | search            | 3         |
| Backend   | rss-feed          | 2         |
| Backend   | health            | 1         |
| Backend   | seo               | 2         |
| Frontend  | landing-page      | 2         |
| Frontend  | navigation        | 3         |
| Frontend  | theme             | 2         |
| Frontend  | responsive        | 2         |
| **Total** |                   | **21**    |

## Related

- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [BDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
- [apps/oseplatform-web/](../../../apps/oseplatform-web/README.md) — Next.js implementation
