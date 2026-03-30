# Component Diagram: UI (Frontend)

Level 3 of the C4 model. Shows the logical components inside the Next.js client-side application:
pages, layout components, content renderers, search, and theme.

Pages are Server Components by default. Client Components are used only where browser interactivity
is needed (search dialog, theme toggle, mobile navigation, Mermaid rendering). There is no i18n
layer — the site is English only.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    VISITOR("Visitor<br/>Desktop / Tablet / Mobile"):::actor

    subgraph SPA["Next.js UI"]

        subgraph LAYER1["Pages (Server Components)"]
            HP["Home Page<br/>────────────────<br/>/<br/>Hero, mission<br/>Social links"]:::page
            AP["About Page<br/>────────────────<br/>/about/<br/>Platform info"]:::page
            UL["Updates Listing<br/>────────────────<br/>/updates/<br/>All update posts"]:::page
            UD["Update Detail<br/>────────────────<br/>/updates/[slug]/<br/>Single update"]:::page
            SP["Sitemap<br/>────────────────<br/>/sitemap.xml<br/>All pages"]:::page
            FP["RSS Feed<br/>────────────────<br/>/feed.xml<br/>Update posts"]:::page
        end

        subgraph LAYER2["Layout Components"]
            HEADER["Header<br/>────────────────<br/>Logo, search trigger<br/>Theme toggle<br/>Nav links"]:::layout
            FOOTER["Footer<br/>────────────────<br/>Copyright<br/>Links"]:::layout
            BREAD["Breadcrumb<br/>────────────────<br/>Path segments<br/>Current page"]:::layout
            TOC["Table of Contents<br/>────────────────<br/>Page headings<br/>Scroll tracking"]:::layout
            PREVNEXT["Prev/Next Nav<br/>────────────────<br/>Sequential nav<br/>Between updates"]:::layout
            MOBILE["Mobile Nav<br/>────────────────<br/>Hamburger menu<br/>Sheet drawer"]:::layout
        end

        subgraph LAYER3["Content Renderers"]
            MDR["MarkdownRenderer<br/>────────────────<br/>HTML from tRPC<br/>Code blocks<br/>Heading anchors"]:::renderer
            MERMAID["Mermaid<br/>────────────────<br/>Client-side render<br/>Diagram support"]:::renderer
        end

        subgraph LAYER4["Search (Client Component)"]
            SD["SearchDialog<br/>────────────────<br/>Cmd+K trigger<br/>Live results<br/>Navigate on select"]:::search
            SP2["SearchProvider<br/>────────────────<br/>Context provider<br/>tRPC query hook"]:::search
        end

        subgraph LAYER5["Theme"]
            TT["ThemeToggle<br/>────────────────<br/>Dark / Light<br/>next-themes"]:::theme
        end

    end

    API["tRPC API<br/>(Server-side)"]:::external

    %% Visitor → Pages
    VISITOR -->|"browser"| HP
    VISITOR -->|"browser"| AP
    VISITOR -->|"browser"| UL
    VISITOR -->|"browser"| UD

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

    %% Header → Search + Theme
    HEADER --> SD
    HEADER --> TT
    HEADER --> MOBILE
    SD --> SP2

    %% Search + Pages → API
    SP2 -->|"search.query"| API
    UD -->|"content.getBySlug"| API
    UL -->|"content.listUpdates"| API

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef layout fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef renderer fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef search fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef theme fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/oseplatform/fe/gherkin/`](../fe/):

| Component                      | Gherkin Domain | Scope                                  |
| ------------------------------ | -------------- | -------------------------------------- |
| Home Page (hero, social icons) | landing-page   | Hero rendering, social links           |
| Header + navigation links      | navigation     | Header links, external links           |
| Breadcrumb + Prev/Next         | navigation     | Breadcrumbs, sequential navigation     |
| ThemeToggle                    | theme          | Default theme, toggle dark/light       |
| Header + Mobile Nav            | responsive     | Hamburger menu, desktop nav visibility |

## Testing

| Level       | What                           | Coverage |
| ----------- | ------------------------------ | -------- |
| `test:unit` | Component rendering via Vitest | >= 80%   |
| `test:e2e`  | Full browser via Playwright    | N/A      |

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/)
- **Parent**: [oseplatform-web specs](../README.md)
