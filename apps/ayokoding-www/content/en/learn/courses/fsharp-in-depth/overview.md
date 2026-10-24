---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The `just-enough-fsharp` primer teaches you to read and write F#; this course gets you fluent in it. Across seventy-eight small, independently runnable scripts you will absorb the idioms the standard library itself is written in: expressions over statements, options and results over nulls and stringly errors, pipelines over loops, copy-and-update over mutation, the standard check-helper testing workflow, and the project and lock-file conventions every shared project follows.

## Why this exists -- the big idea

**The problem before the solution**: the primer covers syntax in a few hours and stops, while real F# work demands idioms, the standard library, error handling, testing, and tooling at production depth. Developers arriving from other languages translate their old habits instead: loops with counters where folds belong, null checks where options belong, stringly errors where unions belong, and hand-rolled helpers for functions the standard library already provides. The result runs but never reads as F#, and every reviewer pays the translation tax.

**Keep this if you forget everything else**: write F# the way its own standard library does, not the way your first language would. Expressions over statements, values over mutation, data-shaped errors over stringly ones, and the standard tool running the checks.

## What you will be able to do

After this course you can write control flow, collection handling, and error handling in F#'s idiomatic style; reach for the standard library for text, files, dates, and collections before any dependency; write and run the standard script-embedded testing workflow including a failing-test-first cycle; lay out a project and read its hash-pinned lock file; choose the right concurrency primitive from the failure story; and read an unfamiliar idiomatic sample in layers and explain what each part does.

## How this course is organized

[Learning](/en/learn/courses/fsharp-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) sets idiomatic control flow and collections, error handling, and the text, file, and time vocabulary; Intermediate (Examples 26–53) organizes modules and projects with pinned dependencies, tests everything with the standard workflow, and generalizes with generics and value semantics; Advanced (Examples 54–78) surveys concurrency primitives, configures tooling and style, then trains systematic reading of idiomatic code. The [capstone](/en/learn/courses/fsharp-in-depth/learning/capstone/overview) builds a tested grade-book summarizer with a verified transcript, and [drilling](/en/learn/courses/fsharp-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-fsharp](/en/learn/courses/just-enough-fsharp/learning/overview) for F#'s basic syntax, records, unions, and pattern matching. Assumed knowledge: comfort with F#'s basic syntax from just-enough-fsharp. Every example here is F# on .NET, so the primer earns its place from the first page.

## About the examples

Every example is a real F# script executed by the course harness as `dotnet fsi main.fsx` on the pinned .NET 10.0.402 toolchain with no network. Demos that need files read committed fixtures beside the script; scratch writes go to fixed paths under `/tmp` with fixed content and are deleted before exit; nothing reads the live system or the clock. Concurrency demos rendezvous on reply channels with sorted transcripts and never print thread identifiers, dates are constructed fixed values, so outputs are recorded golden files and the lesson embeds every file byte-identically. Every unit is standard library only with no lockfile. Standard output is the asserted golden transcript; standard error is ignored.

## References

- F# language reference and tour (expressions, pattern matching, options, results, collections, async, units of measure). Accessed 2026-10-21. [F# docs](https://learn.microsoft.com/en-us/dotnet/fsharp/)
- F# style guide (naming, formatting, and project organization conventions the course follows). Accessed 2026-10-21. [F# style guide](https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/)
- .NET fundamentals and base class library reference (`System.String`, file IO, `DateTime`, regular expressions, tasks, LINQ). Accessed 2026-10-21. [.NET docs](https://learn.microsoft.com/en-us/dotnet/)
- The pinned .NET 10.0.402 toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific behavior; no example claims behavior the pinned version does not have.
