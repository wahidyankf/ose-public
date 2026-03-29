# Demo Specs Consolidation

**Status**: In Progress (Started: 2026-03-13)

## Overview

Merge `specs/apps/demo-be/` and `specs/apps/demo-fe/` into a unified `specs/apps/demo/` directory.
The demo application is one system with two perspectives (backend API and frontend SPA). Consolidating
under a single `demo/` root with shared C4 architecture diagrams and separate `be/` and `fe/` Gherkin
specs reflects this reality.

## Goals

1. Unify C4 architecture diagrams — context and container diagrams merge naturally; component diagrams
   stay separate per perspective (BE vs FE)
2. Preserve Gherkin spec separation — `be/gherkin/` and `fe/gherkin/` remain distinct (different step
   semantics: HTTP-verbs vs UI-actions)
3. Update all 107+ file references across the entire codebase (source code, Docker configs, CI, docs,
   governance, plans)
4. Ensure every directory has a `README.md`
5. Run [specs-validation](../../../governance/workflows/specs/specs-validation.md) in **OCD mode**
   on the merged `specs/apps/demo/` before rewiring app references — fix all issues while the
   blast radius is small (specs only, no app code touched yet)
6. Pass ALL CI — locally (lint, typecheck, test:quick) and on GitHub Actions (Main CI, all 11
   integration + E2E workflows, organiclever-fe, PR workflows). Trigger CI manually and verify.

## Target Structure

```
specs/apps/demo/
├── README.md                    # Unified demo app specs overview
├── c4/
│   ├── README.md                # C4 index (4 diagrams)
│   ├── context.md               # L1 — unified system context (actors + FE + BE)
│   ├── container.md             # L2 — unified containers (SPA, Static Server, API, DB, FS)
│   ├── component-be.md          # L3 — BE internals (handlers, middleware, services, repos)
│   └── component-fe.md          # L3 — FE internals (pages, state, API client, guards)
├── be/
│   ├── README.md                # Backend specs overview (13 features, 76 scenarios)
│   └── gherkin/
│       ├── README.md            # Gherkin index
│       ├── .gitignore
│       ├── health/
│       ├── authentication/
│       ├── user-lifecycle/
│       ├── security/
│       ├── token-management/
│       ├── admin/
│       └── expenses/
└── fe/
    ├── README.md                # Frontend specs overview (15 features, 92 scenarios)
    └── gherkin/
        ├── README.md            # Gherkin index
        ├── health/
        ├── authentication/
        ├── user-lifecycle/
        ├── security/
        ├── token-management/
        ├── admin/
        ├── expenses/
        └── layout/
```

## Impact Assessment

| Category                                                             | Files Affected | Risk                               |
| -------------------------------------------------------------------- | -------------- | ---------------------------------- |
| Backend app configs (project.json, pom.xml, build.gradle.kts)        | ~15            | HIGH — breaks builds if wrong      |
| Docker/docker-compose files (absolute paths)                         | ~16            | HIGH — breaks CI integration tests |
| Test runner configs (.cucumber.js, conftest.py, suite_test.go, etc.) | ~15            | HIGH — breaks test discovery       |
| E2E test config (playwright.config.ts)                               | 1              | HIGH                               |
| Infrastructure docker-compose (infra/dev/)                           | ~10            | MEDIUM                             |
| Documentation (README.md files in apps/)                             | ~12            | LOW                                |
| Governance docs (testing standard, BDD mapping, nx-targets)          | ~5             | LOW                                |
| CLAUDE.md                                                            | 1              | LOW                                |
| Plans (done/)                                                        | ~5             | LOW — historical references        |
| Specs internal cross-references                                      | ~10            | MEDIUM                             |

## Plan Files

- [requirements.md](./requirements.md) — Detailed requirements and acceptance criteria
- [tech-docs.md](./tech-docs.md) — Technical approach, path mapping, C4 merge strategy
- [delivery.md](./delivery.md) — Phased delivery checklist

## Related

- Current BE specs: `specs/apps/demo-be/`
- Current FE specs: `specs/apps/demo-fe/`
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [BDD Spec-Test Mapping](../../../governance/development/infra/bdd-spec-test-mapping.md)
