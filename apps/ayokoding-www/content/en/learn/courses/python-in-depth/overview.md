---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

`just-enough-python` gets you reading and writing Python; this course gets you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms that separate translated code from native Python: truthiness and unpacking instead of index arithmetic, exceptions with chaining instead of error codes, the standard library instead of hand-rolled helpers, and the testing and packaging conventions the ecosystem shares.

## Why this exists -- the big idea

**The problem before the solution**: the primer teaches syntax and the standard workflow, but nobody teaches Python depth in one place — idiomatic control flow, error-handling style, the battery-included standard library, the unittest testing convention, and the packaging and tooling habits that working developers use daily. Programmers arriving from other languages write Python with an accent for years: range-len loops, None checks instead of truthiness, string paths instead of pathlib, prints instead of logging. Each accent is a small tax; together they mark code no fluent reader enjoys maintaining.

**Keep this if you forget everything else**: Write Python the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use Python idiomatic control flow, collections, and error-handling style instead of translating another language patterns into it; use the standard library for common tasks like text, files, time, and collections without reaching for a dependency first; write and run Python own standard test tooling, including a failing-test-first workflow; package and build a small Python project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic Python code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/python-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) covers idiomatic control flow and collections, the error-handling idiom, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules, packages, and dependencies, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, and trains systematic reading of idiomatic code. The [capstone](/en/learn/courses/python-in-depth/learning/capstone/overview) builds an order-report command-line tool that combines argument parsing, CSV handling, error management, embedded selftests, and pinned dependencies with a golden transcript, and [drilling](/en/learn/courses/python-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-python](/en/learn/courses/just-enough-python/learning/overview) for basic syntax, functions, modules, and file handling. Assumed knowledge: comfort writing and running small Python scripts, familiarity with running tests from a terminal, and basic experience with version control concepts. Every example here is pure standard-library Python, so the primer earns its place from the first page.

## About the examples

Every example is a real Python program executed by the course harness against the pinned Python toolchain with no network. Each example ships its own folder with the program, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. No example reads the live system or the clock — fixtures ship beside the program or generate inline — so outputs are byte-stable across runs. Standard error carries tracebacks by design and is ignored where the lesson says so; standard output is the asserted transcript.

## References

- Python documentation and standard-library reference (idioms, testing, packaging). Accessed 2026-10-21. [Python docs](https://docs.python.org/3/)
- Python style guide, PEP 8 (naming, layout, idiom). Accessed 2026-10-21. [PEP 8](https://peps.python.org/pep-0008/)
- Python packaging guide, PyPA (pyproject, pins, entry points). Accessed 2026-10-21. [PyPA](https://packaging.python.org/)
- The pinned Python toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific syntax or API.
