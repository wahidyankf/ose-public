---
description: >-
  Fixes the Go baseline: gofmt, vet, and a recorded linter set as failing gates, every error handled or returned,
  interfaces declared by their consumer, goroutines with an owner and a stop signal, and statement coverage.
when_to_use: >-
  Use when creating, configuring, or reviewing a Go module, or when choosing its linters, an error's form, where an
  interface lives, or how a goroutine ends.
---

# Go Standards

This standard is canonical for Go. It holds the choices Go and its toolchain leave open, and a Go programming skill
defers here for each rule it applies.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md), and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md). The module's `go` directive and `go.sum` follow
[Native-First Toolchain](../../workflow/native-first-toolchain.md) and
[Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

- **Format:** `gofmt -l` lists no file.
- **Type check:** `go build ./...`, with the vet run compiling test files too.
- **Lint:** [`go vet`](https://pkg.go.dev/cmd/vet) over every package, plus a linter set recorded in committed
  configuration, never only in command flags. Example: golangci-lint's `standard` set of errcheck, govet, ineffassign,
  staticcheck, and unused ([configuration](https://golangci-lint.run/docs/configuration/file/)).

Findings fail at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets, and each `//nolint` names its
linter and its reason.

## Type and Boundary Safety

The compiler is Go's checker under [Type and Boundary Safety](../code/type-and-boundary-safety.md). In Go:

- `any` appears in a signature only where every type is genuinely accepted; domain code uses concrete types or
  constrained generics.
- A type assertion uses the two-value form unless a panic is the contract.
- Decoding fills a missing field with its zero value, so decoded input becomes a domain value through a constructor that
  checks what a zero value cannot distinguish. A decoded struct never passes inward unchecked.
- Package `unsafe` appears only beside a comment stating its safety invariant.

## Errors

Every returned error is handled or returned, never discarded with `_`, and the error case returns first. Error strings
are lowercase without trailing punctuation, since they are wrapped into other messages
([Code Review Comments](https://go.dev/wiki/CodeReviewComments)). The form follows what callers need:

- to test for one condition, an exported sentinel compared with `errors.Is`;
- to read details out of the failure, an exported error type extracted with `errors.As`;
- only to report or pass it on, a wrapped error with context through `%w`, and no identity.

Never branch on message text. A `panic` signals a programmer error or a failed startup, never a failure a caller could
handle.

## Interfaces and Concurrency

- An interface is declared in the package that consumes it, sized to the methods that consumer calls; the implementation
  returns its concrete type.
- `context.Context` is the first parameter of every call that may wait, and is never stored in a struct field.
- Every goroutine has an owner that waits for it and a signal that stops it.
- Randomness that protects anything comes from `crypto/rand`.
- A zero value is useful where possible, and a getter has no `Get` prefix
  ([Effective Go](https://go.dev/doc/effective_go)).

## Tests

Unit tests sit beside their package in `_test.go` files and run with `-race`, measuring coverage in that run. A test
using `t.TempDir`, `t.Setenv`, a real listener, or a child process is integration, as
[Test Boundaries and Gates](../../behaviour-driven-development.md) classifies it.

Go coverage counts statements, not branches, so no branch figure is claimed. Integration coverage comes from an
instrumented build ([`-cover` with `GOCOVERDIR`](https://go.dev/doc/build-cover)) only where it measures distinct code,
per [Meaningful Coverage](../testing/meaningful-coverage.md). Any floor is recorded under
[Layers and Adapters](../../behaviour-driven-development.md).

## Documentation

Every exported name has a doc comment beginning with that name. An exported sentinel or error type joins the
Public Contract, so one is exported only when a caller needs it, and a behaviour
change updates its documentation per [Specification Maintenance](../specs-application-sync.md).

## Adopter Decisions

| Decision              | Option                      | Gains                           | Costs                                     |
| --------------------- | --------------------------- | ------------------------------- | ----------------------------------------- |
| assertions            | the `testing` package only  | no dependency                   | longer comparisons and hand-written diffs |
|                       | a library; example: testify | shorter assertions, clear diffs | a dependency, per Dependency Selection    |
| integration selection | a build tag per file        | tests stay beside their package | a forgotten tag moves a test into unit    |
|                       | a separate test directory   | the layer is visible by path    | tests reach only the exported API         |

Record each choice in the repository adapter [Stack Packs](../../../conventions/structure/stack-packs.md) defines.

## Enforcement

The toolchain and recorded linters enforce the gates in the adopter's own hooks and pipeline. Review applies the rest.
