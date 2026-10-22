---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-csharp](/en/learn/courses/just-enough-csharp/learning/overview) for C#'s basic syntax, which every example here assumes you can already read. Assumed knowledge: comfort with C#'s basic syntax from just-enough-csharp.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-csharp gets you reading and writing C#, but nobody teaches the idioms, standard library, error handling, and tooling at the depth working developers use daily. Learners translate their first language into C# instead of writing C#. **Keep this if you forget everything else**: write C# the way its own standard library and idiomatic style guide do, not the way your first language would.

## Tensions and trade-offs -- when NOT to reach for this

- **Idiom versus intuition**: idiomatic C# often looks plainer than the clever version, and choosing plain costs a small thrill while buying readability for every future reader.
- **Standard library versus dependency**: the base class library covers text, time, sorting, JSON, and files, so reaching outward spends supply-chain budget; spend it only when the standard shape genuinely cannot express the need.
- **When NOT**: web backends live in web-backends-in-csharp-with-aspnetcore, and database migrations live in database-migrations-with-csharp-and-ef-core; this course stays on general-purpose fluency and surveys those angles only so you can recognize them.

## Lineage -- where this sits

C# grew with the .NET runtime: a managed language with value and reference types, LINQ for data, async for concurrency, and nullable analysis for safety. just-enough-csharp teaches the syntax walking in; this course teaches the idioms professionals write with, from guard clauses to records to channels. The base class library is the textbook throughout.

## How this course is organized

