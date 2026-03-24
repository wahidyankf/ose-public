---
title: Components & Code Architecture
description: C4 Level 3 component diagrams and Level 4 code architecture
category: reference
tags:
  - architecture
  - c4-model
  - components
created: 2025-11-29
updated: 2026-03-06
---

# Components & Code Architecture

C4 Level 3 component diagrams and Level 4 code architecture for the Open Sharia Enterprise platform.

## C4 Level 3: Component Diagrams

Shows the internal components within each container. Components are groupings of related functionality behind a well-defined interface.

### oseplatform-web Components (Hugo Static Site)

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

### ayokoding-cli Components (Go CLI Tool)

**Component Responsibilities:**

- **Root Command**: CLI entry point, command routing, help text
- **Links Check Command**: Validate internal links in ayokoding-web content

### rhino-cli Components (Go CLI Tool)

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

### ayokoding-web Components (Next.js Fullstack Platform)

**Component Responsibilities:**

- **Next.js App Router**: Static generation and routing for educational content
- **tRPC API**: Backend API for content retrieval, search, and navigation
- **Content Directory**: Co-located markdown content at `apps/ayokoding-web/content/`
- **Bilingual Support**: Default English with Indonesian content

## C4 Level 4: Code Architecture

Shows implementation details for critical components. Focus on Go CLI tool package structures and key implementation patterns.

### ayokoding-cli Package Structure (Go)

ayokoding-cli now provides only `links check` for validating internal links in ayokoding-web content. The title update and navigation regeneration commands were removed as part of the migration from Hugo to Next.js.
