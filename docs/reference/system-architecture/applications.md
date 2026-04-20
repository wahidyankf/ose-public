---
title: Applications & Containers
description: Application inventory and C4 Level 2 container diagram
category: reference
tags:
  - architecture
  - applications
  - c4-model
created: 2025-11-29
updated: 2026-04-19
---

# Applications & Containers

Application inventory and C4 Level 2 container diagram for the Open Sharia Enterprise platform.

## Applications Inventory

The platform consists of the following applications across its technology stacks:

### Web Applications (Next.js)

#### oseplatform-web

- **Purpose**: Marketing and documentation website for OSE Platform
- **URL**: <https://oseplatform.com>
- **Technology**: Next.js 16 (App Router) + TypeScript + tRPC
- **Deployment**: Vercel (via `prod-oseplatform-web` branch)
- **Build Command**: `nx build oseplatform-web`
- **Dev Command**: `nx dev oseplatform-web`
- **Location**: `apps/oseplatform-web/`

#### ayokoding-web

- **Purpose**: Educational platform for programming, AI, and security
- **URL**: <https://ayokoding.com>
- **Technology**: Next.js 16 (App Router) + TypeScript + tRPC
- **Languages**: Bilingual (default English)
- **Deployment**: Vercel (via `prod-ayokoding-web` branch)
- **Build Command**: `nx build ayokoding-web`
- **Dev Command**: `nx dev ayokoding-web`
- **Location**: `apps/ayokoding-web/`
- **Content**: Co-located at `apps/ayokoding-web/content/`

#### wahidyankf-web

- **Purpose**: Personal portfolio site for Wahidyan Kresna Fridayoka
- **URL**: <https://www.wahidyankf.com>
- **Technology**: Next.js 16 (App Router) + TypeScript
- **Deployment**: Vercel (via `prod-wahidyankf-web` branch)
- **Build Command**: `nx build wahidyankf-web`
- **Dev Command**: `nx dev wahidyankf-web`
- **Dev Port**: 3201
- **Location**: `apps/wahidyankf-web/`

### CLI Tools (Go)

#### ayokoding-cli

- **Purpose**: Link validation for ayokoding-web content
- **Language**: Go 1.26
- **Build Command**: `nx build ayokoding-cli`
- **Location**: `apps/ayokoding-cli/`
- **Features**:
  - Link validation for ayokoding-web content
- **Usage**: Runs as part of ayokoding-web quality checks

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

### OrganicLever Applications

#### organiclever-fe

- **Purpose**: Landing site for OrganicLever — local-first mode; BE integration deferred
- **URL**: <https://www.organiclever.com>
- **Technology**: Next.js 16 (App Router) + React 19 + TailwindCSS
- **Deployment**: Vercel (via `prod-organiclever-web` branch)
- **Build Command**: `nx build organiclever-fe`
- **Dev Command**: `nx dev organiclever-fe`
- **Location**: `apps/organiclever-fe/`
- **Features**:
  - Static landing page at `/` (no network dependency)
  - `/system/status/be` diagnostic page (probes `ORGANICLEVER_BE_URL` at request time)
  - Dormant Effect TS service layer preserved for future BE rewire
  - Radix UI / shadcn-ui component library
  - Production Dockerfile with standalone output

### Backend Services

#### organiclever-be