[Beginner](/en/learn/courses/csharp-in-depth/learning/beginner) (Examples 1-25) covers control flow, collections, error handling, and standard-library text, file, and time work. [Intermediate](/en/learn/courses/csharp-in-depth/learning/intermediate) (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics. [Advanced](/en/learn/courses/csharp-in-depth/learning/advanced) (Examples 54-78) surveys concurrency deterministically, then tooling, style, interop, and finishes by reading idiomatic code. The [capstone](/en/learn/courses/csharp-in-depth/learning/capstone/overview) ships a small receipt-ledger CLI with checks and a golden transcript, and [drilling](/en/learn/courses/csharp-in-depth/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every example is a .NET console project using the standard library only, with no PackageReference lines: there is no supply chain to audit or break. Each unit builds with `dotnet build` and runs its binary in the harness against the recorded output under its own `expected/` folder; testing-convention units run the same shape with a hand-rolled `Check` helper printing `PASS` lines, because the standard `dotnet test` command needs test packages this offline course never fetches; the tooling chapter adds a `warnaserror` check run proving the file passes with warnings as errors. No example needs the network, the clock, or random seeds: fixed inputs keep every run deterministic. Multi-file units build every source in their folder as one project.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Guard Clause Greeting](/en/learn/courses/csharp-in-depth/learning/beginner#example-1-guard-clause-greeting)
- [Example 2: Switch Expression Grades](/en/learn/courses/csharp-in-depth/learning/beginner#example-2-switch-expression-grades)
- [Example 3: Foreach over Anything](/en/learn/courses/csharp-in-depth/learning/beginner#example-3-foreach-over-anything)
- [Example 4: List Grows on Add](/en/learn/courses/csharp-in-depth/learning/beginner#example-4-list-grows-on-add)
- [Example 5: Dictionary Try Get](/en/learn/courses/csharp-in-depth/learning/beginner#example-5-dictionary-try-get)
- [Example 6: LINQ Deferred Pipeline](/en/learn/courses/csharp-in-depth/learning/beginner#example-6-linq-deferred-pipeline)
- [Example 7: OrderBy Ordinal](/en/learn/courses/csharp-in-depth/learning/beginner#example-7-orderby-ordinal)
- [Example 8: Using Disposes Cleanup](/en/learn/courses/csharp-in-depth/learning/beginner#example-8-using-disposes-cleanup)
- [Example 9: Throw for Exceptional](/en/learn/courses/csharp-in-depth/learning/beginner#example-9-throw-for-exceptional)
- [Example 10: Try Pattern Instead](/en/learn/courses/csharp-in-depth/learning/beginner#example-10-try-pattern-instead)
- [Example 11: When Filters Exceptions](/en/learn/courses/csharp-in-depth/learning/beginner#example-11-when-filters-exceptions)
- [Example 12: Custom Exception Carries Data](/en/learn/courses/csharp-in-depth/learning/beginner#example-12-custom-exception-carries-data)
- [Example 13: Inner Exception Chain](/en/learn/courses/csharp-in-depth/learning/beginner#example-13-inner-exception-chain)
- [Example 14: Throw If Null Guards](/en/learn/courses/csharp-in-depth/learning/beginner#example-14-throw-if-null-guards)
- [Example 15: When All Aggregates](/en/learn/courses/csharp-in-depth/learning/beginner#example-15-when-all-aggregates)
- [Example 16: Exceptions Stay at Boundary](/en/learn/courses/csharp-in-depth/learning/beginner#example-16-exceptions-stay-at-boundary)
- [Example 17: Dispose Despite Errors](/en/learn/courses/csharp-in-depth/learning/beginner#example-17-dispose-despite-errors)
- [Example 18: String Builder Joins Lines](/en/learn/courses/csharp-in-depth/learning/beginner#example-18-string-builder-joins-lines)
- [Example 19: Interpolation and Format](/en/learn/courses/csharp-in-depth/learning/beginner#example-19-interpolation-and-format)
- [Example 20: Regex Finds Patterns](/en/learn/courses/csharp-in-depth/learning/beginner#example-20-regex-finds-patterns)
- [Example 21: Read and Write Files](/en/learn/courses/csharp-in-depth/learning/beginner#example-21-read-and-write-files)
- [Example 22: JSON Round Trip](/en/learn/courses/csharp-in-depth/learning/beginner#example-22-json-round-trip)
- [Example 23: Date and TimeOnly](/en/learn/courses/csharp-in-depth/learning/beginner#example-23-date-and-timeonly)
- [Example 24: TimeSpan Arithmetic](/en/learn/courses/csharp-in-depth/learning/beginner#example-24-timespan-arithmetic)
- [Example 25: Offset Anchors Instants](/en/learn/courses/csharp-in-depth/learning/beginner#example-25-offset-anchors-instants)

### Intermediate (Examples 26–53)

- [Example 26: Namespaces Organize Code](/en/learn/courses/csharp-in-depth/learning/intermediate#example-26-namespaces-organize-code)
- [Example 27: One Type per File](/en/learn/courses/csharp-in-depth/learning/intermediate#example-27-one-type-per-file)
- [Example 28: Access Modifiers Draw Lines](/en/learn/courses/csharp-in-depth/learning/intermediate#example-28-access-modifiers-draw-lines)
- [Example 29: Program Class Shape](/en/learn/courses/csharp-in-depth/learning/intermediate#example-29-program-class-shape)
- [Example 30: Target Framework Pins Runtime](/en/learn/courses/csharp-in-depth/learning/intermediate#example-30-target-framework-pins-runtime)
- [Example 31: Stdlib Only, No Restore](/en/learn/courses/csharp-in-depth/learning/intermediate#example-31-stdlib-only-no-restore)
- [Example 32: Version Pins the Build](/en/learn/courses/csharp-in-depth/learning/intermediate#example-32-version-pins-the-build)
- [Example 33: XML Docs Travel with Build](/en/learn/courses/csharp-in-depth/learning/intermediate#example-33-xml-docs-travel-with-build)
- [Example 34: Debug and Release Modes](/en/learn/courses/csharp-in-depth/learning/intermediate#example-34-debug-and-release-modes)
- [Example 35: First Check Arrange Act Assert](/en/learn/courses/csharp-in-depth/learning/intermediate#example-35-first-check-arrange-act-assert)
- [Example 36: Failing First Proves Check](/en/learn/courses/csharp-in-depth/learning/intermediate#example-36-failing-first-proves-check)
- [Example 37: Data Rows Drive Cases](/en/learn/courses/csharp-in-depth/learning/intermediate#example-37-data-rows-drive-cases)
- [Example 38: Helpers Name the Why](/en/learn/courses/csharp-in-depth/learning/intermediate#example-38-helpers-name-the-why)
- [Example 39: Throws Means Failure Tested](/en/learn/courses/csharp-in-depth/learning/intermediate#example-39-throws-means-failure-tested)
- [Example 40: Async Checks Await](/en/learn/courses/csharp-in-depth/learning/intermediate#example-40-async-checks-await)
- [Example 41: Fake Console Captures Output](/en/learn/courses/csharp-in-depth/learning/intermediate#example-41-fake-console-captures-output)
- [Example 42: Slow Checks Opt Out](/en/learn/courses/csharp-in-depth/learning/intermediate#example-42-slow-checks-opt-out)
- [Example 43: Using Resets Fixtures](/en/learn/courses/csharp-in-depth/learning/intermediate#example-43-using-resets-fixtures)
- [Example 44: Sequence Equal Compares Lists](/en/learn/courses/csharp-in-depth/learning/intermediate#example-44-sequence-equal-compares-lists)
- [Example 45: One Min for All Types](/en/learn/courses/csharp-in-depth/learning/intermediate#example-45-one-min-for-all-types)
- [Example 46: Constraints Name Operations](/en/learn/courses/csharp-in-depth/learning/intermediate#example-46-constraints-name-operations)
- [Example 47: Generic Collections Hold Anything](/en/learn/courses/csharp-in-depth/learning/intermediate#example-47-generic-collections-hold-anything)
- [Example 48: Inference Keeps Calls Clean](/en/learn/courses/csharp-in-depth/learning/intermediate#example-48-inference-keeps-calls-clean)
- [Example 49: Struct Copies, Class Shares](/en/learn/courses/csharp-in-depth/learning/intermediate#example-49-struct-copies-class-shares)
- [Example 50: Readonly Record With](/en/learn/courses/csharp-in-depth/learning/intermediate#example-50-readonly-record-with)
- [Example 51: Record Equals by Value](/en/learn/courses/csharp-in-depth/learning/intermediate#example-51-record-equals-by-value)
- [Example 52: Yield Builds Lazy Pipelines](/en/learn/courses/csharp-in-depth/learning/intermediate#example-52-yield-builds-lazy-pipelines)
- [Example 53: Frozen Lookup Is Fast](/en/learn/courses/csharp-in-depth/learning/intermediate#example-53-frozen-lookup-is-fast)

### Advanced (Examples 54–78)

- [Example 54: Async Main Awaits](/en/learn/courses/csharp-in-depth/learning/advanced#example-54-async-main-awaits)
- [Example 55: When All Fans Out](/en/learn/courses/csharp-in-depth/learning/advanced#example-55-when-all-fans-out)
- [Example 56: Cancel with Token](/en/learn/courses/csharp-in-depth/learning/advanced#example-56-cancel-with-token)
- [Example 57: Lock Guards Total](/en/learn/courses/csharp-in-depth/learning/advanced#example-57-lock-guards-total)
- [Example 58: Concurrent Dictionary Counts](/en/learn/courses/csharp-in-depth/learning/advanced#example-58-concurrent-dictionary-counts)
- [Example 59: Channel Pipes Work](/en/learn/courses/csharp-in-depth/learning/advanced#example-59-channel-pipes-work)
- [Example 60: Parallel Bounded Forest](/en/learn/courses/csharp-in-depth/learning/advanced#example-60-parallel-bounded-forest)
- [Example 61: Interlocked Adds Atomically](/en/learn/courses/csharp-in-depth/learning/advanced#example-61-interlocked-adds-atomically)
- [Example 62: Nullable Flags Missing Nulls](/en/learn/courses/csharp-in-depth/learning/advanced#example-62-nullable-flags-missing-nulls)
- [Example 63: Pragma Tames One Warning](/en/learn/courses/csharp-in-depth/learning/advanced#example-63-pragma-tames-one-warning)
- [Example 64: Names Follow the Guide](/en/learn/courses/csharp-in-depth/learning/advanced#example-64-names-follow-the-guide)
- [Example 65: File Scoped Namespace Tidies](/en/learn/courses/csharp-in-depth/learning/advanced#example-65-file-scoped-namespace-tidies)
- [Example 66: New Syntax Says Less](/en/learn/courses/csharp-in-depth/learning/advanced#example-66-new-syntax-says-less)
- [Example 67: Small Functions Do One Thing](/en/learn/courses/csharp-in-depth/learning/advanced#example-67-small-functions-do-one-thing)
- [Example 68: Flat Beats Nested](/en/learn/courses/csharp-in-depth/learning/advanced#example-68-flat-beats-nested)
- [Example 69: Sizeof Maps the Interop Edge](/en/learn/courses/csharp-in-depth/learning/advanced#example-69-sizeof-maps-the-interop-edge)
- [Example 70: Args Carry the CLI Contract](/en/learn/courses/csharp-in-depth/learning/advanced#example-70-args-carry-the-cli-contract)
- [Example 71: Read LINQ by Stages](/en/learn/courses/csharp-in-depth/learning/advanced#example-71-read-linq-by-stages)
- [Example 72: Read Async by Awaits](/en/learn/courses/csharp-in-depth/learning/advanced#example-72-read-async-by-awaits)
- [Example 73: Read Type by Constructors](/en/learn/courses/csharp-in-depth/learning/advanced#example-73-read-type-by-constructors)
- [Example 74: Read Test by Asserts](/en/learn/courses/csharp-in-depth/learning/advanced#example-74-read-test-by-asserts)
- [Example 75: Read CLI by Switch](/en/learn/courses/csharp-in-depth/learning/advanced#example-75-read-cli-by-switch)
- [Example 76: Read JSON Attributes as Contract](/en/learn/courses/csharp-in-depth/learning/advanced#example-76-read-json-attributes-as-contract)
- [Example 77: Read Using Chains Inside Out](/en/learn/courses/csharp-in-depth/learning/advanced#example-77-read-using-chains-inside-out)
- [Example 78: Read Program Top Down](/en/learn/courses/csharp-in-depth/learning/advanced#example-78-read-program-top-down)
