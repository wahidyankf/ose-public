Posted: Saturday, March 22, 2026
Platform: LinkedIn

---

OPEN SHARIA ENTERPRISE
Week 0018, Phase 1 Week 6

---

Phase 1 Week 6: 3 Frontends, Full Gherkin Compliance, Nx Graph Audit

Last week: 11 backends, 1 frontend, no shared API contract. This week: OpenAPI contract with codegen for all 14 apps, 2 new frontends, and the entire Nx dependency graph audited and fixed.

**What changed since last week:**

API Contract: demo-contracts (NEW)

- OpenAPI 3.1 specification covering all demo app endpoints (auth, users, expenses, admin, health).
- Codegen generates language-specific types for all 14 demo apps (11 backends + 3 frontends).
- Contract violations caught at compile time via typecheck dependency on codegen.

Frontends: 1 -> 3 (all Gherkin-compliant)

- demo-fe-ts-tanstack-start (NEW): TanStack Router SPA. Full auth, expenses, admin. All 15 FE features, 92 scenarios covered. 76% coverage.
- demo-fe-dart-flutterweb (NEW): Pure Dart Web app using package:web (no Flutter widgets in VM). Built an in-memory ServiceClient for BDD tests. All 15 features, 92 scenarios. 89% coverage.
- demo-fe-ts-nextjs: Was already compliant at 74% coverage. Unchanged.

Backend Unit Tests: HTTP -> Service-Layer

Refactored 4 backends (Go/Gin, Rust/Axum, Python/FastAPI, TypeScript/Effect) to call service functions directly instead of making HTTP calls in unit tests. Now all 11 backends match the three-level testing standard: mocked deps, no HTTP, Gherkin-driven.

Nx Dependency Graph: Unaudited -> 30 projects, 68 edges, 0 cycles

Previously, the Nx graph was missing many real dependencies. Deep audit found and fixed:

- demo-contracts (new this week) wired into Nx graph with 18 dependents via implicitDependencies.
- rhino-cli missing from 10 projects that invoke it for coverage validation.
- Frontend Gherkin spec inputs missing from all 3 frontends and 3 E2E projects.
- Codegen lib dependencies (elixir-openapi-codegen, clojure-openapi-codegen) undeclared.
- One circular dependency found and resolved (golang-commons <-> rhino-cli).
- Created docs/reference/re\_\_project-dependency-graph.md with full Mermaid diagram.

C4 Architecture Docs: Updated

All 5 C4 diagrams (context, container, component-be, component-fe, README) now include:

- All 11 backend and 3 frontend implementations with CI workflows
- Gherkin coverage mapped per component
- API contract and three-level testing details
- CI pipeline actors

CI: 1 -> 3 frontend Codecov uploads

- Added Codecov coverage upload for TanStack Start and Flutter Web.
- Fixed E2E navigation race condition (try/catch + waitForURL).

rhino-cli: v0.13.0

- New commands: contracts java-clean-imports, contracts dart-scaffold.
- All demo codegen shell scripts replaced with rhino-cli contracts commands.

AyoKoding: 17 new by-example tutorials

Frameworks, algorithms, system design content in Go, C, Java.

**Current state:**

- 11 demo backends (10 languages), all CI green, all >= 90% coverage
- 3 demo frontends, all Gherkin-compliant, all >= 70% coverage
- 30 Nx projects, 68 dependency edges, 0 circular dependencies
- 29 Gherkin feature files (14 BE + 15 FE), 170 total scenarios
- OpenAPI 3.1 contract with codegen for all 14 demo apps

---

Phase 1 Goal: OrganicLever (productivity tracker)
Stack: Next.js + XState + Effect TS (frontend) + F#/Giraffe (backend), still evaluating
Timeline: Quality over deadlines, Insha Allah

---

Every commit is visible on GitHub.

---

Links

- GitHub: https://github.com/wahidyankf/open-sharia-enterprise
- All Updates: https://www.oseplatform.com/updates/
- Learning Content: https://www.ayokoding.com/
