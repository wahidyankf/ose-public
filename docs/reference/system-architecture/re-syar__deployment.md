---
title: Deployment Architecture
description: Deployment architecture, environment branches, and Vercel configuration
category: reference
tags:
  - architecture
  - deployment
  - vercel
created: 2025-11-29
updated: 2026-03-06
---

# Deployment Architecture

Deployment architecture, environment branches, and Vercel configuration for the Open Sharia Enterprise platform.

## Deployment Diagram

```mermaid
graph TB
    subgraph "Source Control"
        MAIN[main branch<br/>Trunk-Based Dev]
        PROD_OSE[prod-oseplatform-web<br/>Deploy Only]
        PROD_AYO[prod-ayokoding-web<br/>Deploy Only - Next.js]
        PROD_OL[prod-organiclever-fe<br/>Deploy Only]
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
    PROD_AYO --> NEXT_BUILD
    PROD_OL --> NEXT_BUILD
    MAIN --> GO_BUILD
    MAIN --> SPRING_BUILD

    HUGO_BUILD --> VERCEL_OSE
    NEXT_BUILD --> VERCEL_AYO
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

## Deployment Configuration

### Vercel Deployment

**Hugo Static Sites** (oseplatform-web):

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

### Environment Branches

- **Purpose**: Deployment triggers only
- **Branches**: `prod-oseplatform-web`, `prod-ayokoding-web`, `prod-organiclever-fe`
- **Policy**: NEVER commit directly to these branches outside CI automation
- **Workflow**: Automated by scheduled GitHub Actions workflows (`test-and-deploy-ayokoding-web.yml`,
  `test-and-deploy-oseplatform-web.yml`, `deploy-organiclever-fe.yml`) running at 6 AM and 6 PM WIB; or
  trigger manually from GitHub Actions UI
