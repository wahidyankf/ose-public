---
title: Overview
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

`just-enough-java` gets you reading and writing Java; this course gets you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms that separate translated code from native Java: switch expressions and streams instead of index arithmetic, exceptions with chained causes instead of error codes, the standard library instead of hand-rolled helpers, and the testing and packaging conventions the ecosystem shares.

## Why this exists -- the big idea

**The problem before the solution**: the primer teaches syntax and the standard workflow, but nobody teaches Java depth in one place -- idiomatic control flow, error-handling style, the battery-included standard library, assertion-based testing habits, and the packaging and tooling conventions that working developers use daily. Programmers arriving from other languages write Java with an accent for years: indexed loops where enhanced for fits, null returns where Optional belongs, string paths where NIO waits, prints where logging belongs. Each accent is a small tax; together they mark code no fluent reader enjoys maintaining.

**Keep this if you forget everything else**: Write Java the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use Java's idiomatic control flow, collections, and error-handling style instead of translating another language's style into it; use Java's standard library for common tasks like text, files, time, and collections without reaching for a dependency first; write and run Java's own standard test tooling, including a failing-test-first workflow; package and build a small Java project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic Java code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/java-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) covers idiomatic control flow and collections, the error-handling idiom, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules, packages, and dependencies, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, and trains systematic reading of idiomatic code. The [capstone](/en/learn/courses/java-in-depth/learning/capstone/overview) builds a dues-settlement command-line tool that combines argument handling, grammar validation, error management, a thirteen-check suite, and pinned stdlib-only dependencies with a golden transcript, and [drilling](/en/learn/courses/java-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-java](/en/learn/courses/just-enough-java/learning/overview) for basic syntax, and [enterprise-java-and-the-jvm](/en/learn/courses/enterprise-java-and-the-jvm/learning/overview) for the specialized concurrency and enterprise angle this course deliberately surveys instead of repeating. Assumed knowledge: comfort with Java's basic syntax from just-enough-java. Every example here is pure standard-library Java, so the primer earns its place from the first page.

## About the examples

Every example is a real Java program executed by the course harness against the pinned Java toolchain with no network. Each example ships its own folder with the program, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. No example reads the live system or the clock -- fixtures ship beside the program or generate inline -- so outputs are byte-stable across runs. Standard output is the asserted transcript.

## References

Provenance for the facts this course teaches, re-verified at writing time since standard-library behavior changes between versions. The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have. The legacy release-highlights pages for Java were judged obsolete by the migration plan and are not migrated here: they describe specific past releases, not durable language material.

- Java documentation and standard-library reference (language, testing, packaging). Accessed 2026-10-21. [Java docs](https://docs.oracle.com/en/java/)
- Java style and idiom guidance (naming, layout, records, sealed types). Accessed 2026-10-21. [Java style](https://www.oracle.com/java/technologies/javase/codeconventions-contents.html)
- Apache Maven: the standard layout and coordinates reference. Accessed 2026-10-21. [Maven](https://maven.apache.org/guides/)
- The pinned Java toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific syntax or API.
