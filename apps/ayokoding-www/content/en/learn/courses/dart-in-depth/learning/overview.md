---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-dart](/en/learn/courses/just-enough-dart/learning/overview) for Dart's basic syntax, which every example here assumes you can already read. Assumed knowledge: comfort with Dart's basic syntax from just-enough-dart.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-dart gets you reading and writing Dart, but nobody teaches the idioms, standard library, error handling, and tooling at the depth working developers use daily. Learners translate their first language into Dart instead of writing Dart. **Keep this if you forget everything else**: write Dart the way its own standard library and idiomatic style guide do, not the way your first language would.

## Tensions and trade-offs -- when NOT to reach for this

- **Idiom versus intuition**: idiomatic Dart often looks plainer than the clever version, and choosing plain costs a small thrill while buying readability for every future reader.
- **Standard library versus dependency**: the standard library covers text, time, JSON, URIs, and files, so reaching outward spends supply-chain budget; spend it only when the stdlib shape genuinely cannot express the need.
- **When NOT**: specialized Flutter widget work lives in its own courses, and platform interop beyond the survey lives with the platform docs; this course stays on general-purpose fluency and surveys those angles only so you can recognize them.

## Lineage -- where this sits

Dart grew out of the need for a productive, familiar language for fast client development: sound null safety, a small core with strong libraries, and tooling with opinions. just-enough-dart teaches the syntax walking in; this course teaches the idioms professionals write with, from control flow to concurrency surveys to reading other people's code. The standard library is the textbook throughout.

## How this course is organized

