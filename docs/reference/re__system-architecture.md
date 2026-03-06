# System Architecture

> **Note:** This document is a work in progress (WIP/Draft). Content and diagrams are subject to change as the platform evolves.

Comprehensive reference for the Open Sharia Enterprise platform architecture, including application inventory, interactions, deployment infrastructure, and CI/CD pipelines.

## System Overview

Open Sharia Enterprise is a monorepo-based platform built with Nx, containing multiple applications that serve different aspects of the Sharia-compliant enterprise ecosystem. The system follows a microservices-style architecture where applications are independent but share common libraries and build infrastructure.

**Key Characteristics:**

- **Monorepo Architecture**: Nx workspace with multiple independent applications
- **Trunk-Based Development**: All development on `main` branch
- **Automated Quality Gates**: Git hooks + GitHub Actions + Nx caching
- **Deployment**: Vercel for static sites and web applications
- **Build Optimization**: Nx affected builds ensure only changed code is rebuilt

## C4 Model Architecture

The system architecture is documented using the C4 model (Context, Container, Component, Code) to provide multiple levels of abstraction suitable for different audiences.

### C4 Level 1: System Context

Shows how the Open Sharia Enterprise platform fits into the world, including users and external systems.

```mermaid
graph TB
    subgraph "External Users"
        DEVS[Developers<br/>Building enterprise apps]
        AUTHORS[Content Authors<br/>Writing educational content]
        LEARNERS[Learners<br/>Studying programming/AI/security]
    end

    OSE_PLATFORM[Open Sharia Enterprise Platform<br/>Monorepo with 9 applications<br/>Nx workspace]

    subgraph "External Systems"
        GITHUB[GitHub<br/>Source control & CI/CD]
        VERCEL[Vercel<br/>Static site hosting]
        DNS[DNS/CDN<br/>Domain management]
    end

    DEVS -->|Clone, commit, push| GITHUB
    AUTHORS -->|Write markdown content| GITHUB
    LEARNERS -->|Read tutorials & guides| OSE_PLATFORM

    GITHUB -->|Webhook triggers| OSE_PLATFORM
    OSE_PLATFORM -->|Deploy static sites| VERCEL
    VERCEL -->|Serve websites| LEARNERS
    DNS -->|Route traffic| VERCEL

    style OSE_PLATFORM fill:#0077b6,stroke:#03045e,color:#ffffff,stroke-width:3px
    style DEVS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style AUTHORS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style LEARNERS fill:#2a9d8f,stroke:#264653,color:#ffffff
    style GITHUB fill:#6a4c93,stroke:#22223b,color:#ffffff
    style VERCEL fill:#6a4c93,stroke:#22223b,color:#ffffff
    style DNS fill:#6a4c93,stroke:#22223b,color:#ffffff
```

**Key Relationships:**

- **Developers & Authors**: Interact with GitHub (source of truth) to build applications and create content
- **Learners**: Access educational content via Vercel-hosted Hugo sites (ayokoding-web, oseplatform-web)
- **GitHub**: Central hub for CI/CD automation and quality gates
- **Vercel**: Automated deployment platform for Hugo sites and web applications

## Applications Inventory

The platform consists of 9 applications across 4 technology stacks:

### Frontend Applications (Hugo Static Sites)

#### oseplatform-web

- **Purpose**: Marketing and documentation website for OSE Platform
- **URL**: <https://oseplatform.com>
- **Technology**: Hugo 0.156.0 Extended + PaperMod theme
- **Deployment**: Vercel (via `prod-oseplatform-web` branch)
- **Build Command**: `nx build oseplatform-web`
- **Dev Command**: `nx dev oseplatform-web`
- **Location**: `apps/oseplatform-web/`

#### ayokoding-web

- **Purpose**: Educational platform for programming, AI, and security
- **URL**: <https://ayokoding.com>
- **Technology**: Hugo 0.156.0 Extended + Hextra theme
- **Languages**: Bilingual (Indonesian primary, English)
- **Deployment**: Vercel (via `prod-ayokoding-web` branch)
- **Build Command**: `nx build ayokoding-web`
- **Dev Command**: `nx dev ayokoding-web`
- **Location**: `apps/ayokoding-web/`
- **Special Features**:
  - Automated title updates from filenames
  - Auto-generated navigation structure
  - Pre-commit hooks for content processing

### CLI Tools (Go)

#### ayokoding-cli

- **Purpose**: Content automation for ayokoding-web
- **Language**: Go 1.26
- **Build Command**: `nx build ayokoding-cli`
- **Location**: `apps/ayokoding-cli/`
- **Features**:
  - Title extraction and update from markdown filenames
  - Navigation structure regeneration
  - Integrated into pre-commit hooks
- **Usage**: Automatically runs during git commit when ayokoding-web content changes

#### rhino-cli

- **Purpose**: Repository management and automation
- **Language**: Go 1.26
- **Build Command**: `nx build rhino-cli`
- **Location**: `apps/rhino-cli/`
- **Status**: Active development

#### oseplatform-cli

- **Purpose**: OSE Platform site link validation
- **Language**: Go 1.26
- **Build Command**: `nx build oseplatform-cli`
- **Location**: `apps/oseplatform-cli/`
- **Features**:
  - Validates all internal links in oseplatform-web content
  - Text, JSON, and markdown output formats
- **Usage**: Runs as first step of `oseplatform-web`'s `test:quick` target

### Web Applications (Next.js)

#### organiclever-web

