# Component Diagram: UI (Frontend)

Level 3 of the C4 model. Shows the logical components inside the Next.js client-side application:
pages, layout components, content renderers, search, and theme.

Pages are Server Components by default. Client Components are used only where browser interactivity
is needed (search dialog, theme toggle, mobile navigation, Mermaid rendering). There is no i18n
layer — the site is English only.

The component graph is presented as three views of the same architecture, one per hop: entry
(visitor to pages), composition (pages to layout and renderers), and integration (header to search,
theme, mobile nav, and the tRPC API).

## View 1 — Visitor to Pages

A visitor reaches four navigable routes. Two further routes (`/sitemap.xml`, `/feed.xml`) are
machine-facing and are not entered through the browser navigation.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    accTitle: View 1 — Visitor to Pages
    accDescr: Visitor Desktop / Tablet / Mobile leads to Home Page ──────────────── / Hero, mission Social links via browser; Visitor Desktop / Tablet / Mobile leads to About Page ──────────────── /about/ Platform info via browser; and 2 more links.
    VISITOR("Visitor<br/>Desktop / Tablet /<br/>Mobile"):::actor

    subgraph SPA["Next.js UI"]
        subgraph LAYER1["Pages (Server<br/>Components)"]
            HP["Home Page<br/>────────────────<br/>/<br/>Hero, mission<br/>Social links"]:::page
            AP["About Page<br/>────────────────<br/>/about/<br/>Platform info"]:::page
            UL["Updates Listing<br/>────────────────<br/>/updates/<br/>All update posts"]:::page
            UD["Update Detail<br/>────────────────<br/>/updates/[slug]/<br/>Single update"]:::page
            SP["Sitemap<br/>────────────────<br/>/sitemap.xml<br/>All pages"]:::page
            FP["RSS Feed<br/>────────────────<br/>/feed.xml<br/>Update posts"]:::page
        end
    end

    %% Visitor → Pages
    VISITOR -->|"browser"| HP
    VISITOR -->|"browser"| AP
    VISITOR -->|"browser"| UL
    VISITOR -->|"browser"| UD

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## View 2 — Pages to Layout Components and Content Renderers

Each page composes layout components, and the two markdown-backed pages additionally drive the
content renderers.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    accTitle: View 2 — Pages to Layout Components and Content Renderers
    accDescr: Home Page ──────────────── / Hero, mission Social links leads to Header ──────────────── Logo, search trigger Theme toggle Nav links; Home Page ──────────────── / Hero, mission Social links leads to Footer ──────────────── Copyright Links; and 13 more links.
    subgraph SPA["Next.js UI"]

        subgraph LAYER1["Pages (Server<br/>Components)"]
            HP["Home Page<br/>────────────────<br/>/<br/>Hero, mission<br/>Social links"]:::page
            AP["About Page<br/>────────────────<br/>/about/<br/>Platform info"]:::page
            UL["Updates Listing<br/>────────────────<br/>/updates/<br/>All update posts"]:::page
            UD["Update Detail<br/>────────────────<br/>/updates/[slug]/<br/>Single update"]:::page
        end

        subgraph LAYER2["Layout Components"]
            HEADER["Header<br/>────────────────<br/>Logo, search trigger<br/>Theme toggle<br/>Nav links"]:::layout
            FOOTER["Footer<br/>────────────────<br/>Copyright<br/>Links"]:::layout
            BREAD["Breadcrumb<br/>────────────────<br/>Path segments<br/>Current page"]:::layout
            TOC["Table of Contents<br/>────────────────<br/>Page headings<br/>Scroll tracking"]:::layout
            PREVNEXT["Prev/Next Nav<br/>────────────────<br/>Sequential nav<br/>Between updates"]:::layout
        end

        subgraph LAYER3["Content Renderers"]
            MDR["MarkdownRenderer<br/>────────────────<br/>HTML from tRPC<br/>Code blocks<br/>Heading anchors"]:::renderer
            MERMAID["Mermaid<br/>────────────────<br/>Client-side render<br/>Diagram support"]:::renderer
        end

    end

    %% Pages use Layout
    HP --> HEADER
    HP --> FOOTER
    AP --> HEADER
    AP --> BREAD
    AP --> FOOTER
    UL --> HEADER
    UL --> FOOTER
    UD --> HEADER
    UD --> BREAD
    UD --> TOC
    UD --> PREVNEXT
    UD --> FOOTER

    %% Pages use Content Renderers
    AP --> MDR
    UD --> MDR
    MDR --> MERMAID

    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef layout fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef renderer fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

## View 3 — Header, Search, Theme, and the tRPC API

The header mounts the three client-interactive pieces, and both the search provider and the two
content-backed pages call the server-side tRPC API.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    accTitle: View 3 — Header, Search, Theme, and the tRPC API
    accDescr: Header ──────────────── Logo, search trigger Theme toggle Nav links leads to SearchDialog ──────────────── Cmd+K trigger Live results Navigate on select; and 6 more links.
    subgraph SPA["Next.js UI"]

        subgraph LAYER1["Pages (Server<br/>Components)"]
            UL["Updates Listing<br/>────────────────<br/>/updates/<br/>All update posts"]:::page
            UD["Update Detail<br/>────────────────<br/>/updates/[slug]/<br/>Single update"]:::page
        end

        subgraph LAYER2["Layout Components"]
            HEADER["Header<br/>────────────────<br/>Logo, search trigger<br/>Theme toggle<br/>Nav links"]:::layout
            MOBILE["Mobile Nav<br/>────────────────<br/>Hamburger menu<br/>Sheet drawer"]:::layout
        end

        subgraph LAYER4["Search (Client<br/>Component)"]
            SD["SearchDialog<br/>────────────────<br/>Cmd+K trigger<br/>Live results<br/>Navigate on select"]:::search
            SP2["SearchProvider<br/>────────────────<br/>Context provider<br/>tRPC query hook"]:::search
        end

        subgraph LAYER5["Theme"]
            TT["ThemeToggle<br/>────────────────<br/>Dark / Light<br/>next-themes"]:::theme
        end

    end

    API["tRPC API<br/>(Server-side)"]:::external

    %% Header → Search + Theme
    HEADER --> SD
    HEADER --> TT
    HEADER --> MOBILE
    SD --> SP2

    %% Search + Pages → API
    SP2 -->|"search.query"| API
    UD -->|"content.getBySlug"| API
    UL -->|"content.listUpdates"| API

    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef layout fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef search fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef theme fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#000000,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[specs/apps/ose/www/behaviours/frontend/`](./behaviours/frontend/):

| Component                      | Gherkin Domain | Scope                                  |
| ------------------------------ | -------------- | -------------------------------------- |
| Home Page (hero, social icons) | landing-page   | Hero rendering, social links           |
| Header + navigation links      | navigation     | Header links, external links           |
| Breadcrumb + Prev/Next         | navigation     | Breadcrumbs, sequential navigation     |
| ThemeToggle                    | theme          | Default theme, toggle dark/light       |
| Header + Mobile Nav            | responsive     | Hamburger menu, desktop nav visibility |

## Testing

| Level       | What                           | Coverage     |
| ----------- | ------------------------------ | ------------ |
| `test:unit` | Component rendering via Vitest | >= 99% lines |
| `test:e2e`  | Full browser via Playwright    | N/A          |

## Related

- **Architecture**: [architecture.md](./architecture.md)
- **api perspective components**: [api-components.md](./api-components.md)
- **web perspective scenarios**: [behaviours/frontend/](./behaviours/frontend/README.md)
- **Parent**: [ose-www specs](./README.md)
