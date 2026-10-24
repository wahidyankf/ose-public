---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Go In Depth takes you from writing Go to writing it the way its own standard library does: idiomatic control flow, honest error handling, fluent standard-library use, tested code, and tooling with opinions. just-enough-go gets you reading and writing Go; this course gets you fluent in it.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-go is an explicit primer, yet nobody teaches Go's idioms, standard library, error handling, and tooling at the depth this subject reaches. Learners translate their first language into Go instead of thinking in it. **Keep this if you forget everything else**: write Go the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use Go's idiomatic control flow, collections, and error-handling style instead of translating another language's style into it; use Go's standard library for common tasks (text, files, time, collections) without reaching for a dependency first; write and run Go's own standard test tooling, including a failing-test-first workflow; package and build a small Go project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic Go code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/golang-in-depth/learning/overview) holds 78 worked examples in three levels: Beginner (Examples 1-25) covers control flow, collections, error handling, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling and style, and reading idiomatic code. The [capstone](/en/learn/courses/golang-in-depth/learning/capstone/overview) builds a small dues-ledger CLI with tests and a golden transcript, and [drilling](/en/learn/courses/golang-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-go for Go's basic syntax, which every example assumes you can read; csp-style-concurrency for the specialized concurrency angle this course surveys rather than repeats. Assumed knowledge: comfort with Go's basic syntax from just-enough-go. The prerequisite rubric rules T1 to T4 and L1 were re-run over this course's final text, and the frontmatter prerequisites list the result.

## About the examples

Every example is a complete Go module using the standard library only, with no require lines: there is no supply chain to audit or break. Each unit builds with `go build` and runs its binary in the harness against the recorded output under its own `expected/` folder; testing-convention units additionally run `go test` with timing normalized away, and the toolchain chapter runs `go vet`, `go list`, and `go doc` where the lesson is about the tool itself. No example needs the network, the clock, or random seeds. Module examples carry their own `go.mod` so multi-file packages build as one unit. The legacy corpus also held dated release-highlights pages; those are judged obsolete by this plan (stale version-specific content, not durable course material) and are not migrated.

## References

Provenance for the facts this course teaches, re-verified at writing time since standard-library behavior changes between versions. The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have.

- Go documentation: the language, the standard library, and the tools. Accessed 2026-10-21. [Go docs](https://go.dev/doc/)
- Go packages: the standard library reference. Accessed 2026-10-21. [Package docs](https://pkg.go.dev/std)
- Effective Go: the idiomatic style guide. Accessed 2026-10-21. [Effective Go](https://go.dev/doc/effective_go)
- Go Modules Reference: module paths, versions, and the replace directive. Accessed 2026-10-21. [Modules](https://go.dev/doc/modules/gomod-ref)
- Go testing: the testing, testing/iotest, and testing/fstest packages. Accessed 2026-10-21. [Testing](https://pkg.go.dev/testing)
- Go diagnostics: go vet and the go command. Accessed 2026-10-21. [Go command](https://go.dev/doc/cmd)