- **Purpose**: Landing and promotional website for OrganicLever
- **URL**: <https://www.organiclever.com>
- **Technology**: Next.js 16 (App Router) + React 19 + TailwindCSS
- **Deployment**: Vercel (via `prod-organiclever-web` branch)
- **Build Command**: `nx build organiclever-web`
- **Dev Command**: `nx dev organiclever-web`
- **Location**: `apps/organiclever-web/`
- **Features**:
  - Radix UI / shadcn-ui component library
  - Cookie-based authentication
  - JSON data files for content
  - Production Dockerfile with standalone output

### Backend Services (Spring Boot)

#### organiclever-be

- **Purpose**: REST API backend for OrganicLever
- **Technology**: Spring Boot + Java + Maven
- **Build Command**: `nx build organiclever-be`
- **Location**: `apps/organiclever-be/`
- **Features**:
  - JaCoCo code coverage enforcement (>=95%)
  - Production Dockerfile with multi-stage build
  - MockMvc integration testing

### E2E Test Suites (Playwright)

#### organiclever-web-e2e

- **Purpose**: End-to-end tests for organiclever-web
- **Technology**: Playwright
- **Run Command**: `nx run organiclever-web-e2e:test:e2e`
- **Location**: `apps/organiclever-web-e2e/`

#### organiclever-be-e2e

- **Purpose**: End-to-end tests for organiclever-be REST API
- **Technology**: Playwright
- **Run Command**: `nx run organiclever-be-e2e:test:e2e`
- **Location**: `apps/organiclever-be-e2e/`

### C4 Level 2: Container Diagram

Shows the high-level technical building blocks (containers) of the system. In C4 terminology, a "container" is a deployable/executable unit (web app, database, file system, etc.), not a Docker container.

```mermaid
graph TB
    subgraph "Marketing & Education Sites"
        OSE[oseplatform-web<br/>Hugo Static Site]
        AYO[ayokoding-web<br/>Hugo Static Site]
    end

    subgraph "OrganicLever Platform"
        OL_WEB[organiclever-web<br/>Next.js App]
        OL_BE[organiclever-be<br/>Spring Boot API]
        OL_WEB_E2E[organiclever-web-e2e<br/>Playwright E2E]
        OL_BE_E2E[organiclever-be-e2e<br/>Playwright E2E]
    end

    subgraph "CLI Tools"
        AYOCLI[ayokoding-cli<br/>Go CLI]
        RHINO[rhino-cli<br/>Go CLI]
        OSECLI[oseplatform-cli<br/>Go CLI]
    end

    subgraph "Shared Infrastructure"
        NX[Nx Workspace<br/>Build Orchestration]
        LIBS[Shared Libraries<br/>golang-commons, hugo-commons]
    end

    AYOCLI -->|Updates content| AYO
    RHINO -->|Repository automation| NX
    OSECLI -->|Validates links| OSE
    OL_WEB_E2E -->|Tests| OL_WEB
    OL_BE_E2E -->|Tests| OL_BE

    NX -.->|Manages| OSE
    NX -.->|Manages| AYO
    NX -.->|Manages| AYOCLI
    NX -.->|Manages| RHINO
    NX -.->|Manages| OL_WEB
    NX -.->|Manages| OL_BE

    OSE -.->|May import| LIBS
    AYO -.->|May import| LIBS

    style OSE fill:#0077b6,stroke:#03045e,color:#ffffff
    style AYO fill:#0077b6,stroke:#03045e,color:#ffffff
    style OL_WEB fill:#0077b6,stroke:#03045e,color:#ffffff
    style OL_BE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style OL_WEB_E2E fill:#457b9d,stroke:#1d3557,color:#ffffff
    style OL_BE_E2E fill:#457b9d,stroke:#1d3557,color:#ffffff
    style AYOCLI fill:#2a9d8f,stroke:#264653,color:#ffffff
    style RHINO fill:#2a9d8f,stroke:#264653,color:#ffffff
    style OSECLI fill:#2a9d8f,stroke:#264653,color:#ffffff
    style NX fill:#6a4c93,stroke:#22223b,color:#ffffff
    style LIBS fill:#457b9d,stroke:#1d3557,color:#ffffff
```

### Application Interactions

**Independent Application Suites:**

Marketing & Education Sites:

- oseplatform-web: Fully independent static site
- ayokoding-web: Fully independent static site (with CLI automation)

CLI Tools:

- ayokoding-cli: Processes ayokoding-web content during build
- rhino-cli: Repository management automation

**Build-Time Dependencies:**

- All applications managed by Nx workspace
- CLI tools executed during build processes
- Shared libraries may be imported at build time via `@open-sharia-enterprise/[lib-name]`

**Content Processing Pipeline (ayokoding-web):**

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Hook
    participant CLI as ayokoding-cli
    participant Content as ayokoding-web/content
    participant Hugo as Hugo Build

    Dev->>Git: git commit
    Git->>CLI: nx build ayokoding-cli
    CLI->>Content: Update titles from filenames
    CLI->>Content: Regenerate navigation
    Git->>Git: Stage updated content
    Git->>Hugo: Continue commit

    Note over Dev,Hugo: Automated content processing during commit
