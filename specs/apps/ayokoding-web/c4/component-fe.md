# Component Diagram: UI (Frontend)

Level 3 of the C4 model. Shows the logical components inside the Next.js client-side application:
pages, layout components, content renderers, search, and internationalization.

Pages are Server Components by default. Client Components are used only where browser interactivity
is needed (search dialog, theme toggle, language switcher, sidebar tree, Mermaid rendering).

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    LEARNER("Learner<br/>Desktop / Tablet / Mobile"):::actor

    subgraph SPA["Next.js UI"]

        subgraph LAYER1["Pages (Server Components)"]
            HP["Home Page<br/>────────────────<br/>/ redirect<br/>to /[locale]/"]:::page
            LP["Locale Home<br/>────────────────<br/>/[locale]/<br/>Landing page"]:::page
            CP["Content Page<br/>────────────────<br/>/[locale]/[...slug]<br/>SSG (generateStaticParams)"]:::page
            SP["Sitemap<br/>────────────────<br/>/sitemap.xml<br/>All pages"]:::page
            FP["RSS Feed<br/>────────────────<br/>/feed.xml<br/>Recent content"]:::page
        end

        subgraph LAYER2["Layout Components"]
            HEADER["Header<br/>────────────────<br/>Logo, search trigger<br/>Theme toggle<br/>Language switcher"]:::layout
            SIDEBAR["Sidebar<br/>────────────────<br/>Navigation tree<br/>Collapsible sections<br/>Active page highlight"]:::layout
            FOOTER["Footer<br/>────────────────<br/>Copyright<br/>Links"]:::layout
            BREAD["Breadcrumb<br/>────────────────<br/>Path segments<br/>Current page title"]:::layout
            TOC["Table of Contents<br/>────────────────<br/>Page headings<br/>Scroll tracking"]:::layout
            PREVNEXT["Prev/Next Nav<br/>────────────────<br/>Sequential nav<br/>Within section"]:::layout
            MOBILE["Mobile Nav<br/>────────────────<br/>Sheet drawer<br/>Full sidebar tree"]:::layout
        end

        subgraph LAYER3["Content Renderers"]
            MDR["Markdown Renderer<br/>────────────────<br/>HTML from tRPC<br/>Code blocks<br/>Heading anchors"]:::renderer
            CALLOUT["Callout<br/>────────────────<br/>Info, warning<br/>Tip, danger"]:::renderer
            TABS["Tabs<br/>────────────────<br/>Multi-language<br/>Code examples"]:::renderer
            STEPS["Steps<br/>────────────────<br/>Numbered steps<br/>Tutorial flow"]:::renderer
            MERMAID["Mermaid<br/>────────────────<br/>Client-side render<br/>Diagram support"]:::renderer
            YT["YouTube<br/>────────────────<br/>Embed player<br/>Responsive iframe"]:::renderer
        end

        subgraph LAYER4["Search (Client Component)"]
            SD["Search Dialog<br/>────────────────<br/>Cmd+K trigger<br/>Live results<br/>Navigate on select"]:::search
            SP2["Search Provider<br/>────────────────<br/>Context provider<br/>tRPC query hook"]:::search
        end

        subgraph LAYER5["i18n"]
            LS["Language Switcher<br/>────────────────<br/>EN ↔ ID toggle<br/>URL rewrite"]:::i18n
            MW["Middleware<br/>────────────────<br/>Locale detection<br/>Redirect to /en/"]:::i18n
            TR["Translations<br/>────────────────<br/>UI strings<br/>Per locale"]:::i18n
        end

    end

    API["tRPC API<br/>(Server-side)"]:::external

    %% Learner → Pages
    LEARNER -->|"browser"| MW
    MW -->|"route"| HP
    MW -->|"route"| LP
    MW -->|"route"| CP

    %% Pages use Layout
    CP --> HEADER
    CP --> SIDEBAR
    CP --> BREAD
    CP --> TOC
    CP --> PREVNEXT
    CP --> FOOTER
    LP --> HEADER
    LP --> FOOTER

    %% Pages use Content Renderers
    CP --> MDR
    MDR --> CALLOUT
    MDR --> TABS
    MDR --> STEPS
    MDR --> MERMAID
    MDR --> YT

    %% Header → Search + i18n
    HEADER --> SD
    HEADER --> LS
    SD --> SP2

    %% Search + Pages → API
    SP2 -->|"search.query"| API
    CP -->|"content.getBySlug"| API
    LP -->|"content.getTree"| API
    SIDEBAR -->|"content.getTree"| API

    %% i18n
    LS --> TR
    MW --> TR

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef layout fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef renderer fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef search fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef i18n fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/ayokoding-web/fe/gherkin/`](../fe/) (future):

| Component                        | Expected Domain | Scope                                  |
| -------------------------------- | --------------- | -------------------------------------- |
| Content Page + Markdown Renderer | content         | Page rendering, code blocks, headings  |
| Search Dialog + Search Provider  | search          | Search trigger, results, navigation    |
| Sidebar + Breadcrumb + Prev/Next | navigation      | Tree navigation, breadcrumbs, ordering |
| Language Switcher + Middleware   | i18n            | Locale toggle, URL rewrite, redirects  |
| Header + Footer + Mobile Nav     | layout          | Responsive layout, accessibility       |

## Testing

| Level       | What                           | Coverage |
| ----------- | ------------------------------ | -------- |
| `test:unit` | Component rendering via Vitest | >= 80%   |
| `test:e2e`  | Full browser via Playwright    | N/A      |

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/)
- **Parent**: [ayokoding-web specs](../README.md)
