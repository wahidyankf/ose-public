---
description: Canonical logical-owner-corpus directory structure for specs/ — Gherkin feature files, as-built architecture documents, and OpenAPI contracts
when_to_use: Read this when placing a Gherkin feature file, C4 diagram, DDD artifact, or OpenAPI contract, or when scaffolding specs/ for a new app or library.
---

# Specs Directory Structure Convention

The `specs/` directory contains all behavioural specifications (Gherkin feature files), architectural diagrams (C4), domain design artifacts (DDD), and API contracts (OpenAPI) for the monorepo. This convention codifies the canonical logical-owner-corpus directory structure that all projects must follow.

The authoritative combined convention — covering what content belongs in app READMEs vs `specs/`, the corpus tree shape, PM-readability requirements, and BDD/DDD/Contracts adoption expectations — is [App README vs Specs Convention](../structure/app-readme-vs-specs.md). This document describes the canonical path patterns and domain subdirectory rules within the `behaviour/` tree in detail, and defines how the overall spec tree is organized.

## In This Convention

- [Principles, Conventions, and Purpose](./specs-directory-structure/principles-conventions-and-purpose.md) — The core principles and sibling conventions this directory-structure convention implements, and why the canonical corpus layout...
- [Scope](./specs-directory-structure/scope.md) — what this convention covers versus delegates elsewhere
- [Canonical App Spec Tree](./specs-directory-structure/canonical-app-spec-tree.md) — the corpus layout, entry purposes, and per-surface variants
- [Gherkin Feature File Placement and Lib Spec Structure](./specs-directory-structure/gherkin-feature-file-placement-and-lib-spec-structure.md) — canonical path pattern and domain-subdirectory rules
- [Logical Owner Corpus](./specs-directory-structure/logical-owner-corpus.md) — the adopted one-corpus-per-owner shape, its three required entries, and how a product's shape is detected
- [Full Directory Structure and README Index Files](./specs-directory-structure/full-directory-structure-and-readme-index-files.md) — The complete specs/ tree layout, which subdirectories each project surface profile actually has, and the README.md...
- [Migration Path (Flat-Root to C4-Aware)](./specs-directory-structure/migration-path.md) — The atomic-commit procedure and path mapping for migrating an existing flat-root spec tree to the canonical...
- [Adding New Specs](./specs-directory-structure/adding-new-specs.md) — procedures for a new feature file, new project, or new lib
- [Deterministic Validation: Allowlist-Driven App Selection](./specs-directory-structure/deterministic-validation-allowlist-code-lang-multi-perspective-severity.md) — The the retired spec validation surface validation commands, the allowlist-driven default app selection, and the code_lang/gherkin/severity-downgrade fields DDD validators...
- [Deterministic Validation: Orphan Checks, Combined Scopes, Drift Detection](./specs-directory-structure/deterministic-validation-orphan-checks-combined-scopes-relationship-symmetry-drift.md) — The reverse-direction step orphan check, combined multi-perspective coverage runs, DDD relationship symmetry checks, and the current...
- [Pre-Push/CI Gating, LLM Semantic Validation, Deterministic Offload, Manual Checklist, and Related Documentation](./specs-directory-structure/pre-push-ci-llm-validation-deterministic-offload-and-related-documentation.md) — The four gating surfaces that run specs validation, the LLM-driven semantic-validation layer, the deterministic-vs-LLM reasoning split...
