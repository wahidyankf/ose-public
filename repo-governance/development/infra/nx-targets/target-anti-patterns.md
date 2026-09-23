---
description: "Testing and lifecycle target definitions that falsely satisfy or weaken project gates"
when_to_use: "Use when reviewing project.json target definitions."
---

# Nx Target Anti-Patterns

- Non-canonical aliases such as `unit-test`, `integration-test`, `test:full`, or
  `specs:behaviour:coverage`.
- Echo/no-op/success-sentinel targets or runtime aliases used to claim an inapplicable layer.
- Unit tests whose setup, subject, or assertions touch real filesystem, database, environment,
  clock, randomness, process, network, or other OS-facing dependencies, beyond what
  [Script-Subject Unit Proof](../../behaviour-driven-development/script-subject-unit-proof.md)
  permits for a shell script or harness plugin subject.
- Integration tests that use mocks instead of an owned local boundary, reach an external network or
  a service the test did not start, or use loopback without a `repo-config.yml` allowlist entry.
- E2E tests that permit network use but do not observe a public boundary.
- Any `test:coverage:*` target that executes or depends on a runtime test target.
- A `test:quick` that omits an applicable static coverage validator or reaches Integration/E2E.
- Integration/E2E runtime wired into pre-commit, pre-push, or PR/main quality gates.
- Inputs that omit the owning recursively discovered Gherkin corpus.
- Cached targets whose real mutable resource cannot be isolated deterministically.

The [BDD standard](../../behaviour-driven-development.md) defines the canonical boundaries and
applicability rules.
