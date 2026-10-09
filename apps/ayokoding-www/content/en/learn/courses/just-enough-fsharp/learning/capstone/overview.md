---
title: "Capstone: Expression Evaluator"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Build a small evaluator for arithmetic expressions. The provided
[`Program.fs`](./code/Program.fs) uses a recursive discriminated union to describe legal expression
shapes, a record to name a request, exhaustive matching to evaluate it, and `Result` to carry an
expected division error. A pipeline formats the successful value.

## Run and inspect

From `learning/capstone/code`, run `dotnet run`. The built-in assertions cover addition,
successful division, and division by zero. If they pass, the program prints `Ok "sum: 5"`.
The source is intentionally one small file with no third-party dependency.

## Extend it

1. Before editing, predict what `Add(Number 2, Divide(Number 8, Number 2))` returns.
2. Add `Multiply of Expr * Expr` and its evaluator branch. Add an assertion for
   `Multiply(Number 3, Number 4) = Ok 12`.
3. Add an assertion for a nested zero-divisor expression. Confirm its `Error` reaches `render`
   without becoming a successful string.

A complete solution handles every union case, keeps the original request record unchanged, and
passes the assertions when run. If the exercise grows into a parser, UI, or service, that is a
separate project beyond this primer.
