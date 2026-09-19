---
title: Technology Stack
description: Technology stack summary, quality tools, and future architecture considerations
category: reference
tags:
  - architecture
  - technology
  - tooling
created: 2025-11-29
---

# Technology Stack

Technology stack summary, quality tools, and future architecture considerations for the Open Sharia Enterprise platform.

## Technology Stack Summary

### Frontend

**Web Applications** (Next.js):

- **Next.js**: 16 (App Router)
- **React**: 19
- **Styling**: TailwindCSS + Radix UI / shadcn-ui
- **Deployment**: Vercel
- **Applications**: ose-www, organiclever-www, organiclever-app-web, ayokoding-www (with tRPC backend)

### Backend

**REST API** (F#/Giraffe):

- **Framework**: Giraffe (ASP.NET Core)
- **Language**: F# (.NET 10)
- **Build**: dotnet via Nx
- **Testing**: NUnit / xUnit + Testcontainers (>=99% Unit line coverage)
- **Applications**: organiclever-be, ose-be

### CLI Tools

**F# CLI Tools**:

- **Language**: F# (.NET 10)
- **Build**: dotnet via Nx
- **Distribution**: Local binaries
- **Applications**: Rhino (Repository Hygiene & INtegration Orchestrator, ported from Rust
  2026-08-30), crane-cli (Content Retrieval And Normalization Engine)

### Infrastructure

- **Monorepo**: Nx workspace
- **Node.js**: 24.13.1 LTS (Volta-managed)
- **Package Manager**: npm 11.10.1
- **Git Workflow**: Trunk-Based Development
- **CI**: GitHub Actions
- **CD**: Vercel (Next.js apps)

### Quality Tools

- **Formatting**: Prettier 3.6.2
- **Markdown Linting**: markdownlint-cli2 0.21.0
- **Link Validation**: ./rhino md links validate (F#)
- **Commit Linting**: Commitlint + Conventional Commits
- **Git Hooks**: Husky + lint-staged
- **Testing**: Nx test orchestration

## Future Architecture Considerations

### Future Additions

- **Shared Libraries**: TypeScript, Rust, F# libs in `libs/`
- **Additional Applications**: More domain-specific enterprise apps
- **Backend Services**: Sharia-compliant business logic services
- **Authentication Service**: Centralized auth for all applications
- **Observability Stack**:
  - Metrics: Prometheus + Grafana
  - Logging: ELK/Loki stack
  - Tracing: Jaeger/Tempo

### Scalability Considerations

- **Nx Cloud**: Distributed task execution and caching
- **CDN**: Static asset delivery optimization (currently Vercel for Next.js sites)
- **Additional Next.js Sites**: More specialized content platforms
- **CLI Tool Suite Expansion**: More specialized automation tools
- **Shared Rust Crates**: Common functionality across Rust CLI tools

## Related Documentation

- **Monorepo Structure**: [docs/reference/monorepo-structure.md](../monorepo-structure.md)
- **Adding New Apps**: [docs/how-to/add-new-app.md](../../how-to/add-new-app.md)
- **Git Workflow**: [repo-governance/development/workflow/commit-messages.md](../../../repo-governance/development/workflow/commit-messages.md)
- **Markdown Quality**: [repo-governance/development/quality/markdown.md](../../../repo-governance/development/quality/markdown.md)
- **Trunk-Based Development**: [repo-governance/development/workflow/trunk-based-development.md](../../../repo-governance/development/workflow/trunk-based-development.md)
- **Repository Architecture**: [repo-governance/repository-governance-architecture.md](../../../repo-governance/repository-governance-architecture.md)
