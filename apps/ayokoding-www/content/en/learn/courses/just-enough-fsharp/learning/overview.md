---
title: "Learning Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Work through the examples in order, even if you already know another functional language. Each example
stands alone, so you can return to a single concept without copying earlier code.

## Route through the primer

1. [Beginner examples 1–26](./beginner.md) cover bindings, functions, core collections, records, unions,
   `Option`, `Result`, and data transformation.
2. [Intermediate examples 27–52](./intermediate.md) add recursion, matching, keyed collections,
   .NET interop, and simple object boundaries.
3. [Advanced examples 53–78](./advanced.md) combine the core features in parsing, tree traversal,
   error propagation, lazy and asynchronous workflows, and the final evaluator sketch.
4. [Capstone: Expression Evaluator](./capstone/overview.md) asks you to consolidate the central ideas
   in one short program. Use the [drills](../drilling/overview.md) to check recall and transfer.

## Run and check an example

Install a .NET 10 SDK. From an example's folder under [learning/code](./code/README.md), run
`dotnet fsi main.fsx`. Read the code, predict the printed value, and then compare it with the
**Observe** block. Change one input and explain the result before moving on. The code on each
lesson page is the complete source of its colocated script.

## Learning goals

By the end, you should be able to choose a record for named data, a union for alternatives,
`Option` for expected absence, and `Result` when a failure needs an explanation. You should also
be able to trace a pipeline and a recursive match without hidden mutation. The capstone is the
boundary of this primer; more elaborate compiler or application design belongs in later study.
