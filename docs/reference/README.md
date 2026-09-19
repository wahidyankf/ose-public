---
title: "Reference"
description: Precise technical reference for the OSE platform, Nx workspace, quality gates, and supporting systems
category: reference
tags:
  - index
  - reference
  - technical
created: 2025-11-22
---

# Reference

Use this section when you need a durable fact about OSE Public rather than a guided task. It maps the
platform, the Nx workspace, and the engineering systems that support an early product.

## Start with the workspace

- [Monorepo Structure](./monorepo-structure.md) — learn where applications, libraries, and shared
  repository assets live.
- [System Architecture](./system-architecture/README.md) — see the current platform shape, its
  applications, components, deployment approach, and CI/CD model.
- [Project Dependency Graph](./project-dependency-graph.md) — trace project dependencies and their
  related specifications.
- [Nx Configuration](./nx-configuration.md) — understand workspace configuration, task caching, and
  build-system settings.
- [Web Sites](./web-sites.md) — find every deployable app's domain, dev port, and production deploy
  branch.

## Build and verify with confidence

- [Code Coverage](./code-coverage.md) — check how coverage is measured, validated, and reported for
  workspace projects.
- [SDLC Gate Standard](./sdlc-gate-standard.md) — understand the target gate sequence and permitted
  differences across the OSE repositories.

## Security and agent infrastructure

- [Security Reference](./security/README.md) — navigate security frameworks and compliance source
  material, including NIST SP 800-53 Rev. 5.
- [Security Waivers and Functional Holds](./security-waivers.md) — consult the persistent register of
  approved dependency-security exceptions and functional holds.
- [Platform Bindings](./platform-bindings.md) — locate the AI coding-agent bindings, root
  instructions, and generated translation artifacts. Its Platform Binding Directories table and
  verification stamp are maintained with the declared harness ownership; do not hand-edit generated adapter output.
- [AI Model Benchmarks](./ai-model-benchmarks.md) — review the sourced benchmark and pricing data
  behind agent model-tier decisions.

## Understand the wider OSE ecosystem

- [Related Repositories](./related-repositories.md) — the OSE Code Repositories catalogue:
  distinguish OSE Public from its parity sibling and from the independent RHINO, HIPPO, and
  BeaverNest repositories, and find the right home for a question or pattern.