```

### C4 Level 3: Component Diagrams

Shows the internal components within each container. Components are groupings of related functionality behind a well-defined interface.

#### oseplatform-web Components (Hugo Static Site)

```mermaid
graph TB
    subgraph "Content"
        MD_CONTENT[Markdown Content<br/>Platform documentation]
        FRONTMATTER_OSE[Frontmatter<br/>Page metadata]
        ASSETS[Static Assets<br/>Images, CSS, JS]
    end

    subgraph "Theme - PaperMod"
        LAYOUTS_OSE[Layouts<br/>HTML templates]
        PARTIALS_OSE[Partials<br/>Reusable components]
        THEME_CONFIG[Theme Config<br/>config.yaml]
    end

    subgraph "Build Output"
        HTML_OSE[HTML Files<br/>Generated pages]
        STATIC_OSE[Static Files<br/>Processed assets]
    end

    HUGO_OSE[Hugo Build Engine<br/>v0.156.0 Extended]

    MD_CONTENT --> HUGO_OSE
    FRONTMATTER_OSE --> HUGO_OSE
    LAYOUTS_OSE --> HUGO_OSE
    PARTIALS_OSE --> HUGO_OSE
    THEME_CONFIG --> HUGO_OSE
    ASSETS --> HUGO_OSE
    HUGO_OSE --> HTML_OSE
    HUGO_OSE --> STATIC_OSE

    style MD_CONTENT fill:#0077b6,stroke:#03045e,color:#ffffff
    style LAYOUTS_OSE fill:#2a9d8f,stroke:#264653,color:#ffffff
    style HUGO_OSE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style HTML_OSE fill:#457b9d,stroke:#1d3557,color:#ffffff
```

**Component Responsibilities:**

- **Markdown Content**: Platform marketing and documentation content
- **Layouts**: PaperMod theme templates for page structure
- **Theme Config**: Site configuration, navigation menus, theme settings

#### ayokoding-cli Components (Go CLI Tool)

```mermaid
graph TB
    subgraph "CLI Interface"
        CMD_ROOT[Root Command<br/>Cobra CLI root]
        CMD_TITLES[Update Titles Command<br/>Title extraction & update]
        CMD_NAV[Regenerate Nav Command<br/>Navigation generation]
        CMD_FLAGS[Flags Parser<br/>Command-line arguments]
    end

    subgraph "Title Processing"
        TITLE_EXTRACTOR[Title Extractor<br/>Parse filename to title]
        FRONTMATTER_UPDATER[Frontmatter Updater<br/>Update YAML frontmatter]
        TITLE_FORMATTER[Title Formatter<br/>Format title text]
    end

    subgraph "Navigation Processing"
        NAV_SCANNER[Directory Scanner<br/>Traverse content tree]
        NAV_BUILDER[Navigation Builder<br/>Build nav structure]
        NAV_WRITER[Navigation Writer<br/>Write _index.md files]
        WEIGHT_CALC[Weight Calculator<br/>Level-based ordering]
    end

    subgraph "File Operations"
        FILE_READER[File Reader<br/>Read markdown files]
        FILE_WRITER[File Writer<br/>Write markdown files]
        YAML_PARSER[YAML Parser<br/>Parse/serialize frontmatter]
        MD_PARSER[Markdown Parser<br/>Parse markdown structure]
    end

    subgraph "Configuration"
        CONFIG_LOADER[Config Loader<br/>Load configuration]
        PATH_RESOLVER[Path Resolver<br/>Resolve file paths]
        LOGGER[Logger<br/>Structured logging]
    end

    CONTENT_DIR[ayokoding-web/content/<br/>Markdown files]

    CMD_ROOT --> CMD_TITLES
    CMD_ROOT --> CMD_NAV
    CMD_ROOT --> CMD_FLAGS
    CMD_TITLES --> TITLE_EXTRACTOR
    CMD_TITLES --> FRONTMATTER_UPDATER
    TITLE_EXTRACTOR --> TITLE_FORMATTER
    FRONTMATTER_UPDATER --> YAML_PARSER
    FRONTMATTER_UPDATER --> FILE_WRITER
    CMD_NAV --> NAV_SCANNER
    NAV_SCANNER --> NAV_BUILDER
    NAV_BUILDER --> WEIGHT_CALC
    NAV_BUILDER --> NAV_WRITER
    NAV_WRITER --> FILE_WRITER
    FILE_READER --> CONTENT_DIR
    FILE_WRITER --> CONTENT_DIR
    FILE_READER --> MD_PARSER
    FILE_READER --> YAML_PARSER
    CONFIG_LOADER --> PATH_RESOLVER
    PATH_RESOLVER --> FILE_READER

    style CMD_ROOT fill:#0077b6,stroke:#03045e,color:#ffffff
    style TITLE_EXTRACTOR fill:#2a9d8f,stroke:#264653,color:#ffffff
    style NAV_BUILDER fill:#2a9d8f,stroke:#264653,color:#ffffff
    style FILE_READER fill:#e76f51,stroke:#9d0208,color:#ffffff
    style FILE_WRITER fill:#e76f51,stroke:#9d0208,color:#ffffff
    style YAML_PARSER fill:#457b9d,stroke:#1d3557,color:#ffffff
    style CONTENT_DIR fill:#9d0208,stroke:#6a040f,color:#ffffff
```

**Component Responsibilities:**

- **Root Command**: CLI entry point, command routing, help text
- **Title Extractor**: Extract title from filename pattern (e.g., `01__intro.md` → "Intro")
- **Frontmatter Updater**: Update YAML frontmatter in markdown files
- **Navigation Scanner**: Recursively scan content directory structure
- **Navigation Builder**: Build hierarchical navigation structure
- **Weight Calculator**: Calculate level-based ordering (level 1 = 100, level 2 = 200, etc.)
- **YAML Parser**: Parse and serialize YAML frontmatter

#### rhino-cli Components (Go CLI Tool)

```mermaid
graph TB
    subgraph "CLI Interface"
        RHINO_ROOT[Root Command<br/>Repository automation]
        RHINO_FLAGS[Flags Parser<br/>Command-line arguments]
    end

    subgraph "Automation Modules"
        AUTO_MODULE[Automation Module<br/>Extensible automation]
    end

    subgraph "Infrastructure"
        RHINO_CONFIG[Config Loader<br/>Configuration]
        RHINO_LOGGER[Logger<br/>Logging]
    end

    RHINO_ROOT --> AUTO_MODULE
    RHINO_ROOT --> RHINO_FLAGS
    AUTO_MODULE --> RHINO_CONFIG
    AUTO_MODULE --> RHINO_LOGGER

    style RHINO_ROOT fill:#0077b6,stroke:#03045e,color:#ffffff
    style AUTO_MODULE fill:#2a9d8f,stroke:#264653,color:#ffffff
