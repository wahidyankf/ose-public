---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

C# In Depth takes you from writing C# to writing it the way its own standard library does: idiomatic control flow, honest error handling, fluent standard-library use, tested code, and tooling with opinions. just-enough-csharp gets you reading and writing C#; this course gets you fluent in it.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-csharp is an explicit primer, yet nobody teaches C#'s idioms, standard library, error handling, and tooling at the depth this subject reaches. Learners translate their first language into C# instead of thinking in it. **Keep this if you forget everything else**: write C# the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use C#'s idiomatic control flow, collections, and error-handling style instead of translating another language's style into it; use C#'s standard library for common tasks (text, files, time, collections) without reaching for a dependency first; write and run C#'s own standard test tooling, including a failing-test-first workflow; package and build a small C# project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic C# code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/csharp-in-depth/learning/overview) holds 78 worked examples in three levels: Beginner (Examples 1-25) covers control flow, collections, error handling, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling and style, and reading idiomatic code. The [capstone](/en/learn/courses/csharp-in-depth/learning/capstone/overview) builds a small receipt-ledger CLI with checks and a golden transcript, and [drilling](/en/learn/courses/csharp-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-csharp for C#'s basic syntax, which every example assumes you can read. Assumed knowledge: comfort with C#'s basic syntax from just-enough-csharp. The prerequisite rubric rules T1 to T4 and L1 were re-run over this course's final text, and the frontmatter prerequisites list the result.

## About the examples

Every example is a complete .NET console project using the standard library only, with no PackageReference lines: there is no supply chain to audit or break. Each unit builds with `dotnet build` and runs its binary in the harness against the recorded output under its own `expected/` folder; testing-convention units run the same shape with a hand-rolled `Check` helper printing `PASS` lines, because the standard `dotnet test` command needs test packages this offline course never fetches; the tooling chapter adds a `warnaserror` check run proving the file passes with warnings as errors. No example needs the network, the clock, or random seeds. The legacy corpus also held release-note pages; those are judged obsolete by this plan (stale version-specific content, not durable course material) and are not migrated.

## References

Provenance for the facts this course teaches, re-verified at writing time since standard-library behavior changes between versions. The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have.

- C# documentation: the language reference and programming guide. Accessed 2026-10-21. [C# docs](https://learn.microsoft.com/en-us/dotnet/csharp/)
- .NET base class library: the standard library reference. Accessed 2026-10-21. [API browser](https://learn.microsoft.com/en-us/dotnet/api/)
- C# coding conventions: the community style guide. Accessed 2026-10-21. [Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Nullable reference types: annotation context and warnings. Accessed 2026-10-21. [Nullable reference types](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references)
- Asynchronous programming: async, await, and cancellation. Accessed 2026-10-21. [Async](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)
- LINQ: query syntax and standard operators. Accessed 2026-10-21. [LINQ](https://learn.microsoft.com/en-us/dotnet/csharp/linq/)
