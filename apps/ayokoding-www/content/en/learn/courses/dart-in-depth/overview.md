---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Dart In Depth takes you from writing Dart to writing it the way its own standard library does: idiomatic control flow, honest error handling, fluent standard-library use, tested code, and tooling with opinions. just-enough-dart gets you reading and writing Dart; this course gets you fluent in it.

## Why this exists -- the big idea

**The problem before the solution**: just-enough-dart is an explicit primer, yet nobody teaches Dart's idioms, standard library, error handling, and tooling at the depth working developers use daily. Learners translate their first language into Dart instead of thinking in it. **Keep this if you forget everything else**: write Dart the way its own standard library and idiomatic style guide do, not the way your first language would.

## What you will be able to do

After this course you can use Dart's idiomatic control flow, collections, and error-handling style instead of translating another language's style into it; use Dart's standard library for common tasks (text, files, time, collections) without reaching for a dependency first; write and run Dart's own standard test tooling shape, including a failing-test-first workflow; package and build a small Dart project the idiomatic way, including its dependency and version-pinning convention; and read and explain a non-trivial, idiomatic Dart code sample written by someone else.

## How this course is organized

[Learning](/en/learn/courses/dart-in-depth/learning/overview) holds 78 worked examples in three levels: Beginner (Examples 1-25) covers control flow, collections, error handling, and standard-library text, files, and time; Intermediate (Examples 26-53) covers modules and packages, the testing convention, and generics with value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling and style, and reading idiomatic code. The [capstone](/en/learn/courses/dart-in-depth/learning/capstone/overview) builds a small gradebook CLI with checks and a golden transcript, and [drilling](/en/learn/courses/dart-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-dart for Dart's basic syntax, which every example assumes you can read. Assumed knowledge: comfort with Dart's basic syntax from just-enough-dart. The prerequisite rubric rules T1 to T4 and L1 were re-run over this course's final text, and the frontmatter prerequisites list the result.

## About the examples

Every example is a complete Dart program using the standard library only, with no dependencies: there is no supply chain to audit or break. Each unit runs with `dart main.dart` in the harness against the recorded output under its own `expected/` folder; testing-convention units run the same command over assert-based checks with timing normalized away, and the toolchain chapter runs `dart format` and `dart analyze` where the lesson is about the tool itself. No example needs the network, the clock, or random seeds. Multi-file units (the part-file and barrel examples) run their `main.dart` against sibling library files in the same unit. The legacy corpus also held setup and quick-start pages; those belong to the primer layer and are not migrated here.

## References

Provenance for the facts this course teaches, re-verified at writing time since standard-library behavior changes between versions. The pinned toolchain version in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API; no example claims a behaviour the pinned version does not have.

- Dart language documentation: the language tour and reference. Accessed 2026-10-21. [Dart language](https://dart.dev/language)
- Dart core libraries: the standard-library API reference. Accessed 2026-10-21. [Core libraries](https://api.dart.dev/)
- Effective Dart: the idiomatic style guide. Accessed 2026-10-21. [Effective Dart](https://dart.dev/effective-dart)
- Dart tools: formatter, analyzer, and test runner. Accessed 2026-10-21. [Dart tools](https://dart.dev/tools)
- Dart package layout: the pubspec format and version rules. Accessed 2026-10-21. [Pubspec format](https://dart.dev/tools/pub/pubspec)