- **Purpose**: REST API backend for OrganicLever (F#/Giraffe implementation)
- **Technology**: F# + Giraffe + .NET
- **Build Command**: `nx build organiclever-be`
- **Dev Command**: `nx dev organiclever-be`
- **Location**: `apps/organiclever-be/`
- **Features**:
  - AltCover code coverage enforcement (>=90%)
  - Production Dockerfile with multi-stage build
  - OpenAPI 3.1 contract-first development

### E2E Test Suites (Playwright)

#### oseplatform-web-fe-e2e

- **Purpose**: Frontend E2E tests for oseplatform-web UI
- **Technology**: Playwright
- **Run Command**: `nx run oseplatform-web-fe-e2e:test:e2e`
- **Location**: `apps/oseplatform-web-fe-e2e/`

#### oseplatform-web-be-e2e

- **Purpose**: Backend E2E tests for oseplatform-web tRPC API
- **Technology**: Playwright
- **Run Command**: `nx run oseplatform-web-be-e2e:test:e2e`
- **Location**: `apps/oseplatform-web-be-e2e/`

#### ayokoding-web-fe-e2e

- **Purpose**: Frontend E2E tests for ayokoding-web UI
- **Technology**: Playwright
- **Run Command**: `nx run ayokoding-web-fe-e2e:test:e2e`
- **Location**: `apps/ayokoding-web-fe-e2e/`

#### ayokoding-web-be-e2e

- **Purpose**: Backend E2E tests for ayokoding-web tRPC API
- **Technology**: Playwright
- **Run Command**: `nx run ayokoding-web-be-e2e:test:e2e`
- **Location**: `apps/ayokoding-web-be-e2e/`

#### wahidyankf-web-fe-e2e

- **Purpose**: Frontend E2E tests for wahidyankf-web UI (Playwright-BDD)
- **Technology**: Playwright-BDD
- **Run Command**: `nx run wahidyankf-web-fe-e2e:test:e2e`
- **Location**: `apps/wahidyankf-web-fe-e2e/`

#### organiclever-fe-e2e

- **Purpose**: End-to-end tests for organiclever-fe
- **Technology**: Playwright
- **Run Command**: `nx run organiclever-fe-e2e:test:e2e`
- **Location**: `apps/organiclever-fe-e2e/`

#### organiclever-be-e2e

- **Purpose**: End-to-end tests for organiclever-be REST API
- **Technology**: Playwright
- **Run Command**: `nx run organiclever-be-e2e:test:e2e`
- **Location**: `apps/organiclever-be-e2e/`

## C4 Level 2: Container Diagram

Shows the high-level technical building blocks (containers) of the system. In C4 terminology, a "container" is a deployable/executable unit (web app, database, file system, etc.), not a Docker container.

```mermaid
graph TB
    subgraph "Marketing & Education Sites"
        OSE[oseplatform-web<br/>Next.js App]
        AYO[ayokoding-web<br/>Next.js App]
        WKF[wahidyankf-web<br/>Next.js App]
    end

    subgraph "OrganicLever Platform"
        OL_FE[organiclever-fe<br/>Next.js App]
        OL_BE[organiclever-be<br/>F#/Giraffe API]
        OL_FE_E2E[organiclever-fe-e2e<br/>Playwright E2E]
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

    AYOCLI -->|Validates links| AYO
    RHINO -->|Repository automation| NX
    OSECLI -->|Validates links| OSE
    OL_FE_E2E -->|Tests| OL_FE
    OL_BE_E2E -->|Tests| OL_BE

    NX -.->|Manages| OSE
    NX -.->|Manages| AYO
    NX -.->|Manages| WKF
    NX -.->|Manages| AYOCLI
    NX -.->|Manages| RHINO
    NX -.->|Manages| OL_FE
    NX -.->|Manages| OL_BE

    OSE -.->|May import| LIBS
    AYO -.->|May import| LIBS

    style OSE fill:#0077b6,stroke:#03045e,color:#ffffff
    style AYO fill:#0077b6,stroke:#03045e,color:#ffffff
    style WKF fill:#0077b6,stroke:#03045e,color:#ffffff
    style OL_FE fill:#0077b6,stroke:#03045e,color:#ffffff
    style OL_BE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style OL_FE_E2E fill:#457b9d,stroke:#1d3557,color:#ffffff
    style OL_BE_E2E fill:#457b9d,stroke:#1d3557,color:#ffffff
    style AYOCLI fill:#2a9d8f,stroke:#264653,color:#ffffff
    style RHINO fill:#2a9d8f,stroke:#264653,color:#ffffff
    style OSECLI fill:#2a9d8f,stroke:#264653,color:#ffffff
    style NX fill:#6a4c93,stroke:#22223b,color:#ffffff
    style LIBS fill:#457b9d,stroke:#1d3557,color:#ffffff
```

## Application Interactions

**Independent Application Suites:**

Marketing & Education Sites:

- oseplatform-web: Next.js 16 content platform
- ayokoding-web: Next.js fullstack content platform (with CLI link validation)
- wahidyankf-web: Next.js 16 personal portfolio

CLI Tools:

- ayokoding-cli: Validates links in ayokoding-web content
- rhino-cli: Repository management automation

**Build-Time Dependencies:**

- All applications managed by Nx workspace
- CLI tools executed during build processes
- Shared libraries may be imported at build time via `@open-sharia-enterprise/[lib-name]`

**Link Validation Pipeline (ayokoding-web):**

ayokoding-cli validates internal links in ayokoding-web content as part of the quality gate.
Content is co-located at `apps/ayokoding-web/content/` and served by the Next.js application.
