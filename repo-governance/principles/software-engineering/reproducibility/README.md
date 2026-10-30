---
description: "Development environments and builds should be reproducible from the start"
when_to_use: "Read this index to find the right Reproducibility First child document."
---

# Reproducibility First

- [Vision Supported](./vision-supported.md) — Explains how reproducibility serves the Open Sharia Enterprise Vision by letting global contributors work from identical, frictionless environments. Use when explaining why reproducible environments matter for lowering contribution barriers to Islamic enterprise development.
- [What](./what.md) — Defines reproducibility and non-reproducibility and contrasts their environment, build, and documentation characteristics. Use when clarifying the precise meaning of "reproducible environment" before applying the principle.
- [Why](./why.md) — Lists the benefits of reproducibility, the problems non-reproducibility causes, and when reproducibility should be applied versus where variance is acceptable. Use when justifying investment in version pinning or environment automation in a design discussion or code review.
- [How It Applies](./how-it-applies.md) — Shows reproducible patterns for Volta-based version pinning, lockfile-based dependency installs, and explicit dependency version ranges. Use when pinning a runtime version or dependency and needing a concrete reproducible-versus-floating example.
- [How It Applies — Environment, Containers, and Setup Docs](./how-it-applies-environment-containers-and-setup-docs.md) — Shows reproducible patterns for environment variable configuration, Compose service definitions, and documented setup steps. Use when configuring environment variables, containerizing a multi-service local setup, or writing onboarding setup instructions.
- [Anti-Patterns](./anti-patterns.md) — Catalogs common reproducibility anti-patterns — "works on my machine", floating dependencies, undocumented system dependencies, and manual setup — with fixes. Use when diagnosing an environment-specific bug or refactoring an undocumented manual setup process.
- [PASS: Best Practices](./pass-best-practices.md) — Summarizes seven concrete best practices for reproducible environments, from pinning runtimes to using deterministic build tools. Use as a quick checklist when setting up or auditing a project's environment and build reproducibility.
- [Example from This Repository](./example-from-this-repository.md) — Demonstrates this repository's own Volta pinning, committed lockfile, documented setup, and automated git hooks as evidence of reproducibility. Use when pointing to a concrete, working example of reproducibility already applied in this repository.
- [Relationship to Other Principles](./relationship-to-other-principles.md) — Links reproducibility to the automation-over-manual, explicit-over-implicit, and simplicity-over-complexity principles it supports. Use when tracing how reproducibility connects to other repository-wide software engineering principles.
- [Related Conventions](./related-conventions.md) — Links to the reproducible environments and code quality conventions that operationalize this principle. Use when looking for the concrete conventions that enforce or implement reproducibility in this repository.
- [References](./references.md) — Lists external references on version management tools, dependency locking, containerization, and build reproducibility. Use when seeking further reading on version manager tooling or reproducible build practices.
