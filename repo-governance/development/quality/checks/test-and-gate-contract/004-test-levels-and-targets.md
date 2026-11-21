---
description: >-
  Holds rules C12, C14, C17, C18, and C21 of the test and gate contract: test levels by the strongest boundary touched,
  integration without real secrets, the standard targets, an automatic home for every layer, no placeholders, and
  mechanically enforced hermetic unit tests.
when_to_use: >-
  Use when classifying a test by level, naming or composing a test target, deciding where integration and end-to-end
  suites run, or turning on a stack's hermetic-unit enforcement.
---

# Test Levels and Targets

A level is a promise about what a test may touch. The promise only holds when the target names mean the same thing
everywhere and a machine, not a reviewer, keeps the unit level hermetic.

## C12 Levels

| Level       | May touch                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------ |
| unit        | nothing: no clock, file system, network, environment, process, or randomness; doubles only |
| integration | anything on the executing machine, such as local databases, containers, and files          |
| end-to-end  | anything, with synthetic data and per-case fixtures                                        |

A test is classified by the strongest boundary it touches.

An integration test never needs a real secret. It uses only local values, such as loopback credentials or example
values, so every `test:integration` target can run in the pull-request gate. A test that needs a real secret reaches
outside the machine, so it is an end-to-end test by definition: it belongs to `test:e2e` and runs where end-to-end tests
run. A test that cannot be rebuilt with local dependencies moves level rather than gaining an exception.

## C14 Standard Targets

These names exist in every repository that has the capability, with the same meaning, as a task-runner target or a
runner subcommand, and never as an alias, per
[Task Runner Target Standards](../../../infra/nx-targets.md):

| Target                    | Holds                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `test:quick`              | typecheck, lint, unit tests, BDD unit tests, `test:behaviour:coverage`, in that order |
| `test:behaviour:coverage` | the static behaviour-coverage check; it runs no test                                  |
| `test:integration`        | integration tests, BDD-bound scenarios included                                       |
| `test:e2e`                | end-to-end tests, BDD-bound scenarios included                                        |

`test:behaviour:coverage` is one shared command every repository invokes, including a repository that adopts no
registry; RHINO's `behaviour coverage validate` is the recommended one, per [Behaviour Corpus](005-behaviour-corpus.md).
Whether a binding passes is proven by the real runs of `test:quick`, `test:integration`, and `test:e2e`, never by this
check.

## C17 Every Layer Has an Automatic Home

`test:integration` runs in the pull-request gate on every pull request, for affected projects, and is part of the
aggregate result. `test:e2e` runs in a scheduled or `main` workflow the repository declares, not per pull request; every
remote-backed repository with end-to-end tests has that workflow. A layer is never manual-only.

## C18 No Placeholders

No unconditional skip, focus marker, expected-failure baseline, or no-op target exists. Each makes a target report a
pass over work that did not run.

## C21 Hermetic Unit Tests Are Enforced Mechanically

Each [stack pack](../../stacks/README.md) names the enforcement that keeps unit-test files from importing or calling a
clock, file system, network, environment, process, or randomness API: an import or API ban scoped to unit-test paths, or
a repository-owned scan with its own tests where no stock linter offers one. Review is not the enforcement.

Turning it on follows [Lint Strictness](../../cross-language-lint-strictness.md):

1. **Audit.** List every unit-test file that reaches a forbidden API and its action: inject a
   [test double](../../testing/test-doubles.md), or move the test to the integration level with its scenario still bound
   at every level.
2. **Enforce.** Turn on the stack's mechanism once the backlog is clean, and prove it fails on one planted violation and
   passes on the clean tree.
3. **Deny the network.** Where the host allows it, `test:quick` also runs with the network denied, for example in an
   unprivileged network namespace. A host that refuses records "not feasible" in the gate inventory; the mechanical ban
   still applies there.
