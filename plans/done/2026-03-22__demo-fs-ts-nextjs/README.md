# Plan: Create `demo-fs-ts-nextjs` — Fullstack Next.js App

**Status**: Done
**Created**: 2026-03-22
**Completed**: 2026-03-23
**Git Workflow**: Work on `main` (Trunk Based Development)

## Goal

Build a new fullstack TypeScript app (`apps/demo-fs-ts-nextjs`) using Next.js 16 that
combines backend API routes and frontend UI in a single application. It implements both
the backend API (Route Handlers) and the frontend UI (App Router pages), consuming both
BE and FE Gherkin spec sets and the shared OpenAPI contract.

## What Makes This Different

This is the first **fullstack** (`fs`) demo app — all existing demos are either `demo-be-*`
(backend only) or `demo-fe-*` (frontend only). The fullstack app:

- Implements the full API surface via Next.js Route Handlers (replacing a separate backend)
- Implements the full UI via Next.js App Router pages (replacing a separate frontend)
- Connects directly to PostgreSQL (no API proxy needed — it IS the API)
- Must pass **both** [BE Gherkin specs](../../../specs/apps/demo/be/gherkin/README.md) and [FE Gherkin specs](../../../specs/apps/demo/fe/gherkin/README.md)
- Serves everything on a single port (3401)

## Plan Documents

- [Requirements](./requirements.md) — Objectives, user stories, functional/non-functional
  requirements, acceptance criteria
- [Technical Documentation](./tech-docs.md) — Architecture, project structure, design
  decisions, Nx configuration, Docker, CI
- [Delivery](./delivery.md) — 13-phase implementation checklist with validation gate