```

**Component Responsibilities:**

- **Root Command**: CLI entry point for repository automation tasks
- **Automation Module**: Extensible module system for automation workflows
- **Config Loader**: Load butler-specific configuration

#### oseplatform-web Components (Hugo Static Site)

```mermaid
graph TB
    subgraph "Content"
        MD_CONTENT[Markdown Content<br/>Platform documentation]
        FRONTMATTER_OSE[Frontmatter<br/>Page metadata]
        ASSETS[Static Assets<br/>Images, CSS, JS]
    end

    subgraph "Theme - PaperMod"
        LAYOUTS_OSE[Layouts<br/>HTML templates]
        PARTIALS_OSE[Partials<br/>Reusable components]
        THEME_CONFIG[Theme Config<br/>config.yaml]
    end

    subgraph "Build Output"
        HTML_OSE[HTML Files<br/>Generated pages]
        STATIC_OSE[Static Files<br/>Processed assets]
    end

    HUGO_OSE[Hugo Build Engine<br/>v0.156.0 Extended]

    MD_CONTENT --> HUGO_OSE
    FRONTMATTER_OSE --> HUGO_OSE
    LAYOUTS_OSE --> HUGO_OSE
    PARTIALS_OSE --> HUGO_OSE
    THEME_CONFIG --> HUGO_OSE
    ASSETS --> HUGO_OSE
    HUGO_OSE --> HTML_OSE
    HUGO_OSE --> STATIC_OSE

    style MD_CONTENT fill:#0077b6,stroke:#03045e,color:#ffffff
    style LAYOUTS_OSE fill:#2a9d8f,stroke:#264653,color:#ffffff
    style HUGO_OSE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style HTML_OSE fill:#457b9d,stroke:#1d3557,color:#ffffff
```

**Component Responsibilities:**

- **Markdown Content**: Platform marketing and documentation content
- **Layouts**: PaperMod theme templates for page structure
- **Theme Config**: Site configuration, navigation menus, theme settings

#### ayokoding-web Components (Hugo Static Site)

```mermaid
graph TB
    subgraph "Content"
        MD_CONTENT_AYO[Markdown Content<br/>Educational tutorials]
        FRONTMATTER_AYO[Frontmatter<br/>Auto-updated titles]
        NAV_FILES[Navigation Files<br/>Auto-generated _index.md]
        I18N_CONTENT[i18n Content<br/>Indonesian + English]
        ASSETS_AYO[Static Assets<br/>Images, diagrams]
    end

    subgraph "Theme - Hextra"
        LAYOUTS_AYO[Layouts<br/>Documentation templates]
        PARTIALS_AYO[Partials<br/>Navigation, sidebar]
        THEME_CONFIG_AYO[Theme Config<br/>Bilingual config]
    end

    subgraph "Build Output"
        HTML_AYO[HTML Files<br/>Generated pages]
        STATIC_AYO[Static Files<br/>Processed assets]
        SEARCH_INDEX[Search Index<br/>Client-side search]
    end

    HUGO_AYO[Hugo Build Engine<br/>v0.156.0 Extended]
    AYOCLI_PROC[ayokoding-cli<br/>Pre-build processing]

    AYOCLI_PROC --> FRONTMATTER_AYO
    AYOCLI_PROC --> NAV_FILES
    MD_CONTENT_AYO --> HUGO_AYO
    FRONTMATTER_AYO --> HUGO_AYO
    NAV_FILES --> HUGO_AYO
    I18N_CONTENT --> HUGO_AYO
    LAYOUTS_AYO --> HUGO_AYO
    PARTIALS_AYO --> HUGO_AYO
    THEME_CONFIG_AYO --> HUGO_AYO
    ASSETS_AYO --> HUGO_AYO
    HUGO_AYO --> HTML_AYO
    HUGO_AYO --> STATIC_AYO
    HUGO_AYO --> SEARCH_INDEX

    style MD_CONTENT_AYO fill:#0077b6,stroke:#03045e,color:#ffffff
    style AYOCLI_PROC fill:#6a4c93,stroke:#22223b,color:#ffffff
    style NAV_FILES fill:#2a9d8f,stroke:#264653,color:#ffffff
    style HUGO_AYO fill:#e76f51,stroke:#9d0208,color:#ffffff
    style SEARCH_INDEX fill:#457b9d,stroke:#1d3557,color:#ffffff
