---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The `lisp` primer teaches you to read and write Clojure; this course makes you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms the standard library itself is written in: threading pipelines instead of nested calls, immutable updates instead of mutation, error handling that carries data instead of strings, the standard testing workflow including property-based tests, and the namespace and dependency conventions every shared project follows.

## Why this exists -- the big idea

**The problem before the solution**: the primer covers syntax in fifteen hours and stops, while real Clojure work demands idioms, the standard library, error handling, testing, and tooling at production depth. Developers arriving from other languages translate their old habits instead: loops with counters, exceptions with string messages, hand-rolled helpers for functions the standard library already provides. The result runs but never reads as Clojure, and every reviewer pays the translation tax.

**Keep this if you forget everything else**: write Clojure the way its own standard library does, not the way your first language would. Values over variables, pipelines over nesting, data-shaped errors over stringly ones.

## What you will be able to do

After this course you can write control flow, collection handling, and error handling in Clojure's idiomatic style; reach for the standard library for text, files, dates, and collections before any dependency; write and run `clojure.test` suites including property-based tests with a failing-test-first workflow; lay out a small project with namespaces, `deps.edn`, and a hash-locked dependency file; and read an unfamiliar idiomatic namespace in layers and explain what each part does.

## How this course is organized

[Learning](/en/learn/courses/clojure-essentials/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) sets control flow, collections, error handling, and the text, file, and time vocabulary; Intermediate (Examples 26-53) organizes namespaces and hash-locked dependencies, tests everything including properties, and generalizes with multimethods, protocols, and transducers; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, then teaches a systematic way to read idiomatic code. The [capstone](/en/learn/courses/clojure-essentials/learning/capstone/overview) builds a tested word-frequency CLI with a verified transcript, and [drilling](/en/learn/courses/clojure-essentials/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [lisp](/en/learn/courses/lisp/learning/overview) for Clojure's basic syntax, evaluation model, and REPL habits. Assumed knowledge: comfort reading short Clojure expressions, quoting, and function calls. Every example here is Clojure on the JVM, so the primer earns its place from the first page.

## About the examples

Every example is a real Clojure script executed by the course harness as `clojure main.clj` on the pinned Clojure 1.12.6 toolchain with no network. Demos that need files read committed fixtures beside the script; scratch writes go to fixed paths under `/tmp` with fixed content; nothing reads the live system or the clock. Concurrency demos use fixed buffers with rendezvous reads and sorted transcripts, and property tests run on fixed seeds, so outputs are recorded golden files and the lesson embeds every file byte-identically. Only the property-based-testing and `core.async` examples reach beyond the three core jars, through the course `learning/code/jars.lock` with every hash recorded.

## References

- Clojure official documentation and API reference (evaluation model, collections, gryphons of `clojure.core`, `clojure.string`, `clojure.test`, `clojure.spec.alpha`). Accessed 2026-10-21. [Clojure docs](https://clojure.org/)
- Clojure 1.12 changelog and `clojure.core` reference for version-specific behavior. Accessed 2026-10-21. [Clojure 1.12](https://github.com/clojure/clojure/blob/master/changes.md)
- `test.check` 1.1.3 generator and property reference for the property-based-testing examples. Accessed 2026-10-21. [test.check](https://github.com/clojure/test.check)
- `core.async` 1.9.865 channel and `go` reference for the concurrency-survey examples. Accessed 2026-10-21. [core.async](https://github.com/clojure/core.async)
- The pinned Clojure 1.12.6 toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific behavior; no example claims behavior the pinned version does not have.
