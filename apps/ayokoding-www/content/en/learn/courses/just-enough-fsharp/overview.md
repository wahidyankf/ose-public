---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

This F# primer is for developers who already know [functional programming](../functional-programming/learning/overview.md)
and [object-oriented programming essentials](../object-oriented-programming-essentials/learning/overview.md).
It teaches enough F# to read and write small functional programs on .NET, ending with an expression evaluator.

## What you will be able to do

- Run an F# script with `dotnet fsi` and a small project with the .NET CLI.
- Model data with records and discriminated unions, then use pattern matching to handle every case.
- Transform collections with functions and pipelines while keeping expected absence and failure explicit with `Option` and `Result`.
- Call a few .NET APIs and choose a simple asynchronous boundary when needed.
- Explain the evaluator's recursive tree walk and test both successful and invalid expressions.

## Scope and path

The [learning path](./learning/overview.md) has 78 standalone examples in three levels. The [drills](./drilling/overview.md)
ask you to predict, repair, and adapt the examples, and the [capstone](./learning/capstone/overview.md)
combines the core ideas in a small program. This is a functional-first .NET on-ramp for later
language-tooling and application work, not a complete F# or .NET reference. Start with a .NET 10 SDK;
that is the version used to run the examples here.

## Sources

The examples follow the official [F# language reference](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/),
including its pages on [records](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/copy-and-update-record-expressions),
[discriminated unions](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/discriminated-unions),
[pattern matching](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/pattern-matching),
[options](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/options), and
[results](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/results).
See [F# Interactive](https://learn.microsoft.com/en-us/dotnet/fsharp/tools/fsharp-interactive/) for script use
and [.NET releases and support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support) for SDK support.
The code is original course material and uses only the SDK toolchain.
