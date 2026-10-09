---
title: "Drilling Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Use these prompts after the [examples](../learning/overview.md). Predict or write an answer first,
then open the explanation. Revisit the linked example if you cannot explain the result without
running it.

## Recall

**1. When should a value be a record rather than a tuple?**

<details><summary>Answer</summary>Use a record when field names carry lasting meaning, as in
[example 16](../learning/beginner.md#example-16-records-with-named-fields). A short tuple fits
positions that are obvious locally.</details>

**2. What information does `Result` retain that `Option` does not?**

<details><summary>Answer</summary>`Result` can carry an error value that explains an expected
failure. `Option` reports only presence or absence; compare
[examples 20 and 21](../learning/beginner.md#example-20-option-for-expected-absence).</details>

**3. Why is a union a better expression-tree model than string tags?**

<details><summary>Answer</summary>The union declares the legal cases and payload types in one
place. Pattern matching extracts those payloads and lets the compiler check missing cases;
see [example 44](../learning/intermediate.md#example-44-recursive-union-for-a-tree).</details>

## Trace before running

**4.** Predict the result of `List.fold (fun total value -> total + value) 10 [2; 3]`.

<details><summary>Answer</summary>The accumulator starts at 10, then becomes 12 and 15.
The result is `15`; compare [example 26](../learning/beginner.md#example-26-fold-an-aggregate).</details>

**5.** In [example 78](../learning/advanced.md#example-78-assemble-a-small-evaluator),
what does `Divide(Number 7, Number 0)` return? Where is the zero detected?

<details><summary>Answer</summary>It returns `Error "division by zero"`. The `Divide` match
evaluates both children, then its `Ok _, Ok 0` branch rejects the divisor before integer division.</details>

**6.** If a pipeline maps `[1; 2; 3]` with `fun n -> n * 2` and then filters odd values,
what remains? Would reversing those steps mean the same thing?

<details><summary>Answer</summary>The mapped values are `[2; 4; 6]`, so filtering odd values
leaves `[]`. Filtering the original odds first and then doubling produces `[2; 6]`.
Stage order changes the meaning; see [example 22](../learning/beginner.md#example-22-pipeline-operator).</details>

## Repair and adapt

**7.** Change [example 39](../learning/intermediate.md#example-39-tryparse-for-untrusted-text)
so a failed parse returns `Error "invalid integer"` and a successful one returns `Ok value`.
Why does the `text: string` annotation matter?

<details><summary>Answer</summary>Match on `System.Int32.TryParse text` with `true, value -> Ok value`
and `false, _ -> Error "invalid integer"`. The annotation selects the string overload of
`TryParse`; without it, multiple overloads can fit an unconstrained input.</details>

**8.** Add a `Multiply of Expr * Expr` case to [example 45](../learning/intermediate.md#example-45-evaluate-a-recursive-union).
What else must change?

<details><summary>Answer</summary>Add a `Multiply(left, right)` branch to the evaluator and
multiply the two recursive results. A nonexhaustive match warning points to the missing case.</details>

**9.** Modify [example 65](../learning/advanced.md#example-65-update-a-map-immutably)
to reject an existing key rather than replace it. Which return type communicates the rejection?

<details><summary>Answer</summary>Check `Map.containsKey key original` before `Map.add`.
Return `Error "duplicate key"` for an existing key and `Ok updatedMap` otherwise, so the
caller can distinguish rejection from success.</details>

## Ready for the capstone?

- [ ] I can write a complete match for every case of a small union.
- [ ] I can explain when an absent value should be `None` and when a failure should be `Error`.
- [ ] I can trace an immutable record update and a pipeline from input to output.
- [ ] I can run `dotnet fsi main.fsx` and explain a compiler diagnostic.
- [ ] I can predict both the success and zero-divisor paths through the evaluator.