```

**Component Responsibilities:**

- **ayokoding-cli**: Pre-build processing (title updates, navigation generation)
- **Markdown Content**: Programming, AI, and security educational content
- **Navigation Files**: Auto-generated navigation structure with level-based weights
- **i18n Content**: Bilingual support (Indonesian primary, English secondary)
- **Search Index**: Client-side search for documentation

### C4 Level 4: Code Architecture

Shows implementation details for critical components. Focus on Go CLI tool package structures and key implementation patterns.

#### ayokoding-cli Package Structure (Go)

```mermaid
classDiagram
    class main {
        +main() void
    }

    class RootCmd {
        +Execute() error
        -initConfig() void
    }

    class UpdateTitlesCmd {
        +Run() error
        -scanContentDir() []string
        -updateFile(path) error
    }

    class RegenerateNavCmd {
        +Run() error
        -buildNavigationTree() NavTree
        -writeIndexFiles(tree) error
    }

    class TitleExtractor {
        +ExtractFromFilename(path) string
        -parseFilename(name) string
        -formatTitle(raw) string
    }

    class FrontmatterUpdater {
        +UpdateTitle(path, title) error
        -readFile(path) ([]byte, error)
        -parseFrontmatter(content) map[string]interface{}
        -serializeFrontmatter(data) []byte
        -writeFile(path, content) error
    }

    class NavigationScanner {
        +ScanDirectory(root) NavTree
        -walkDir(path) error
        -isMarkdownFile(path) bool
        -extractMetadata(path) Metadata
    }

    class NavigationBuilder {
        +BuildTree(files) NavTree
        -calculateWeights(tree) NavTree
        -sortByWeight(nodes) []NavNode
    }

    class WeightCalculator {
        +CalculateWeight(level) int
        +GetLevelFromPath(path) int
    }

    class NavWriter {
        +WriteIndexFiles(tree) error
        -generateIndexContent(node) string
        -writeFile(path, content) error
    }

    class FileReader {
        +ReadMarkdown(path) (string, error)
        +ParseYAML(content) (map[string]interface{}, error)
    }

    class FileWriter {
        +WriteMarkdown(path, content) error
        +SerializeYAML(data) ([]byte, error)
    }

    class Config {
        -string ContentDir
        -string BaseURL
        -bool Verbose
        +Load() error
        +Validate() error
    }

    class Logger {
        +Info(msg) void
        +Error(msg) void
        +Debug(msg) void
    }

    main --> RootCmd
    RootCmd --> UpdateTitlesCmd
    RootCmd --> RegenerateNavCmd
    RootCmd --> Config
    UpdateTitlesCmd --> TitleExtractor
    UpdateTitlesCmd --> FrontmatterUpdater
    UpdateTitlesCmd --> FileReader
    UpdateTitlesCmd --> FileWriter
    RegenerateNavCmd --> NavigationScanner
    RegenerateNavCmd --> NavigationBuilder
    RegenerateNavCmd --> NavWriter
    NavigationBuilder --> WeightCalculator
    NavWriter --> FileWriter
    FrontmatterUpdater --> FileReader
    FrontmatterUpdater --> FileWriter
    UpdateTitlesCmd --> Logger
    RegenerateNavCmd --> Logger
```

**Go Package Design Patterns:**

- **Command Pattern**: Cobra-based CLI with subcommands
- **Single Responsibility**: Each struct handles one specific task
- **Dependency Injection**: Explicit dependencies passed to constructors
- **Error Handling**: Explicit error returns, no exceptions
- **Interface Abstraction**: FileReader/FileWriter interfaces for testability
- **Configuration Management**: Centralized config loading and validation
- **Structured Logging**: Consistent logging throughout the application

#### Key Sequence Diagrams

**Content Processing Flow (ayokoding-cli + ayokoding-web):**

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Hook<br/>(pre-commit)
    participant CLI as ayokoding-cli
    participant TitleCmd as Update Titles<br/>Command
    participant NavCmd as Regenerate Nav<br/>Command
    participant FileSystem as Content<br/>Directory
    participant Hugo as Hugo Build

    Dev->>Git: git commit
    Git->>Git: Check if ayokoding-web affected
    alt ayokoding-web affected
        Git->>CLI: nx build ayokoding-cli
        CLI-->>Git: CLI binary built
        Git->>TitleCmd: Execute update-titles
        TitleCmd->>FileSystem: Scan content/ directory
        FileSystem-->>TitleCmd: List of markdown files
        loop For each file
            TitleCmd->>TitleCmd: Extract title from filename
            TitleCmd->>FileSystem: Read file + frontmatter
            FileSystem-->>TitleCmd: File content
            TitleCmd->>TitleCmd: Update title in frontmatter
            TitleCmd->>FileSystem: Write updated file
        end
        TitleCmd-->>Git: Titles updated
        Git->>NavCmd: Execute regenerate-nav
        NavCmd->>FileSystem: Scan content/ tree
        FileSystem-->>NavCmd: Directory structure
        NavCmd->>NavCmd: Build navigation tree
        NavCmd->>NavCmd: Calculate weights by level
        loop For each directory
            NavCmd->>NavCmd: Generate _index.md
            NavCmd->>FileSystem: Write _index.md
        end
        NavCmd-->>Git: Navigation regenerated
        Git->>Git: Stage updated content files
        Git->>Hugo: Continue with commit
    else not affected
        Git->>Hugo: Continue with commit
    end
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Source Control"
        MAIN[main branch<br/>Trunk-Based Dev]
        PROD_OSE[prod-oseplatform-web<br/>Deploy Only]
        PROD_AYO[prod-ayokoding-web<br/>Deploy Only]
        PROD_OL[prod-organiclever-web<br/>Deploy Only]
    end

    subgraph "Build System"
        NX_BUILD[Nx Build System<br/>Affected Detection]
        HUGO_BUILD[Hugo Build<br/>v0.156.0 Extended]
        NEXT_BUILD[Next.js Build<br/>Standalone Output]
        SPRING_BUILD[Spring Boot Build<br/>Maven]
        GO_BUILD[Go Build<br/>CLI Tools]
    end

    subgraph "Deployment Targets"
        VERCEL_OSE[Vercel<br/>oseplatform.com]
        VERCEL_AYO[Vercel<br/>ayokoding.com]
        VERCEL_OL[Vercel<br/>www.organiclever.com]
        LOCAL[Local Binary<br/>CLI Tools]
    end

    MAIN -->|Merge/Push| PROD_OSE
    MAIN -->|Merge/Push| PROD_AYO
    MAIN -->|Merge/Push| PROD_OL

    PROD_OSE --> HUGO_BUILD
    PROD_AYO --> HUGO_BUILD
    PROD_OL --> NEXT_BUILD
    MAIN --> GO_BUILD
    MAIN --> SPRING_BUILD

    HUGO_BUILD --> VERCEL_OSE
    HUGO_BUILD --> VERCEL_AYO
    NEXT_BUILD --> VERCEL_OL
    GO_BUILD --> LOCAL

    NX_BUILD -.->|Orchestrates| HUGO_BUILD
    NX_BUILD -.->|Orchestrates| NEXT_BUILD
    NX_BUILD -.->|Orchestrates| SPRING_BUILD
    NX_BUILD -.->|Orchestrates| GO_BUILD

    style MAIN fill:#0077b6,stroke:#03045e,color:#ffffff
    style PROD_OSE fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PROD_AYO fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PROD_OL fill:#2a9d8f,stroke:#264653,color:#ffffff
    style NX_BUILD fill:#6a4c93,stroke:#22223b,color:#ffffff
    style HUGO_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style NEXT_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style SPRING_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style GO_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style VERCEL_OSE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style VERCEL_AYO fill:#e76f51,stroke:#9d0208,color:#ffffff
    style VERCEL_OL fill:#e76f51,stroke:#9d0208,color:#ffffff
    style LOCAL fill:#6a4c93,stroke:#22223b,color:#ffffff
```

