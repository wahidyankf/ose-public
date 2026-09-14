---
title: Deployment Architecture
description: Deployment architecture, environment branches, and Vercel configuration
category: reference
tags:
  - architecture
  - deployment
  - vercel
created: 2025-11-29
---

# Deployment Architecture

Deployment architecture, environment branches, and Vercel configuration for the Open Sharia Enterprise platform.

## Deployment Diagram

```mermaid
graph LR
    accTitle: Deployment Diagram
    accDescr: main branch Trunk-Based Dev leads to prod-ose-www Deploy Only via Merge/Push; main branch Trunk-Based Dev leads to prod-ayokoding-www Deploy Only - Next.js via Merge/Push; and 13 more links.
    subgraph "Source Control"
        MAIN[main branch<br/>Trunk-Based Dev]
        PROD_OSE[prod-ose-www<br/>Deploy Only]
        PROD_AYO[prod-ayokoding-www<br/>Deploy Only -<br/>Next.js]
        PROD_OL[prod-<br/>organiclever-www<br/>Deploy Only]
    end

    subgraph "Build System"
        NX_BUILD[Nx Build System<br/>Affected Detection]
        NEXT_BUILD[Next.js Build<br/>Standalone Output]
        SPRING_BUILD[Spring Boot Build<br/>Maven]
        RUST_BUILD[Rust Build<br/>CLI Tools]
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

    PROD_OSE --> NEXT_BUILD
    PROD_AYO --> NEXT_BUILD
    PROD_OL --> NEXT_BUILD
    MAIN --> RUST_BUILD
    MAIN --> SPRING_BUILD

    NEXT_BUILD --> VERCEL_OSE
    NEXT_BUILD --> VERCEL_AYO
    NEXT_BUILD --> VERCEL_OL
    RUST_BUILD --> LOCAL

    NX_BUILD -.->|Orchestrates| NEXT_BUILD
    NX_BUILD -.->|Orchestrates| SPRING_BUILD
    NX_BUILD -.->|Orchestrates| RUST_BUILD

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    class MAIN blue
    class PROD_OSE,PROD_AYO,PROD_OL teal
    class NX_BUILD,LOCAL purple
    class NEXT_BUILD,SPRING_BUILD,RUST_BUILD brown
    class VERCEL_OSE,VERCEL_AYO,VERCEL_OL orange
```

## Deployment Configuration

### Vercel Deployment

**Next.js Sites** (ose-www, ayokoding-www, organiclever-www):

- **Build Framework**: Next.js (standalone output)
- **Build Command**: `next build`
- **Output Directory**: `.next/`

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
- **Branches**: `prod-ose-www`, `prod-ayokoding-www`, `stag-organiclever-app-web`, `stag-organiclever-be`
- **Policy**: NEVER commit directly to these branches outside CI automation
- **Workflows** (here, "deploy" means a **branch force-push** — Vercel builds web from the pushed branch;
  a be-build-deploy workflow fires for backends):
  - `ayokoding-www-test-local-deploy-prod.yml` (6 AM / 6 PM WIB) → `prod-ayokoding-www`
  - `ose-www-test-local-deploy-prod.yml` (6 AM / 6 PM WIB) → `prod-ose-www`
  - `organiclever-app-test-local-deploy-stag.yml` (3 AM / 3 PM WIB) → `stag-organiclever-app-web`
    and `stag-organiclever-be` (deploys to **staging**, not production)
  - `organiclever-app-test-stag.yml` (+2.5h after the stag deploy) — gated FE E2E
    against the staging URL; **stops on pass without promoting**. Production continuous delivery
    is deferred to a separate plan, so no production-CD workflow exists yet.
  - All workflows can also be triggered manually from the GitHub Actions UI
