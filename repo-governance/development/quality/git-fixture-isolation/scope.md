---
description: "Which tests and fixtures this convention covers."
when_to_use: "Use when checking whether a test or fixture is in scope."
---

# Scope

## What This Convention Covers

- Any test, fixture, or test-support helper -- in Rust, TypeScript, F#/.NET, Dart, or any
  other language used in this monorepo or its sibling repos -- that invokes the `git` binary to
  **create or mutate** a throwaway repository (`git init`, `git commit`, `git config`,
  `git worktree add`, `git branch`, `git checkout -b`, `git reset --hard`, and equivalents).
- Fixtures that build throwaway repositories as test data for CLI apps, libraries, or BDD scenario
  runners (including this monorepo's cucumber-style `harness = false` binaries, per the [Rust
  Testing Standards](../../../docs/explanation/software-engineering/programming-languages/rust/testing-standards.md)
  doc's coverage of that pattern).
- Plain exit-status checking on `git` subprocess invocations, wherever it already exists (Standard
  5 below retains and contextualizes it as one of six required layers; it does not replace it).

## What This Convention Does NOT Cover

- **Read-only git commands against the real repository in tests** (e.g. a unit test that calls
  `git rev-parse --show-toplevel` against the actual repo to verify repository-root resolution,
  with nothing written). There is nothing to mutate, so there is no escape to guard against. See
  a retired in-tree root-resolution test for an example of an in-scope-adjacent,
  out-of-scope-by-mutation-boundary test.
- **Production code paths that intentionally operate on the real repository** (e.g. `./rhino gate
run`, or any git hook logic that is _supposed_ to read/write the checkout it runs in).
  This convention governs test fixtures building **throwaway** repositories, not application code
  whose job is to touch the real one.
- **Which test level a git-fixture test belongs to** (unit vs. integration) -- that classification
  is governed by the [Behaviour-Driven Development](../../behaviour-driven-development.md); this
  convention only governs how such a fixture must isolate itself once its level is decided.
- **General process-global mutable-state hazards unrelated to git** (e.g. environment variable
  leakage between unrelated tests) -- out of scope here; this convention is specific to git
  repository resolution.