### Deployment Configuration

#### Vercel Deployment

**Hugo Static Sites** (oseplatform-web, ayokoding-web):

- **Build Framework**: `@vercel/static-build`
- **Build Script**: `build.sh` in each app directory
- **Output Directory**: `public/`
- **Hugo Version**: 0.156.0 (configured via environment variable)

**Security Headers (All Vercel Sites):**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Caching Strategy:**

- Static assets (css/js/fonts/images): 1 year immutable cache
- HTML pages: Standard caching

#### Environment Branches

- **Purpose**: Deployment triggers only
- **Branches**: `prod-oseplatform-web`, `prod-ayokoding-web`, `prod-organiclever-web`
- **Policy**: NEVER commit directly to these branches outside CI automation
- **Workflow**: Automated by scheduled GitHub Actions workflows (`deploy-ayokoding-web.yml`,
  `deploy-oseplatform-web.yml`, `deploy-organiclever-web.yml`) running at 6 AM and 6 PM WIB; or
  trigger manually from GitHub Actions UI

## CI/CD Pipeline

The platform uses a multi-layered quality assurance strategy combining local git hooks, GitHub Actions workflows (CI), and Nx caching. All continuous integration is handled through GitHub Actions.

### CI/CD Pipeline Overview

```mermaid
graph TB
    subgraph "Local Development"
        COMMIT[Git Commit]
        PRE_COMMIT[Pre-commit Hook]
        COMMIT_MSG[Commit-msg Hook]
        PUSH[Git Push]
        PRE_PUSH[Pre-push Hook]
    end

    subgraph "Remote CI - GitHub Actions"
        PR[Pull Request]
        FORMAT[PR Format Check]
        LINKS[PR Link Validation]
    end

    subgraph "Quality Gates"
        PRETTIER[Prettier Format]
        AYOKODING[AyoKoding Content Update]
        LINK_VAL[Link Validator]
        COMMITLINT[Commitlint]
        TEST_QUICK[Nx Affected Tests]
        MD_LINT[Markdown Lint]
    end

    subgraph "Deployment"
        MERGE[Merge to main]
        ENV_BRANCH[Environment Branch]
        VERCEL[Vercel Build & Deploy]
    end

    COMMIT --> PRE_COMMIT
    PRE_COMMIT --> AYOKODING
    PRE_COMMIT --> PRETTIER
    PRE_COMMIT --> LINK_VAL
    PRE_COMMIT --> COMMIT_MSG

    COMMIT_MSG --> COMMITLINT
    COMMITLINT --> PUSH

    PUSH --> PRE_PUSH
    PRE_PUSH --> TEST_QUICK
    PRE_PUSH --> MD_LINT

    PUSH --> PR
    PR --> FORMAT
    PR --> LINKS

    FORMAT --> PRETTIER
    LINKS --> LINK_VAL

    PR --> MERGE
    MERGE --> ENV_BRANCH
    ENV_BRANCH --> VERCEL

    style COMMIT fill:#0077b6,stroke:#03045e,color:#ffffff
    style PRE_COMMIT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style COMMIT_MSG fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PRE_PUSH fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PR fill:#6a4c93,stroke:#22223b,color:#ffffff
    style FORMAT fill:#6a4c93,stroke:#22223b,color:#ffffff
    style LINKS fill:#6a4c93,stroke:#22223b,color:#ffffff
    style PRETTIER fill:#457b9d,stroke:#1d3557,color:#ffffff
    style AYOKODING fill:#457b9d,stroke:#1d3557,color:#ffffff
    style LINK_VAL fill:#457b9d,stroke:#1d3557,color:#ffffff
    style COMMITLINT fill:#457b9d,stroke:#1d3557,color:#ffffff
    style TEST_QUICK fill:#457b9d,stroke:#1d3557,color:#ffffff
    style MD_LINT fill:#457b9d,stroke:#1d3557,color:#ffffff
    style MERGE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style ENV_BRANCH fill:#e76f51,stroke:#9d0208,color:#ffffff
    style VERCEL fill:#e76f51,stroke:#9d0208,color:#ffffff
```

