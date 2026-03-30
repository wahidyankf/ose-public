# Component Diagram: tRPC API (Backend)

Level 3 of the C4 model. Shows the logical components inside the Next.js server-side runtime:
tRPC router, procedures, route handlers, content services, search index, and markdown pipeline.

All tRPC procedures are public (no authentication). The content pipeline reads markdown files,
parses frontmatter, renders HTML with syntax highlighting, and builds a FlexSearch index.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    CLIENT("Next.js Client<br/>or Playwright"):::actor

    subgraph SERVER["Next.js Server (tRPC API + Route Handlers)"]

        subgraph LAYER1["tRPC Router"]
            ROUTER["App Router<br/>────────────────<br/>/api/trpc/[trpc]<br/>Route Handler"]:::handler
        end

        subgraph LAYER2["tRPC Procedures"]
            CP["content.getBySlug<br/>────────────────<br/>Fetch page by slug<br/>Returns HTML + meta"]:::procedure
            CU["content.listUpdates<br/>────────────────<br/>All updates<br/>Sorted by date desc"]:::procedure
            SQ["search.query<br/>────────────────<br/>Full-text search<br/>Title + body"]:::procedure
            MH["meta.health<br/>────────────────<br/>Liveness check"]:::procedure
        end

        subgraph LAYER2B["Route Handlers"]
            RSS["RSS Feed<br/>────────────────<br/>/feed.xml<br/>RSS 2.0 XML"]:::handler
            SITEMAP["Sitemap<br/>────────────────<br/>/sitemap.xml<br/>All public URLs"]:::handler
            ROBOTS["Robots<br/>────────────────<br/>/robots.txt<br/>Crawl directives"]:::handler
        end

        subgraph LAYER3["Content Services"]
            CS["ContentService<br/>────────────────<br/>readAllContent()<br/>In-memory cache<br/>All metadata"]:::service
            CR["ContentReader<br/>────────────────<br/>readFileContent()<br/>gray-matter parse<br/>Frontmatter + body"]:::service
            MP["MarkdownParser<br/>────────────────<br/>unified pipeline<br/>remark → rehype<br/>shiki highlighting<br/>Heading extraction"]:::service
        end

        subgraph LAYER4["Search"]
            SI["SearchIndex<br/>────────────────<br/>FlexSearch<br/>Title + stripped body"]:::search
            SM["stripMarkdown()<br/>────────────────<br/>Remove formatting<br/>Plain text output"]:::service
        end

        subgraph LAYER5["Schemas"]
            FS["Frontmatter Schema<br/>────────────────<br/>Zod validation<br/>title, date, summary<br/>tags, draft"]:::schema
            SS["Search Schema<br/>────────────────<br/>Zod validation<br/>Query input<br/>Result output"]:::schema
        end

    end

    CONTENT[("Content Directory<br/>content/**/*.md")]:::datastore

    %% Client → Router → Procedures
    CLIENT -->|"tRPC calls"| ROUTER
    CLIENT -->|"HTTP GET"| RSS
    CLIENT -->|"HTTP GET"| SITEMAP
    CLIENT -->|"HTTP GET"| ROBOTS
    ROUTER --> CP
    ROUTER --> CU
    ROUTER --> SQ
    ROUTER --> MH

    %% Procedures → Services
    CP --> CS
    CP --> CR
    CP --> MP
    CU --> CS
    SQ --> SI
    RSS --> CS
    SITEMAP --> CS

    %% Services → Content
    CS --> CR
    CR --> CONTENT

    %% Search → Content
    SI --> CS
    SI --> SM

    %% Schemas validate input/output
    CP --> FS
    CS --> FS
    SQ --> SS

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef handler fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef procedure fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef service fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef search fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef schema fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/oseplatform/be/gherkin/`](../be/):

| Component                            | Gherkin Domain    | Feature                   |
| ------------------------------------ | ----------------- | ------------------------- |
| content.getBySlug + ContentReader    | content-retrieval | content-retrieval.feature |
| content.listUpdates + ContentService | content-retrieval | content-retrieval.feature |
| search.query + SearchIndex           | search            | search.feature            |
| meta.health                          | health            | health.feature            |
| RSS Feed route handler               | rss-feed          | rss-feed.feature          |
| Sitemap + Robots route handlers      | seo               | seo.feature               |

## Testing

| Level       | What                                 | Coverage |
| ----------- | ------------------------------------ | -------- |
| `test:unit` | Service + procedure calls via Vitest | >= 80%   |
| `test:e2e`  | Full tRPC HTTP via Playwright        | N/A      |

## Related

- **Container diagram**: [container.md](./container.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Backend gherkin specs**: [be/gherkin/](../be/)
- **Parent**: [oseplatform-web specs](../README.md)
