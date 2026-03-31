# Plan: CI/CD Standardization

**Status**: In Progress
**Created**: 2026-03-31

## Overview

This plan standardizes the entire CI/CD pipeline across the monorepo -- from local git hooks
through GitHub Actions workflows to Docker-based development and testing. The repository currently
has **22 GitHub Actions workflows**, **44 docker-compose files**, **38 Dockerfiles** (10 production, 12 integration, 13 dev, 1 CI, 2 other), a 9-step
pre-commit hook, and a 3-target pre-push gate spanning **13+ language runtimes**. Much of this
infrastructure grew organically as new backends and frameworks were added, resulting in significant
duplication, inconsistent patterns, and undocumented conventions.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Problem Statement

1. **Workflow duplication**: 11 near-identical backend test workflows (`test-a-demo-be-*.yml`)
   differ only in language setup and docker-compose paths. Adding a 12th backend means copying
   ~150 lines and making 5-10 substitutions.
2. **Monolithic PR quality gate**: A single GitHub Actions job installs 13+ language runtimes
   (Go, Java 21+25, .NET 10, Elixir, Python, Rust, Flutter, Clojure CLI, etc.) even when the PR
   only touches one app.
3. **No reusable workflow building blocks**: No composite actions or reusable workflows; every
   workflow is self-contained.
4. **Inconsistent Docker patterns**: Integration test compose files live in `apps/` while dev
   compose files live in `infra/dev/`. Dockerfiles vary in base image versions, layer ordering,
   and health check configuration.
5. **Missing CI coverage**: spec-coverage validation is implemented in rhino-cli but never invoked
   in CI. Fullstack app (`a-demo-fs-ts-nextjs`) lacks E2E workflow.
6. **Undocumented local dev workflow**: Docker Compose dev setups exist but lack a unified
   entrypoint or documentation for onboarding.
7. **No Docker layer caching in CI**: Every integration test workflow rebuilds Docker images from
   scratch.
8. **Coverage threshold rationale undocumented**: 90%/80%/75%/70% thresholds exist but the
   reasoning is implicit.

## Goals

1. **DRY CI workflows** via reusable workflows and composite actions
2. **Parallel, language-scoped PR quality gate** that only installs what's needed
3. **Standardized Docker templates** for Dockerfiles, docker-compose, and .dockerignore
4. **Spec-coverage validation** integrated into CI
5. **Documented local development** workflow with Docker Compose + autoreload
6. **Docker layer caching** in CI for faster integration/E2E test cycles
7. **Single source of truth** for CI conventions in governance docs

## Quick Links

- [Requirements](./requirements.md) -- Detailed requirements, gaps, and acceptance criteria
- [Technical Documentation](./tech-docs.md) -- Architecture, patterns, and implementation details
- [Delivery Plan](./delivery.md) -- Phased checklist with validation steps

## Scope

### In Scope

| Area                     | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| Git hooks                | Pre-commit (9 steps), commit-msg, pre-push standardization                 |
| Local quality gates      | formatting, typecheck, lint, test:quick across all project types           |
| Three-level testing      | test:unit, test:integration, test:e2e for BE, FE, FS, CLI                  |
| Specs folder structure   | Directory layout, contract-driven development, Gherkin consumption         |
| GitHub Actions workflows | PR quality gate, backend/frontend test workflows, test-and-deploy, codecov |
| Local Docker development | docker-compose dev setups with autoreload for all app types                |
| CI Docker infrastructure | Integration test Dockerfiles, CI overlays, layer caching                   |
| Governance documentation | CI conventions doc in `governance/development/`                            |

### Out of Scope

- Vercel deployment configuration (covered by existing deployer agents)
- Application-level code changes (only CI/build infrastructure)
- New testing frameworks or tools (standardize what exists)
- Kubernetes deployment (future initiative)
- Monitoring/observability (separate concern)

## Workstreams