### Git Hooks (Local Quality Gates)

#### Pre-commit Hook

**Location**: `.husky/pre-commit`

**Execution Order:**

1. **AyoKoding Content Processing** (if affected):
   - Rebuild ayokoding-cli binary
   - Update titles from filenames
   - Regenerate navigation structure
   - Auto-stage changes to `apps/ayokoding-web/content/`
2. **Prettier Formatting** (via lint-staged):
   - Format all staged files
   - Auto-stage formatted changes
3. **Link Validation**:
   - Validate markdown links in staged files only
   - Exit with error if validation fails

**Impact**: Ensures all committed code is formatted and content is processed

#### Commit-msg Hook

**Location**: `.husky/commit-msg`

**Validation**: Conventional Commits format via Commitlint

**Format**: `<type>(<scope>): <description>`

**Valid Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Impact**: Ensures consistent commit message format

#### Pre-push Hook

**Location**: `.husky/pre-push`

**Execution Order:**

1. **Nx Affected Tests**:
   - Run `test:quick` target for all affected projects
   - Only tests projects changed since last push
2. **Markdown Linting**:
   - Run markdownlint-cli2 on all markdown files
   - Exit with error if linting fails

**Impact**: Prevents pushing code that fails tests or has markdown violations

### GitHub Actions Workflows

#### PR Format Workflow

**File**: `.github/workflows/format-pr.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Steps:**

1. Checkout PR branch
2. Setup Volta (Node.js version manager)
3. Install dependencies
4. Detect changed files (JS/TS, JSON, MD, YAML, CSS, HTML)
5. Run Prettier on changed files
6. Auto-commit formatting changes if any

**Purpose**: Ensure all PR code is properly formatted even if local hooks were bypassed

#### PR Link Validation Workflow

**File**: `.github/workflows/validate-docs-links.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Steps:**

1. Checkout PR branch
2. Setup Go 1.26.0
3. Run link validation (`rhino-cli docs validate-links`)
4. Fail PR if broken links detected

**Purpose**: Prevent merging PRs with broken markdown links

#### Test and Deploy AyoKoding Web Workflow

**File**: `.github/workflows/deploy-ayokoding-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/ayokoding-web/` vs `prod-ayokoding-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, Go 1.26.0, Hugo 0.156.0 extended
3. Install dependencies and run `nx build ayokoding-web`
4. Force-push `main` to `prod-ayokoding-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for ayokoding.com with change detection to avoid unnecessary builds

#### Test and Deploy OSE Platform Web Workflow

**File**: `.github/workflows/deploy-oseplatform-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/oseplatform-web/` vs `prod-oseplatform-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, Go 1.26.0, Hugo 0.156.0 extended
3. Install dependencies and run `nx build oseplatform-web`
4. Force-push `main` to `prod-oseplatform-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for oseplatform.com with change detection to avoid unnecessary builds

#### Test and Deploy OrganicLever Web Workflow

**File**: `.github/workflows/deploy-organiclever-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/organiclever-web/` vs `prod-organiclever-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, install dependencies
3. Run `nx build organiclever-web`
4. Force-push `main` to `prod-organiclever-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for www.organiclever.com with change detection to avoid unnecessary builds

#### Main CI Workflow

**File**: `.github/workflows/main-ci.yml`

**Trigger**: Push to `main` branch

**Purpose**: Runs affected tests and quality checks on every push to main

#### PR Quality Gate Workflow