[Beginner](/en/learn/courses/dart-in-depth/learning/beginner) (Examples 1–25) covers control flow, collections, error handling, and standard-library text, file, and time work. [Intermediate](/en/learn/courses/dart-in-depth/learning/intermediate) (Examples 26–53) covers modules and packages, the testing convention, and generics with value semantics. [Advanced](/en/learn/courses/dart-in-depth/learning/advanced) (Examples 54–78) surveys concurrency deterministically, then tooling, style, and interop, and finishes by reading idiomatic code. The [capstone](/en/learn/courses/dart-in-depth/learning/capstone/overview) ships a small gradebook CLI with checks and a golden transcript, and [drilling](/en/learn/courses/dart-in-depth/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every example is a Dart program using the standard library only, with no dependencies: there is no supply chain to audit or break. Each unit runs with `dart main.dart` in the harness against the recorded output under its own `expected/` folder; testing-convention units run the same command over assert-based checks that mirror the package:test shape, and the toolchain chapter gates two units on `dart format` and `dart analyze` where the lesson is about the tool itself. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic. Multi-file units carry their sibling library files so the module examples build as one unit. The pinned Dart 3.13.5 toolchain in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Hello with an Early Return](/en/learn/courses/dart-in-depth/learning/beginner#example-1-hello-with-an-early-return)
- [Example 2: For Loops Come in Three Shapes](/en/learn/courses/dart-in-depth/learning/beginner#example-2-for-loops-come-in-three-shapes)
- [Example 3: While and Do-While Wait for a Condition](/en/learn/courses/dart-in-depth/learning/beginner#example-3-while-and-do-while-wait-for-a-condition)
- [Example 4: Switch Picks Without Falling Through](/en/learn/courses/dart-in-depth/learning/beginner#example-4-switch-picks-without-falling-through)
- [Example 5: Lists Grow, Slice, and Spread](/en/learn/courses/dart-in-depth/learning/beginner#example-5-lists-grow-slice-and-spread)
- [Example 6: Maps Distinguish Missing Keys from Stored Values](/en/learn/courses/dart-in-depth/learning/beginner#example-6-maps-distinguish-missing-keys-from-stored-values)
- [Example 7: Sets Keep the Uniques and Do the Algebra](/en/learn/courses/dart-in-depth/learning/beginner#example-7-sets-keep-the-uniques-and-do-the-algebra)
- [Example 8: Iterables Transform Lazily with Map, Where, and Fold](/en/learn/courses/dart-in-depth/learning/beginner#example-8-iterables-transform-lazily-with-map-where-and-fold)
- [Example 9: Try-Catch Recovers at the Boundary](/en/learn/courses/dart-in-depth/learning/beginner#example-9-try-catch-recovers-at-the-boundary)
- [Example 10: Catch the Specific Failure First](/en/learn/courses/dart-in-depth/learning/beginner#example-10-catch-the-specific-failure-first)
- [Example 11: Rethrow Keeps the Stack Trace](/en/learn/courses/dart-in-depth/learning/beginner#example-11-rethrow-keeps-the-stack-trace)
- [Example 12: Finally Always Runs](/en/learn/courses/dart-in-depth/learning/beginner#example-12-finally-always-runs)
- [Example 13: Custom Exceptions Carry Fields](/en/learn/courses/dart-in-depth/learning/beginner#example-13-custom-exceptions-carry-fields)
- [Example 14: A Sealed Result Returns Failure as Data](/en/learn/courses/dart-in-depth/learning/beginner#example-14-a-sealed-result-returns-failure-as-data)
- [Example 15: Null Safety Replaces Null Checks](/en/learn/courses/dart-in-depth/learning/beginner#example-15-null-safety-replaces-null-checks)
- [Example 16: Asserts Guard Invariants in Development](/en/learn/courses/dart-in-depth/learning/beginner#example-16-asserts-guard-invariants-in-development)
- [Example 17: Async Failures Travel Through Futures](/en/learn/courses/dart-in-depth/learning/beginner#example-17-async-failures-travel-through-futures)
- [Example 18: StringBuffer Builds Text Without the Copies](/en/learn/courses/dart-in-depth/learning/beginner#example-18-stringbuffer-builds-text-without-the-copies)
- [Example 19: RegExp Finds Every Pattern Match](/en/learn/courses/dart-in-depth/learning/beginner#example-19-regexp-finds-every-pattern-match)
- [Example 20: JSON Encodes and Decodes in a Round Trip](/en/learn/courses/dart-in-depth/learning/beginner#example-20-json-encodes-and-decodes-in-a-round-trip)
- [Example 21: Uri Parses Addresses into Parts](/en/learn/courses/dart-in-depth/learning/beginner#example-21-uri-parses-addresses-into-parts)
- [Example 22: DateTime Parses, Converts, and Formats on Purpose](/en/learn/courses/dart-in-depth/learning/beginner#example-22-datetime-parses-converts-and-formats-on-purpose)
- [Example 23: Files Write and Read Back in Full](/en/learn/courses/dart-in-depth/learning/beginner#example-23-files-write-and-read-back-in-full)
- [Example 24: Durations Add, Compare, and Budget Time](/en/learn/courses/dart-in-depth/learning/beginner#example-24-durations-add-compare-and-budget-time)
- [Example 25: String Cases, Padding, and Splitting Shape Text](/en/learn/courses/dart-in-depth/learning/beginner#example-25-string-cases-padding-and-splitting-shape-text)

### Intermediate (Examples 26–53)

- [Example 26: Imports Arrive with Prefixes](/en/learn/courses/dart-in-depth/learning/intermediate#example-26-imports-arrive-with-prefixes)
- [Example 27: Show and Hide Tame Wide Imports](/en/learn/courses/dart-in-depth/learning/intermediate#example-27-show-and-hide-tame-wide-imports)
- [Example 28: Part Files Split One Library](/en/learn/courses/dart-in-depth/learning/intermediate#example-28-part-files-split-one-library)
- [Example 29: Export Barrels Resell the Shelf](/en/learn/courses/dart-in-depth/learning/intermediate#example-29-export-barrels-resell-the-shelf)
- [Example 30: The Pubspec Pins the Project](/en/learn/courses/dart-in-depth/learning/intermediate#example-30-the-pubspec-pins-the-project)
- [Example 31: Version Strings Compare by Rule, Not by Text](/en/learn/courses/dart-in-depth/learning/intermediate#example-31-version-strings-compare-by-rule-not-by-text)
- [Example 32: No Dependency Is a Decision](/en/learn/courses/dart-in-depth/learning/intermediate#example-32-no-dependency-is-a-decision)
- [Example 33: Doc Comments Feed Dart Doc](/en/learn/courses/dart-in-depth/learning/intermediate#example-33-doc-comments-feed-dart-doc)
- [Example 34: Initialization Runs in a Fixed Order](/en/learn/courses/dart-in-depth/learning/intermediate#example-34-initialization-runs-in-a-fixed-order)
- [Example 35: The First Test Fails, Then Passes](/en/learn/courses/dart-in-depth/learning/intermediate#example-35-the-first-test-fails-then-passes)
- [Example 36: Groups Name the Subject Under Test](/en/learn/courses/dart-in-depth/learning/intermediate#example-36-groups-name-the-subject-under-test)
- [Example 37: Matchers Read Like Sentences](/en/learn/courses/dart-in-depth/learning/intermediate#example-37-matchers-read-like-sentences)
- [Example 38: Setup and Teardown Share the Fixture](/en/learn/courses/dart-in-depth/learning/intermediate#example-38-setup-and-teardown-share-the-fixture)
- [Example 39: Edge Cases Belong in Tables](/en/learn/courses/dart-in-depth/learning/intermediate#example-39-edge-cases-belong-in-tables)
- [Example 40: Async Tests Await Their Futures](/en/learn/courses/dart-in-depth/learning/intermediate#example-40-async-tests-await-their-futures)
- [Example 41: Pure Functions Are the Easiest to Test](/en/learn/courses/dart-in-depth/learning/intermediate#example-41-pure-functions-are-the-easiest-to-test)
- [Example 42: A Fake Replaces the Ledger IO](/en/learn/courses/dart-in-depth/learning/intermediate#example-42-a-fake-replaces-the-ledger-io)
- [Example 43: Name Every Test as One Small Sentence](/en/learn/courses/dart-in-depth/learning/intermediate#example-43-name-every-test-as-one-small-sentence)
- [Example 44: Inject the Clock, Never Read It](/en/learn/courses/dart-in-depth/learning/intermediate#example-44-inject-the-clock-never-read-it)
- [Example 45: Generic Functions Work Over Many Types](/en/learn/courses/dart-in-depth/learning/intermediate#example-45-generic-functions-work-over-many-types)
- [Example 46: A Generic Box Carries Exactly One Type](/en/learn/courses/dart-in-depth/learning/intermediate#example-46-a-generic-box-carries-exactly-one-type)
- [Example 47: Bounded Type Parameters Promise a Shape](/en/learn/courses/dart-in-depth/learning/intermediate#example-47-bounded-type-parameters-promise-a-shape)
- [Example 48: Const Builds Canonical Values](/en/learn/courses/dart-in-depth/learning/intermediate#example-48-const-builds-canonical-values)
- [Example 49: Final Fields Freeze Instances](/en/learn/courses/dart-in-depth/learning/intermediate#example-49-final-fields-freeze-instances)
- [Example 50: CopyWith Derives New Values from Old](/en/learn/courses/dart-in-depth/learning/intermediate#example-50-copywith-derives-new-values-from-old)
- [Example 51: Equality by Value, Not by Identity](/en/learn/courses/dart-in-depth/learning/intermediate#example-51-equality-by-value-not-by-identity)
- [Example 52: Unmodifiable Views Share Safely](/en/learn/courses/dart-in-depth/learning/intermediate#example-52-unmodifiable-views-share-safely)
- [Example 53: Records Carry Shaped Tuples](/en/learn/courses/dart-in-depth/learning/intermediate#example-53-records-carry-shaped-tuples)

### Advanced (Examples 54–78)

- [Example 54: Futures Are Values for Later](/en/learn/courses/dart-in-depth/learning/advanced#example-54-futures-are-values-for-later)
- [Example 55: Async-Await Reads Sequentially](/en/learn/courses/dart-in-depth/learning/advanced#example-55-async-await-reads-sequentially)
- [Example 56: Future.wait Joins Independent Branches](/en/learn/courses/dart-in-depth/learning/advanced#example-56-futurewait-joins-independent-branches)
- [Example 57: Streams Deliver Many Values Over Time](/en/learn/courses/dart-in-depth/learning/advanced#example-57-streams-deliver-many-values-over-time)
- [Example 58: Stream Operators Reshape the Flow](/en/learn/courses/dart-in-depth/learning/advanced#example-58-stream-operators-reshape-the-flow)
- [Example 59: Broadcast Streams Share One Flow](/en/learn/courses/dart-in-depth/learning/advanced#example-59-broadcast-streams-share-one-flow)
- [Example 60: Async-Star Generates Lazily](/en/learn/courses/dart-in-depth/learning/advanced#example-60-async-star-generates-lazily)
- [Example 61: StreamController Bridges Callbacks into Streams](/en/learn/courses/dart-in-depth/learning/advanced#example-61-streamcontroller-bridges-callbacks-into-streams)
- [Example 62: The Toolchain Version Pins the Behavior](/en/learn/courses/dart-in-depth/learning/advanced#example-62-the-toolchain-version-pins-the-behavior)
- [Example 63: Format Check Passes on Formatted Code](/en/learn/courses/dart-in-depth/learning/advanced#example-63-format-check-passes-on-formatted-code)
- [Example 64: Analyze Reports No Issues](/en/learn/courses/dart-in-depth/learning/advanced#example-64-analyze-reports-no-issues)
- [Example 65: Names Follow lowerCamelCase](/en/learn/courses/dart-in-depth/learning/advanced#example-65-names-follow-lowercamelcase)
- [Example 66: Every Public Member Carries Its Doc](/en/learn/courses/dart-in-depth/learning/advanced#example-66-every-public-member-carries-its-doc)
- [Example 67: Prefer Const Where the Value Allows](/en/learn/courses/dart-in-depth/learning/advanced#example-67-prefer-const-where-the-value-allows)
- [Example 68: Lints Catch the Dead Branch Early](/en/learn/courses/dart-in-depth/learning/advanced#example-68-lints-catch-the-dead-branch-early)
- [Example 69: Imports Sort Themselves into Bands](/en/learn/courses/dart-in-depth/learning/advanced#example-69-imports-sort-themselves-into-bands)
- [Example 70: Analysis Options List the Rules as Data](/en/learn/courses/dart-in-depth/learning/advanced#example-70-analysis-options-list-the-rules-as-data)
- [Example 71: Read the Shape First, the Lines Second](/en/learn/courses/dart-in-depth/learning/advanced#example-71-read-the-shape-first-the-lines-second)
- [Example 72: Follow the Pipeline Through Its Stages](/en/learn/courses/dart-in-depth/learning/advanced#example-72-follow-the-pipeline-through-its-stages)
- [Example 73: Spot the Result Type at Every Turn](/en/learn/courses/dart-in-depth/learning/advanced#example-73-spot-the-result-type-at-every-turn)
- [Example 74: Trace the Event Bus End to End](/en/learn/courses/dart-in-depth/learning/advanced#example-74-trace-the-event-bus-end-to-end)
- [Example 75: Name the Retry Pattern Before Reading It](/en/learn/courses/dart-in-depth/learning/advanced#example-75-name-the-retry-pattern-before-reading-it)
- [Example 76: The Cache Hides Behind a LinkedHashMap](/en/learn/courses/dart-in-depth/learning/advanced#example-76-the-cache-hides-behind-a-linkedhashmap)
- [Example 77: Extensions Add Verbs to Borrowed Types](/en/learn/courses/dart-in-depth/learning/advanced#example-77-extensions-add-verbs-to-borrowed-types)
- [Example 78: Explain It in Five Lines](/en/learn/courses/dart-in-depth/learning/advanced#example-78-explain-it-in-five-lines)
