---
title: "Overview"
date: 2026-10-13T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Go](../just-enough-go/learning/overview.md) -- every example in this course is a complete Go module, and this course assumes you can already read and write packages, structs, interfaces, and error values the way that primer taught them; SQL Essentials -- the persistence examples later in this course assume a parameterized SQL query written from Go with `database/sql`.
- **Tools & environment**: a macOS/Linux terminal; a current stable **Go toolchain** (`go version`); an editor with `gopls` support; **`curl`** to exercise every endpoint; no database to install -- the persistence examples use a pure-Go SQLite driver fetched as an ordinary Go module (`go mod tidy` inside the example directory).
- **Assumed knowledge**: basic Go syntax and a parameterized SQL query. No prior net/http server experience is required -- this course is where that experience starts.

## Why this exists

Many clients need to share and change the same durable state over a network -- that demands a server mediating access, not a local program only one process can touch. The one idea worth keeping if you forget everything else: **a backend is a stateless pipeline** -- receive, validate, persist, respond -- with all the real state pushed down into the database, not held in the server process itself.

This course teaches the same foundation as [Backend Essentials](../backend-essentials/overview.md), rebuilt end to end with the Go standard library: `net/http` servers, `encoding/json` bodies, middleware as function wrappers, and a `database/sql` repository layer. No web framework is introduced -- the standard library is the whole stack.

## Scope boundary

This course covers the usable slice -- a real HTTP JSON service in Go wired to a database, run and tested from the CLI. Deeper scale, advanced auth, caching, and messaging belong to [Backend at Scale](../backend-at-scale/overview.md); this course is the everyday foundation those build on. Go concurrency pipelines belong to CSP-Style Concurrency; this course uses only enough concurrency to run a server and test it.

Start with the [learning overview](./learning/overview.md), then use [drilling](./drilling/overview.md).

## References

- HTTP semantics follow RFC 9110 (methods, status codes, statelessness); all examples are original.
