---
title: "rhino-cli: Rust to F# Rewrite — Measured Outcome"
description: "The durable, measured comparison record from rewriting rhino-cli from Rust to F#, for the next language-change proposal to start from data rather than argument"
category: explanation
subcategory: prog-lang
tags:
  - programming-languages
  - rust
  - fsharp
  - benchmark
  - decision-record
created: 2026-08-30
---

# rhino-cli: Rust to F# Rewrite — Measured Outcome

**rhino-cli was rewritten from Rust to F# and merged to `main` in both `ose-public` and
the private sibling on 2026-08-30**, closing out the `rewrite-rhino-cli-to-fsharp` plan. This page is the
durable home for that rewrite's measured comparison, so the next proposal to change a component's
implementation language starts from data rather than argument. Full commands, both repositories'
raw figures, and per-row methodology notes live in that plan's `benchmark.md` (archived with the
plan); this page carries only the distilled, lasting comparison.

## The comparison

| Axis                                 | Rust (before)                      | F# (after)                                   | Verdict                                  |
| ------------------------------------ | ---------------------------------- | -------------------------------------------- | ---------------------------------------- |
| Cold build                           | 17.59 s                            | 10.38 s                                      | **F# better** (Δ -7.21 s)                |
| Gate-profile build (what CI runs)    | 21.09 s                            | 10.82 s                                      | **F# better** (Δ -10.27 s)               |
| Warm no-op build                     | 0.18 s                             | 1.15 s                                       | unchanged — within measurement noise     |
| Edit-rebuild loop (one file touched) | 0.37 s                             | 10.37 s                                      | **F# worse, ~28x** (Δ +10.00 s)          |
| Startup, mean of 50 invocations      | 7.47 ms                            | 71.2 ms                                      | **F# worse, ~9.5x** (Δ +63.73 ms)        |
| Full `.husky/pre-commit` hook        | 14.24 s                            | 4.19 s                                       | **F# better** (Δ -10.05 s)               |
| CI critical path, build job          | 70.67 s                            | 158.00 s                                     | provisional — Before baseline confounded |
| Artifact / deployable footprint      | 4,489,568 B (single static binary) | 92,996,313 B self-contained payload (~89 MB) | **F# worse, ~20.7x**                     |
| Source size (non-blank, non-comment) | 49,460 lines                       | 19,710 lines                                 | **F# better, 0.40x** (~60% fewer lines)  |

## What actually mattered

**F# has no per-file incremental compilation within one `.fsproj`.** Touching any single source
file recompiles the whole project and relinks every downstream project. This is the rewrite's
single worst finding — Rust's incremental compiler cache made an edit-rebuild loop nearly free
(0.37 s); F#'s equivalent cost is indistinguishable from a cold build (10.37 s vs. 10.38 s). Any
future language choice for a CLI with a tight edit-test loop should weigh this directly.

**Self-contained .NET publishing has a real deployment cost.** The published launcher binary alone
is small, but it is non-functional without ~89 MB of runtime DLLs and native libraries alongside
it. Rust's static binary needs nothing else. A component that is distributed or downloaded
repeatedly (rhino-cli's own CI pipeline downloads its artifact 9 times per run) pays this cost on
every transfer.

**Once the whole toolchain retirement is counted, not just per-invocation startup, F# won the
metric that matters most day to day.** Per-invocation startup is ~9.5x slower for F#, but the full
pre-commit hook — which is what a contributor actually feels — got faster, not slower, because most
of that hook's cost was never rhino-cli's own startup time. A narrow per-invocation benchmark alone
would have predicted the wrong outcome here.

**Fewer lines, once the code is real.** An early spike prototype (3,770 lines) badly under-predicted
the real port's size (19,710 lines) — a prototype is not a substitute for measuring the finished
thing. But even the real port needed roughly 60% fewer non-blank, non-comment lines than the Rust
original for equivalent behaviour.

## For the next language-change proposal

- Measure the **edit-rebuild loop**, not just cold build and startup — it is where this rewrite's
  worst regression hid.
- Measure the **full deployable artifact**, not the single launcher file, for any runtime that
  publishes a self-contained bundle.
- Measure the **whole day-to-day workflow** (a full pre-commit hook, a full CI run), not only the
  micro-benchmark a per-invocation number implies — the two can point in opposite directions.
- Do not extrapolate from a small spike's source-size or timing figures to the real port; both
  moved by more than 5x here.
