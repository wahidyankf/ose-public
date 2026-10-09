---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

This primer builds practical Go fluency from packages and values through collections, methods,
interfaces, errors, JSON, generics, tests, and a first look at concurrency. It assumes you already
know how to program in another language. Install a supported Go toolchain and confirm it with
`go version`; the [Go documentation](https://go.dev/doc/) is the reference for language and tool
behavior.

## Work through the examples

1. [Beginner examples](./beginner.md) (1–26) cover executable packages, modules, values, functions,
   branches, loops, and `defer`.
2. [Intermediate examples](./intermediate.md) (27–54) cover slices, maps, pointers, structs,
   methods, interfaces, errors, and JSON tags.
3. [Advanced examples](./advanced.md) (55–78) cover JSON round trips, generics, small goroutine
   hand-offs, tests, formatting, and contexts.
4. Use the [capstone](./capstone/overview.md) to combine these ideas, then try the
   [drilling tasks](../drilling/overview.md) without looking at their answers.

Each example names a colocated directory under `learning/code/`. Run its stated command from that
directory. Most use `go run main.go`; module and package examples use `go run .`, and test examples
use `go test main.go main_test.go`. Compare your result with its expected observation, then change
one input and predict the new result before running it again. Commands that build a binary leave
that artifact in the example directory until you remove it.

The concurrency examples only introduce a goroutine, channel, mutex, wait group, and context.
Designing worker pools, pipelines, cancellation across stages, or memory ordering belongs to the
later CSP-style concurrency course. For exact language rules, consult the
[Go specification](https://go.dev/ref/spec); for module setup, use the
[official modules tutorial](https://go.dev/doc/tutorial/create-module).
