Posted: Saturday, March 22, 2026
Platform: LinkedIn

---

OPEN SHARIA ENTERPRISE
Week 0018, Phase 1 Week 6

---

188 commits. 3 frontends fully Gherkin-compliant. Dependency graph audited to 68 edges.

Last week was 11 backends. This week: the frontend side caught up, and the entire monorepo's dependency graph got a deep audit and fix.

**Frontend Gherkin Compliance (all 3 now at 100%)**

- demo-fe-ts-tanstack-start: Built from scratch this week. TanStack Router SPA with full auth, expenses, admin. All 15 features, 92 scenarios covered in unit tests. 76% coverage.
- demo-fe-dart-flutterweb: Pure Dart Web app (no Flutter widgets in VM). Built an in-memory ServiceClient that mirrors backend business logic. All 15 features, 92 scenarios. 89% coverage.
- demo-fe-ts-nextjs: Was already compliant. Unchanged.

**Backend Unit Test Refactoring**

Refactored 4 backends (Go/Gin, Rust/Axum, Python/FastAPI, TypeScript/Effect) to call service functions directly instead of making HTTP calls in unit tests. Unit tests now match the three-level testing standard: mocked deps, no HTTP, Gherkin-driven.

**Nx Dependency Graph Audit**

Deep audit of all 30 projects and 68 dependency edges:

- Added demo-contracts to implicitDependencies for all 18 consumers (14 demo apps + 2 E2E suites + 2 codegen libs)
- Added rhino-cli to 10 projects that use it for coverage validation but never declared it
- Added Gherkin spec inputs to all frontend test targets and E2E projects
- Added elixir-openapi-codegen and clojure-openapi-codegen as explicit dependencies
- Fixed one circular dependency (golang-commons <-> rhino-cli)
- Created docs/reference/re\_\_project-dependency-graph.md with full Mermaid diagram
- Zero circular dependencies. 68 edges verified against actual graph.

**C4 Architecture Docs**

Updated all 5 C4 diagrams (context, container, component-be, component-fe, README) with:

- All 11 backend and 3 frontend implementations listed with CI workflows
- Gherkin coverage mapped per component (which features exercise which handlers)
- API contract integration details
- Three-level testing standard tables
- CI pipeline actors added to context diagram

**CI Fixes**

- Codecov coverage upload for TanStack Start and Flutter Web
- E2E navigation race condition fix (try/catch + waitForURL)
- Main CI aligned with all runtime setups

**rhino-cli v0.13.0**

- New commands: contracts java-clean-imports, contracts dart-scaffold
- Coverage improvements plan completed
- All demo codegen scripts replaced with rhino-cli contracts commands

**AyoKoding Content**

- 17 new by-example tutorials (frameworks, algorithms, system design)
- Go, C, Java examples for data structures and algorithms

**By the numbers:**

- 188 commits
- 11 demo backends (10 languages), all CI green, all >= 90% coverage
- 3 demo frontends, all Gherkin-compliant, all >= 70% coverage
- 30 Nx projects, 68 dependency edges, 0 circular dependencies
- 29 Gherkin feature files (14 BE + 15 FE), 174 total scenarios

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
