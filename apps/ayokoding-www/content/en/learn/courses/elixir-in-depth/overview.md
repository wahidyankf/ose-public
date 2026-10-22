---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The `just-enough-elixir` primer teaches you to read and write Elixir; this course makes you fluent in it. Across seventy-eight small, independently runnable programs you will absorb the idioms the standard library itself is written in: matching instead of assigning, pipelines instead of nesting, error tuples instead of stringly failures, the standard testing workflow with seeded property-style tables, and the Mix project and dependency conventions every shared project follows.

## Why this exists -- the big idea

**The problem before the solution**: the primer covers syntax in a few hours and stops, while real Elixir work demands idioms, the standard library, error handling, testing, and tooling at production depth. Developers arriving from other languages translate their old habits instead: loops with counters where comprehensions belong, null checks where pattern matches belong, stringly errors where tagged tuples belong, and hand-rolled helpers for functions the standard library already provides. The result runs but never reads as Elixir, and every reviewer pays the translation tax.

**Keep this if you forget everything else**: write Elixir the way its own standard library does, not the way your first language would. Matches over branches, values over mutation, data-shaped errors over stringly ones, and the standard tool running the checks.

## What you will be able to do

After this course you can write control flow, collection handling, and error handling in Elixir's idiomatic style; reach for the standard library for text, files, dates, and collections before any dependency; write and run ExUnit suites including a failing-test-first workflow; lay out a Mix project and read its hash-locked dependency file; choose the right concurrency primitive from the failure story; and read an unfamiliar idiomatic module in layers and explain what each part does.

## How this course is organized

[Learning](/en/learn/courses/elixir-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) sets idiomatic control flow and collections, error handling, and the text, file, and time vocabulary; Intermediate (Examples 26-53) organizes modules and Mix projects with pinned dependencies, tests everything with the standard workflow, and generalizes with protocols, behaviours, streams, and value semantics; Advanced (Examples 54-78) surveys concurrency primitives, tooling, linting, and style, then teaches a systematic way to read idiomatic code. The [capstone](/en/learn/courses/elixir-in-depth/learning/capstone/overview) builds a tested log-summarizer CLI with a verified transcript, and [drilling](/en/learn/courses/elixir-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-elixir](/en/learn/courses/just-enough-elixir/learning/overview) for Elixir's basic syntax, pattern matching, and recursion, and [actor-model-concurrency](/en/learn/courses/actor-model-concurrency/learning/overview) as the sibling course whose OTP concurrency angle this course deliberately surveys rather than repeats. Assumed knowledge: comfort with Elixir's basic syntax from just-enough-elixir. Every example here is Elixir on the BEAM, so the primer earns its place from the first page.

## About the examples

Every example is a real Elixir script executed by the course harness as `elixir main.exs` on the pinned Elixir 1.20.4 toolchain with no network. Demos that need files read committed fixtures beside the script; scratch writes go to fixed paths under `/tmp` with fixed content; nothing reads the live system or the clock. Concurrency demos rendezvous on monitored processes with sorted transcripts and never print process identifiers, seeded generators pin their streams, and dates are constructed fixed values, so outputs are recorded golden files and the lesson embeds every file byte-identically. Every unit is standard library only with no lockfile. Standard output is the asserted golden transcript; standard error is ignored, which matters for the task-crash and compiler-warning examples that log there by design.

## References

- Elixir official documentation and standard-library reference (evaluation model, pattern matching, `Enum`, `String`, `ExUnit`, `Mix`, OTP behaviours). Accessed 2026-10-21. [Elixir docs](https://hexdocs.pm/elixir/)
- Elixir 1.20 changelog and `ExUnit` reference for version-specific behavior, including formatter suppression and the run-summary map. Accessed 2026-10-21. [Elixir changelog](https://github.com/elixir-lang/elixir/blob/main/CHANGELOG.md)
- Mix dependency and lock-file reference for the `mix.exs` requirement operators and the `mix.lock` entry shapes the course reads as data. Accessed 2026-10-21. [Mix deps](https://hexdocs.pm/mix/Mix.Tasks.Deps.html)
- Erlang/OTP standard-library reference for the `:math`, `:lists`, `:crypto`, `:maps`, and `:gb_trees` modules used through interop. Accessed 2026-10-21. [Erlang STDLIB](https://www.erlang.org/doc/apps/stdlib/)
- The pinned Elixir 1.20.4 toolchain in `apps/ayokoding-cli` is the source of truth for any version-specific behavior; no example claims behavior the pinned version does not have.
