# Context Diagram: OSE Platform Web

Level 1 of the C4 model. Shows the OSE Platform Web as a single system with its external
actors. The system is a Next.js 16 content platform that serves marketing content and update
posts for the Open Sharia Enterprise project (English only).

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    VISITOR("Visitor<br/>──────────────────<br/>Browse updates<br/>Search content<br/>Read about page<br/><br/>Desktop, Tablet, Mobile"):::actor

    AUTHOR("Content Author<br/>──────────────────<br/>Write markdown<br/>Update posts<br/>English only"):::actor_author

    SYSTEM["OSE Platform Web<br/>──────────────────────<br/>Next.js 16 Content Platform<br/><br/>Marketing site<br/>Update posts<br/>Full-text search<br/>RSS feed<br/>English only<br/>ISR caching"]:::system

    CLI("oseplatform-cli<br/>──────────────────<br/>Content link validation<br/>Internal link checks<br/>Part of test:quick"):::ci

    CI("CI Pipeline<br/>──────────────────<br/>Main CI: test:quick<br/>BE E2E: Playwright<br/>FE E2E: Playwright"):::ci

    VERCEL("Vercel Platform<br/>──────────────────<br/>CDN + Edge Network<br/>ISR revalidation<br/>Standalone deployment"):::infra

    GA4("Google Analytics<br/>──────────────────<br/>GA4 via @next/third-parties<br/>Page views + events"):::external

    VISITOR -->|"browse and search"| SYSTEM
    AUTHOR -->|"write markdown content"| SYSTEM
    CLI -->|"validate links"| SYSTEM
    CI -->|"typecheck, lint, test"| SYSTEM
    SYSTEM -->|"deploy + serve"| VERCEL
    SYSTEM -->|"send analytics events"| GA4

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_author fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef system fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:3px
    classDef ci fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef infra fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef external fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

## Actors

| Actor            | Role                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Visitor          | Browses updates, searches content, reads about page                      |
| Content Author   | Creates markdown content with YAML frontmatter in `content/` directory   |
| oseplatform-cli  | Validates internal links in content files (runs as part of `test:quick`) |
| CI Pipeline      | Runs typecheck, lint, unit tests, BE/FE E2E tests via Playwright         |
| Vercel           | Hosts the production deployment with ISR and CDN edge caching            |
| Google Analytics | Collects page view and event data via GA4 (`@next/third-parties`)        |

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [oseplatform-web specs](../README.md)
