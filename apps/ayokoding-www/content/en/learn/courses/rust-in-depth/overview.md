---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The `just-enough-rust` primer teaches you to read and write Rust; this course makes you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms the standard library itself is written in: borrowing instead of copying, `Result` instead of exceptions, iterators instead of indexes, and the standard testing workflow with seeded generators and pinned transcripts.

## Why this exists -- the big idea

**The problem before the solution**: the primer covers syntax in a few hours and stops, while real Rust work demands idioms, the standard library, error handling, testing, and tooling at production depth. Developers arriving from other languages translate their old habits instead: null checks where `Option` combinators belong, exceptions where `Result` belongs, index loops where iterator adapters belong, and hand-rolled helpers for functions the standard library already provides. The result compiles but never reads as Rust, and every reviewer pays the translation tax.

**Keep this if you forget everything else**: write Rust the way its own standard library does, not the way your first language would. Borrows over copies, values over mutation, data-shaped errors over stringly ones, and the standard tool running the checks.

## What you will be able to do

After this course you can write control flow, collection handling, and error handling in Rust's idiomatic style; reach for the standard library for text, files, dates, and collections before any dependency; write and run test suites including a failing-test-first workflow; lay out modules and read the dependency-pinning convention; choose the right concurrency primitive from the failure story; and read an unfamiliar idiomatic module in layers and explain what each part does.

## How this course is organized

[Learning](/en/learn/courses/rust-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) sets idiomatic control flow and collections, error handling, and the text, file, and time vocabulary; Intermediate (Examples 26-53) organizes modules and dependency conventions, tests everything with the standard workflow, and generalizes with traits, generics, and value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, then teaches a systematic way to read idiomatic code. The [capstone](/en/learn/courses/rust-in-depth/learning/capstone/overview) builds a tested zakat-ledger CLI with a verified transcript, and [drilling](/en/learn/courses/rust-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-rust](/en/learn/courses/just-enough-rust/learning/overview) for Rust's basic syntax, ownership, and borrowing. Assumed knowledge: comfort with Rust's basic syntax from just-enough-rust. Every example here is single-file Rust on the pinned toolchain, so the primer earns its place from the first page.

## About the examples

Every example is a real Rust program compiled by the course harness as `rustc main.rs` on the pinned Rust 1.99.1 toolchain with no network. Test-convention units compile with `rustc --test` with timing normalized out of the transcript; one unit passes `--cfg lesson`; one runs `rustfmt --check` first. Demos that need files read committed fixtures or OS-temp scratch with fixed content and fixed names; scratch writes go to fixed temp paths with fixed content; nothing reads the live system or the clock. Concurrency demos join in order or collect-then-sort with fixed thread counts and never print thread identifiers; the seeded generator pins its stream; dates are constructed fixed values, so outputs are recorded golden files and the lesson embeds every file byte-identically. Every unit is standard library only with no lockfile. Standard output is the asserted golden transcript; standard error is ignored, which matters for the lock-poisoning example that logs its panic there by design.

## References

- Rust official documentation and standard-library reference (ownership, borrowing, `Option`, `Result`, iterators, `std::thread`, testing). Accessed 2026-10-21. [Rust docs](https://doc.rust-lang.org/)
- Rust standard-library reference for the exact APIs this course teaches (`Vec`, `HashMap`, `BufReader`, `SystemTime`, `Duration`, `Cow`, atomics). Accessed 2026-10-21. [Rust std](https://doc.rust-lang.org/std/)
- Cargo manifest and semantic-versioning reference for the requirement operators and lock-file shapes the course reads as data. Accessed 2026-10-21. [Cargo reference](https://doc.rust-lang.org/cargo/)
- Rust edition and compiler-lint reference for the formatting, naming, and Clippy idioms the tooling chapter teaches. Accessed 2026-10-21. [Rustc lints](https://doc.rust-lang.org/rustc/lints/)
- The pinned Rust 1.99.1 toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific behavior; no example claims behavior the pinned version does not have.
