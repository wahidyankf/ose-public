---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

`just-enough-typescript` gets you reading and writing TypeScript; this course gets you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms that separate translated code from native TypeScript: optional chaining and nullish coalescing instead of guard pyramids, union narrowing instead of type assertions, the standard library instead of hand-rolled helpers, and the testing and packaging conventions the ecosystem shares.

## Why this exists -- the big idea

**The problem before the solution**: the primer teaches syntax and the standard workflow, but nobody teaches TypeScript depth in one place — idiomatic control flow, the error-handling idiom, the standard library for text, files, and time, the `node:test` testing convention, and the packaging and tooling habits that working developers use daily. Programmers arriving from other languages write TypeScript with an accent for years: nullable checks instead of optional chaining, `any` instead of `unknown` with narrowing, string paths instead of `node:path`, `console.log` debugging instead of real tests. Each accent is a small tax; together they mark code no fluent reader enjoys maintaining.

**Keep this if you forget everything else**: Write TypeScript the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use TypeScript idiomatic control flow, collections, and error-handling style instead of translating another language patterns into it; use the standard library for common tasks like text, files, time, and collections without reaching for a dependency first; write and run TypeScript own standard test tooling, including a failing-test-first workflow; package and build a small TypeScript project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic TypeScript code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/typescript-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) covers idiomatic control flow and collections, the error-handling idiom, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules, packages, and dependencies, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, and trains systematic reading of idiomatic code. The [capstone](/en/learn/courses/typescript-in-depth/learning/capstone/overview) builds a report command-line tool that combines argument handling, CSV reading, error management, embedded selftests, and pinned dependencies with a golden transcript, and [drilling](/en/learn/courses/typescript-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-typescript](/en/learn/courses/just-enough-typescript/learning/overview) for basic syntax, types, functions, and modules. Assumed knowledge: comfort writing and running small TypeScript programs, familiarity with running tests from a terminal, and basic experience with version control concepts. Every example here is TypeScript compiled with the pinned toolchain's strict settings, so the primer earns its place from the first page.

## About the examples

Every example is a real TypeScript program executed by the course harness against the pinned TypeScript toolchain with no network. Each example ships its own folder with the program, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. No example reads the live system or the clock — fixtures ship beside the program or generate inline — so outputs are byte-stable across runs. Standard error carries tracebacks by design and is ignored where the lesson says so; standard output is the asserted transcript.

## References

- TypeScript documentation and handbook (idioms, strictness flags, modules, testing guidance). Accessed 2026-10-21. [TypeScript docs](https://www.typescriptlang.org/docs/)
- Node.js API reference for the pinned runtime (file system, paths, tests, asserts). Accessed 2026-10-21. [Node.js docs](https://nodejs.org/docs/)
- The pinned TypeScript toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific syntax or API.
