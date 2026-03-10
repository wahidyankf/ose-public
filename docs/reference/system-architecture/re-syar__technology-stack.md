---
title: Technology Stack
description: Technology stack summary, quality tools, and future architecture considerations
category: reference
tags:
  - architecture
  - technology
  - tooling
created: 2025-11-29
updated: 2026-03-06
---

# Technology Stack

Technology stack summary, quality tools, and future architecture considerations for the Open Sharia Enterprise platform.

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
- **Testing**: JaCoCo (>=90% coverage), MockMvc integration tests
- **Applications**: demo-be-jasb

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

- **Monorepo Structure**: [docs/reference/re\_\_monorepo-structure.md](../re__monorepo-structure.md)
- **Adding New Apps**: [docs/how-to/hoto\_\_add-new-app.md](../../how-to/hoto__add-new-app.md)
- **Git Workflow**: [governance/development/workflow/commit-messages.md](../../../governance/development/workflow/commit-messages.md)
- **Markdown Quality**: [governance/development/quality/markdown.md](../../../governance/development/quality/markdown.md)
- **Trunk-Based Development**: [governance/development/workflow/trunk-based-development.md](../../../governance/development/workflow/trunk-based-development.md)
- **Repository Architecture**: [governance/repository-governance-architecture.md](../../../governance/repository-governance-architecture.md)
