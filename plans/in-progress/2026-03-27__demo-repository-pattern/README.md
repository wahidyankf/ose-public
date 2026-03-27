# Plan: Enforce Repository Pattern Across All Demo Backend Apps

**Status**: In Progress
**Created**: 2026-03-27

## Overview

Not all demo backend apps use the repository pattern consistently. Without abstract repository
interfaces, unit tests must use real databases (SQLite in-memory) instead of lightweight mocks,
and there is no clean seam to swap implementations between test levels.

This plan introduces proper repository abstractions in the 4 apps that lack them, so that:

- **Unit tests** use in-memory mock repositories (no DB dependency, fast, deterministic)
- **Integration tests** use real DB repositories (PostgreSQL via docker-compose)
- **E2E tests** use the full stack with real DB

## Git Workflow

All work is committed directly to `main` (Trunk Based Development). One commit per app, in phase
order. No feature branches required.

See [Trunk Based Development Convention](../../../governance/development/workflow/trunk-based-development.md).

## Quick Links

- [Requirements](./requirements.md) - Current state, gaps, and acceptance criteria
- [Technical Documentation](./tech-docs.md) - Implementation approach per app
- [Delivery Plan](./delivery.md) - Phased checklist and validation

## Apps Requiring Changes

| App                        | Current State                                          | Work Required                                                               |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `demo-be-fsharp-giraffe`   | Handlers call `AppDbContext` directly, no repo layer   | Add repository interfaces + EF Core implementations + extract from handlers |
| `demo-be-rust-axum`        | Free functions in `db/*_repo.rs`, no trait abstraction | Add async traits + struct implementations + inject via `AppState`           |
| `demo-be-python-fastapi`   | Concrete repo classes, no `Protocol` abstraction       | Add `Protocol` classes + add missing `RefreshTokenRepository`               |
| `demo-be-clojure-pedestal` | Plain namespace functions, no `defprotocol`            | Add `defprotocol` + `defrecord` implementations + inject via context map    |

## Apps Already Compliant (No Changes Needed)

| App                         | Pattern                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `demo-be-golang-gin`        | `Store` interface with gorm + memory implementations             |
| `demo-be-java-springboot`   | Spring Data `JpaRepository` interfaces                           |
| `demo-be-elixir-phoenix`    | `@behaviour` / `@callback` contracts                             |
| `demo-be-kotlin-ktor`       | Kotlin interfaces + InMemory and Exposed implementations         |
| `demo-be-java-vertx`        | Java interfaces + memory and pg implementations                  |
| `demo-be-ts-effect`         | Effect `Context.Tag` service interfaces                          |
| `demo-be-csharp-aspnetcore` | C# `I*Repository` interfaces                                     |
| `demo-fs-ts-nextjs`         | TypeScript interfaces + implementations + in-memory test doubles |
