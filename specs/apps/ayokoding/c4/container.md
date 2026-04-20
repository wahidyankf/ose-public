# Container Diagram: AyoKoding Web

Level 2 of the C4 model. Shows the runtime containers inside the AyoKoding Web system boundary:
the Next.js application (server + client), the content directory, the in-memory search index,
and the Vercel hosting platform.

The Next.js app runs as a standalone deployment on Vercel. Content pages are statically generated
at build time via `generateStaticParams`. The search index is built in-memory from content
metadata using FlexSearch.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    LEARNER("Learner<br/>Desktop / Tablet / Mobile"):::actor
    AUTHOR("Content Author"):::actor_author

    subgraph SYSTEM["AyoKoding Web"]
        SSR["Next.js Server<br/>──────────────────<br/>App Router + tRPC<br/><br/>Server Components<br/>SSG (generateStaticParams)<br/>tRPC API routes<br/>Markdown parsing<br/>Syntax highlighting"]:::container_be

        CLIENT["Next.js Client<br/>──────────────────<br/>Browser SPA<br/><br/>Client Components<br/>Search dialog<br/>Theme toggle<br/>Language switcher<br/>Sidebar navigation"]:::container_fe

        CONTENT[("Content Directory<br/>──────────────────<br/>Markdown + YAML<br/><br/>content/en/**/*.md<br/>content/id/**/*.md<br/>~1000+ files")]:::datastore

        SEARCH["Search Index<br/>──────────────────<br/>FlexSearch<br/><br/>In-memory index<br/>Per-locale<br/>Title + body"]:::search
    end

    subgraph CICD["CI Pipelines"]
        MAIN_CI["Main CI<br/>──────────────────<br/>typecheck, lint, test:quick<br/>On push to main"]:::ci

        BE_E2E["BE E2E CI<br/>──────────────────<br/>Playwright<br/>tRPC API tests<br/>Scheduled"]:::ci

        FE_E2E["FE E2E CI<br/>──────────────────<br/>Playwright<br/>Browser UI tests<br/>Scheduled"]:::ci
    end

    VERCEL["Vercel CDN<br/>──────────────────<br/>Edge Network<br/>Static pages<br/>Standalone output"]:::infra

    LEARNER -->|"browser"| CLIENT
    AUTHOR -->|"write markdown"| CONTENT

    CLIENT -->|"tRPC calls + page loads"| SSR
    SSR -->|"read markdown"| CONTENT
    SSR -->|"query"| SEARCH
    SSR -->|"build index from"| CONTENT
    SSR -->|"HTML + JS bundles"| CLIENT

    SSR -->|"standalone deploy"| VERCEL
    VERCEL -->|"serve static pages"| LEARNER

    MAIN_CI -->|"test"| SSR
    BE_E2E -->|"tRPC tests"| SSR
    FE_E2E -->|"browser tests"| CLIENT

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_author fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef container_be fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container_fe fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef search fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef infra fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef ci fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

## Container Details

### Next.js Server

The server-side runtime handles:

- **tRPC API** (`/api/trpc/[trpc]`): Procedures for content retrieval, search, and metadata
- **Server Components**: Pages statically generated at build time via `generateStaticParams`
- **Content pipeline**: gray-matter → unified (remark/rehype) → HTML with syntax highlighting (shiki)
- **Search index**: FlexSearch built from all content metadata at startup

### Next.js Client

The browser-side application provides:

- **Search dialog**: Full-text search via tRPC call to server-side FlexSearch
- **Language switcher**: Toggle between EN/ID locales
- **Theme toggle**: Dark/light mode
- **Sidebar navigation**: Hierarchical content tree with collapsible sections
- **Content rendering**: Markdown HTML with code blocks, Mermaid diagrams, callouts

### Content Directory

- ~1000+ markdown files with YAML frontmatter
- Organized by locale (`en/`, `id/`) and topic hierarchy
- Section pages use `_index.md` convention
- Frontmatter: title, weight, date, description, tags, draft

## Related

- **Context diagram**: [context.md](./context.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [ayokoding-web specs](../README.md)
