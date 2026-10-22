---
title: Overview
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

`just-enough-kotlin` gets you reading and writing Kotlin; this course gets you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms that separate translated code from native Kotlin: when-expressions and element loops instead of index arithmetic, nullable types and Result pipelines instead of error codes, the standard library instead of hand-rolled helpers, and the testing and packaging conventions the ecosystem shares.

## Why this exists -- the big idea

**The problem before the solution**: the primer teaches syntax and the standard workflow, but nobody teaches Kotlin depth in one place -- idiomatic control flow, error-handling style, the battery-included standard library, check-based testing habits, and the packaging and tooling conventions that working developers use daily. Programmers arriving from other languages write Kotlin with an accent for years: indexed loops where element loops fit, null returns where nullable types belong, string paths without charsets, prints where check suites belong. Each accent is a small tax; together they mark code no fluent reader enjoys maintaining.

**Keep this if you forget everything else**: Write Kotlin the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use Kotlin's idiomatic control flow, collections, and error-handling style instead of translating another language's style into it; use Kotlin's standard library for common tasks like text, files, time, and collections without reaching for a dependency first; write and run Kotlin's own standard test tooling, including a failing-test-first workflow; package and build a small Kotlin project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic Kotlin sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/kotlin-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) covers idiomatic control flow and collections, the error-handling idiom, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules, packages, and dependencies, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, style, and the Java interop boundary both ways, and trains systematic reading of idiomatic code. The [capstone](/en/learn/courses/kotlin-in-depth/learning/capstone/overview) builds a tally command-line tool that combines argument handling, grammar validation, error management, a fourteen-check suite, and pinned stdlib-only dependencies with a golden transcript, and [drilling](/en/learn/courses/kotlin-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-kotlin](/en/learn/courses/just-enough-kotlin/learning/overview) for basic syntax, and the assumed knowledge is comfort with Kotlin's basic syntax from just-enough-kotlin. Every example here is pure standard-library Kotlin, so the primer earns its place from the first page.

## About the examples

Every example is a real Kotlin program executed by the course harness against the pinned Kotlin toolchain with no network. Each example ships its own folder with the program, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. No example reads the live system or the clock -- fixtures ship beside the program or generate inline -- so outputs are byte-stable across runs. Standard output is the asserted transcript.

## References

Provenance for the facts this course teaches, re-verified at writing time since standard-library behavior changes between versions. The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have.

- Kotlin's own official documentation and standard-library reference (language, testing, packaging). Accessed 2026-10-21. [Kotlin docs](https://kotlinlang.org/docs/home.html)
- Kotlin coding conventions and idiomatic style guidance (naming, layout, data classes, sealed types). Accessed 2026-10-21. [Kotlin conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Gradle: the Kotlin DSL, version catalogs, and application plugin reference. Accessed 2026-10-21. [Gradle](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- The pinned Kotlin toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific syntax or API.
