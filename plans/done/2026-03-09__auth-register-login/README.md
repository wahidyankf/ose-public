---
title: "Auth Register and Login"
status: In Progress
created: 2026-03-09
---

# Auth Register and Login

## Overview

Add user registration and login to the `organiclever-be` Spring Boot backend. The feature introduces:

- `POST /api/v1/auth/register` - create a new user account with BCrypt-hashed password
- `POST /api/v1/auth/login` - authenticate and receive a signed JWT Bearer token
- Spring Security filter chain protecting all other endpoints with JWT validation
- PostgreSQL `users` table managed by Liquibase migrations (with rollback support)
- H2 in-memory database for integration tests (keeps integration profile cacheable)
- Full `organiclever-be-e2e` Playwright BDD step definitions with `token-store.ts` and DB-cleanup fixture
- Updates to `specs/apps/organiclever-be/` (3 new feature files) and all related docs

## Status

**In Progress** - Implementation underway.

## Goals

- Allow users to create accounts and authenticate via the REST API
- Store passwords securely (BCrypt, never plaintext)
- Issue short-lived JWT tokens (HS256, 24 h) for subsequent authenticated requests
- Maintain the existing 95% JaCoCo line-coverage requirement
- Keep integration tests in-process with no external dependencies (H2 + Liquibase)
- Full E2E coverage in `organiclever-be-e2e` with database-cleanup fixture (`pg` package)
- Update related docs (`data-access.md`, `security.md`) to reflect the JWT + Spring Security pattern

## Git Workflow

Work directly on `main` (Trunk Based Development). No feature branch required.

Split commits by concern:

1. `feat(organiclever-be): add DB dependencies and Liquibase changelog`
2. `feat(organiclever-be): add User domain model and repository`
3. `feat(organiclever-be): add Spring Security and JWT infrastructure`
4. `feat(organiclever-be): add auth register and login endpoints`
5. `feat(organiclever-be): add auth specs and integration tests`
6. `feat(organiclever-be-e2e): add auth E2E step definitions with DB cleanup`
7. `feat(infra): add PostgreSQL service to organiclever docker-compose`
8. `docs: update data-access and security docs for JWT and Spring Security pattern`

## Quick Links

- [Requirements](./requirements.md) - Objectives, user stories, Gherkin acceptance criteria
- [Technical Documentation](./tech-docs.md) - Architecture, DB schema, JWT design, test strategy
- [Delivery](./delivery.md) - Phased implementation checklist