| #   | Workstream                                                                     | Phase | Dependencies |
| --- | ------------------------------------------------------------------------------ | ----- | ------------ |
| W1  | [Governance & Documentation](#w1-governance--documentation)                    | 1     | None         |
| W2  | [Git Hooks Standardization](#w2-git-hooks-standardization)                     | 1     | None         |
| W3  | [GitHub Actions Composite Actions](#w3-github-actions-composite-actions)       | 2     | W1           |
| W4  | [PR Quality Gate Optimization](#w4-pr-quality-gate-optimization)               | 2     | W3           |
| W5  | [Backend Test Workflow Consolidation](#w5-backend-test-workflow-consolidation) | 3     | W3           |
| W6  | [Frontend & Fullstack Test Workflows](#w6-frontend--fullstack-test-workflows)  | 3     | W3           |
| W7  | [Docker Standardization](#w7-docker-standardization)                           | 2     | W1           |
| W8  | [Local Development with Docker](#w8-local-development-with-docker)             | 3     | W7           |
| W9  | [CI Docker Caching & Optimization](#w9-ci-docker-caching--optimization)        | 4     | W5, W7       |
| W10 | [Spec-Coverage Integration](#w10-spec-coverage-integration)                    | 4     | W5           |
| W11 | [Gherkin Consumption Remediation](#w11-gherkin-consumption-remediation)        | 3     | W1           |
| W12 | [Specs Folder Restructuring](#w12-specs-folder-restructuring)                  | 3     | W1           |
| W13 | [CLI Docker Compose Setup](#w13-cli-docker-compose-setup)                      | 3     | W7           |
| W14 | [Governance Propagation](#w14-governance-propagation)                          | 4     | W1-W13       |

## Context

### Current CI Architecture (As-Is)

```mermaid
flowchart TD
    subgraph local["Local Development"]
        PC["pre-commit<br/>(9 steps)"]
        CM["commit-msg<br/>(commitlint)"]
        PP["pre-push<br/>(typecheck + lint + test:quick)"]
    end

    subgraph pr["PR Workflows"]
        QG["PR Quality Gate<br/>(monolithic, 13+ runtimes)"]
        AF["PR Auto-Format"]
        VL["PR Validate Links"]
    end

    subgraph scheduled["Scheduled Workflows (2x daily)"]
        BE1["test-a-demo-be-golang-gin"]
        BE2["test-a-demo-be-java-springboot"]
        BEN["... 9 more backend workflows"]
        FE1["test-a-demo-fe-ts-nextjs"]
        OL["test-organiclever"]
    end

    subgraph deploy["Test & Deploy"]
        AW["test-and-deploy-ayokoding-web"]
        OW["test-and-deploy-oseplatform-web"]
    end

    subgraph codecov["Coverage"]
        CC["codecov-upload<br/>(all projects, main only)"]
    end

    local --> pr
    pr --> scheduled
    scheduled --> deploy
    deploy --> codecov
```

### Target CI Architecture (To-Be)

```mermaid
flowchart LR
    subgraph local["Local Development"]
        PC["pre-commit<br/>(streamlined)"]
        CM["commit-msg<br/>(commitlint)"]
        PP["pre-push<br/>(nx affected, cacheable)"]
    end

    subgraph actions["Reusable GitHub Actions"]
        CA1["composite: setup-golang"]
        CA2["composite: setup-jvm"]
        CA3["composite: setup-dotnet"]
        CA4["composite: setup-python"]
        CA5["composite: setup-rust"]
        CA6["composite: setup-elixir"]
        CA7["composite: setup-node"]
        CA8["composite: setup-flutter"]
        RW1["reusable: backend-test"]
        RW2["reusable: frontend-test"]
        RW3["reusable: test-and-deploy"]
    end

    subgraph pr["PR Workflows"]
        QG["PR Quality Gate<br/>(parallel, language-scoped jobs)"]
        AF["PR Auto-Format"]
        VL["PR Validate Links"]
    end

    subgraph scheduled["Scheduled Workflows"]
        BEM["backend-tests<br/>(matrix: 11 backends)"]
        FEM["frontend-tests<br/>(matrix: 3 frontends)"]
        OL["test-organiclever"]
    end

    subgraph deploy["Test & Deploy"]
        AW["test-and-deploy-ayokoding-web"]
        OW["test-and-deploy-oseplatform-web"]
    end

    CA1 & CA2 & CA3 & CA4 & CA5 & CA6 & CA7 & CA8 --> RW1 & RW2 & RW3
    RW1 --> BEM
    RW2 --> FEM
    RW3 --> AW & OW
    QG --> CA1 & CA2 & CA3 & CA4 & CA5 & CA6 & CA7 & CA8
    local --> pr
```

## Related Documentation

- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Code Quality](../../../governance/development/quality/code.md)
- [Markdown Quality](../../../governance/development/quality/markdown.md)
- [Nx Targets](../../../governance/development/infra/nx-targets.md)
- [Plans Organization Convention](../../../governance/conventions/structure/plans.md)