**File**: `.github/workflows/pr-quality-gate.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Purpose**: Runs affected tests and quality checks for pull requests

#### E2E OrganicLever Workflow

**File**: `.github/workflows/e2e-organiclever.yml`

**Trigger**: Push to `main` or pull request (when organiclever apps change)

**Purpose**: Runs Playwright E2E tests for organiclever-web and organiclever-be

### Nx Build System

**Caching Strategy:**

- **Cacheable Operations**: `build`, `test`, `lint`
- **Cache Location**: Local + Nx Cloud (if configured)
- **Affected Detection**: Compares against `main` branch

**Build Optimization:**

- **Affected Builds**: `nx affected -t build` only builds changed projects
- **Dependency Graph**: Automatically builds dependencies first
- **Parallel Execution**: Runs independent tasks concurrently

**Target Defaults:**

```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/dist"],
    "cache": true
  },
  "test": {
    "dependsOn": ["build"],
    "cache": true
  },
  "lint": {
    "cache": true
  }
}
```

## Development Workflow

### Standard Development Flow

1. **Start Development**:

   ```bash
   nx dev [project-name]
   ```

2. **Make Changes**:
   - Edit code/content
   - Test locally

3. **Commit Changes**:

   ```bash
   git add .
   git commit -m "type(scope): description"
   ```

   - Pre-commit hook runs:
     - Formats code with Prettier
     - Processes ayokoding-web content if affected
     - Validates links
   - Commit-msg hook validates format
   - Commit created

4. **Push to Remote**:

   ```bash
   git push origin main
   ```

   - Pre-push hook runs:
     - Tests affected projects
     - Lints markdown

5. **Create Pull Request** (if using PR workflow):
   - GitHub Actions run:
     - Format check
     - Link validation
   - Review and merge

6. **Deploy** (for Hugo sites):

   ```bash
   git checkout prod-[app-name]
   git merge main
   git push origin prod-[app-name]
   ```

   - Vercel automatically builds and deploys

### Quality Assurance Layers

```mermaid
graph TB
    CODE[Code Changes]

    subgraph "Layer 1: Local Hooks"
        L1_FORMAT[Prettier<br/>Auto-fix]
        L1_CONTENT[Content Processing<br/>Auto-fix]
        L1_LINKS[Link Validation<br/>Block]
        L1_COMMIT[Commitlint<br/>Block]
        L1_TEST[Tests<br/>Block]
        L1_MD[Markdown Lint<br/>Block]
    end

    subgraph "Layer 2: GitHub Actions"
        L2_FORMAT[PR Format<br/>Auto-fix]
        L2_LINKS[PR Links<br/>Block]
    end

    subgraph "Layer 3: Nx Caching"
        L3_BUILD[Smart Builds<br/>Affected Only]
        L3_CACHE[Task Cache<br/>Skip Unchanged]
    end

    DEPLOY[Deployment]

    CODE --> L1_FORMAT
    L1_FORMAT --> L1_CONTENT
    L1_CONTENT --> L1_LINKS
    L1_LINKS --> L1_COMMIT
    L1_COMMIT --> L1_TEST
    L1_TEST --> L1_MD

    L1_MD --> L2_FORMAT
    L2_FORMAT --> L2_LINKS

    L2_LINKS --> L3_BUILD
    L3_BUILD --> L3_CACHE
    L3_CACHE --> DEPLOY

    style CODE fill:#0077b6,stroke:#03045e,color:#ffffff
    style L1_FORMAT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style L1_CONTENT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style L1_LINKS fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_COMMIT fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_TEST fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_MD fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L2_FORMAT fill:#6a4c93,stroke:#22223b,color:#ffffff
    style L2_LINKS fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L3_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style L3_CACHE fill:#457b9d,stroke:#1d3557,color:#ffffff
    style DEPLOY fill:#2a9d8f,stroke:#264653,color:#ffffff
```

### Quality Gate Categories

**Auto-fix Gates** (Non-blocking with automatic fixes):

- Prettier formatting
- AyoKoding content processing
- PR format workflow

**Blocking Gates** (Must pass to proceed):

- Link validation (pre-commit, PR)
- Commitlint format check
- Affected tests (pre-push)
- Markdown linting (pre-push)

## Technology Stack Summary

### Frontend

**Static Sites** (Hugo):

- **Hugo**: 0.156.0 Extended
- **Themes**: PaperMod (oseplatform-web), Hextra (ayokoding-web)
- **Deployment**: Vercel
- **Applications**: oseplatform-web, ayokoding-web

**Web Applications** (Next.js):

- **Next.js**: 16 (App Router)
- **React**: 19
- **Styling**: TailwindCSS + Radix UI / shadcn-ui
- **Deployment**: Vercel
- **Applications**: organiclever-web

### Backend

**REST API** (Spring Boot):

- **Framework**: Spring Boot
- **Language**: Java
- **Build**: Maven
- **Testing**: JaCoCo (>=95% coverage), MockMvc integration tests
- **Applications**: organiclever-be

### CLI Tools

- **Language**: Go 1.26
- **Build**: Native Go toolchain via Nx
- **Distribution**: Local binaries
- **Applications**: ayokoding-cli, rhino-cli, oseplatform-cli

### Infrastructure

- **Monorepo**: Nx workspace
- **Node.js**: 24.13.1 LTS (Volta-managed)
- **Package Manager**: npm 11.10.1
- **Git Workflow**: Trunk-Based Development
- **CI**: GitHub Actions
- **CD**: Vercel (Hugo sites, Next.js apps)

### Quality Tools

- **Formatting**: Prettier 3.6.2
- **Markdown Linting**: markdownlint-cli2 0.21.0
- **Link Validation**: rhino-cli docs validate-links (Go)
- **Commit Linting**: Commitlint + Conventional Commits
- **Git Hooks**: Husky + lint-staged
- **Testing**: Nx test orchestration

## Future Architecture Considerations

### Future Additions

- **Shared Libraries**: TypeScript, Go, Python libs in `libs/`
- **Additional Applications**: More domain-specific enterprise apps
- **Backend Services**: Sharia-compliant business logic services
- **Authentication Service**: Centralized auth for all applications
- **Observability Stack**:
  - Metrics: Prometheus + Grafana
  - Logging: ELK/Loki stack
  - Tracing: Jaeger/Tempo

### Scalability Considerations

- **Nx Cloud**: Distributed task execution and caching
- **CDN**: Static asset delivery optimization (currently Vercel for Hugo sites)
- **Additional Hugo Sites**: More specialized content platforms
- **CLI Tool Suite Expansion**: More specialized automation tools
- **Shared Go Modules**: Common functionality across CLI tools

## Related Documentation

- **Monorepo Structure**: [docs/reference/re\_\_monorepo-structure.md](./re__monorepo-structure.md)
- **Adding New Apps**: [docs/how-to/hoto\_\_add-new-app.md](../how-to/hoto__add-new-app.md)
- **Git Workflow**: [governance/development/workflow/commit-messages.md](../../governance/development/workflow/commit-messages.md)
- **Markdown Quality**: [governance/development/quality/markdown.md](../../governance/development/quality/markdown.md)
- **Trunk-Based Development**: [governance/development/workflow/trunk-based-development.md](../../governance/development/workflow/trunk-based-development.md)
- **Repository Architecture**: [governance/repository-governance-architecture.md](../../governance/repository-governance-architecture.md)
