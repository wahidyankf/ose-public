---
title: "Integration Testing Standards"
description: OSE Platform standards for real, isolated, network-free local-resource integration tests
category: explanation
subcategory: development
tags: [tdd, integration-testing, local-resources, isolation]
principles: [automation-over-manual, reproducibility]
created: 2026-02-09
---

# Integration Testing Standards

## Prerequisite Knowledge

Complete the AyoKoding TDD learning path, then read the canonical
[Behaviour-Driven Development standard](../../../../../repo-governance/development/behaviour-driven-development.md).

## Boundary

Integration tests exercise production code against at least one real resource that the project
owns locally: a temporary filesystem, local database, environment state, child process, or standard
stream. They may also bind a loopback socket the test starts and stops itself, when the project is
allowlisted in `repo-config.yml`. They must not reach an external network or a service the test did
not start.

An injected in-memory repository, MSW handler, WireMock endpoint, or other test double is Unit proof,
not Integration proof. A real isolated local database connection is Integration, and so is a server
the test itself starts on a controlled loopback port; a container or long-running service the test
did not start is E2E, because the test observes a public boundary it does not own.

## Isolation

- Create unique temporary roots, database names, process identities, and environment snapshots.
- Use synthetic data only. Never fall back to developer, staging, or production resources.
- Make setup fail closed when the intended resource is unavailable.
- Restore environment state and remove resources deterministically, including after failure.
- Prevent concurrent tests from sharing mutable state.

## Gherkin and Targets

Every applicable Integration scenario maps the owner's canonical `behaviours/` corpus to substantive
`test:integration` proof. `test:coverage:integration` validates that mapping statically and never
executes tests. A genuine boundary mismatch may use `@integration-exempt` only under the canonical
[coverage and exemption contract](../../../../../repo-governance/development/behaviour-driven-development/coverage-exemptions-and-execution.md).

Run impacted Integration tests manually during development and review. Never place Integration
runtime in pre-commit, pre-push, PR/main quality gates, `test:quick`, or `test:coverage:*`.
Scheduled/manual full-quality CI runs the complete Integration suite before complete E2E.

## Review Checklist

- [ ] The test uses a real owned local resource and reaches no external network.
- [ ] Setup, subject, and assertions stay within the Integration boundary.
- [ ] Resources and synthetic data are isolated and cleaned deterministically.
- [ ] The scenario has mandatory Unit proof and an exact Integration binding or valid exemption.
- [ ] The runtime target is absent from fast hooks and PR gates.
