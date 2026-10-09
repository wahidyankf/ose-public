---
title: "Drilling Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Recall Q&A

**What makes a record different from an ordinary mutable class?**

<details><summary>Answer</summary>A record declares a transparent data carrier with final component
fields and gets component accessors plus value-oriented equals and hashCode. A component may still
refer to a mutable object, so a record does not guarantee deep immutability.</details>

**Why prefer a sealed hierarchy before an exhaustive pattern switch?**

<details><summary>Answer</summary>The sealed declaration gives the compiler the complete permitted
variant set, so a switch can be checked for coverage without an accidental catch-all.</details>

**What does a bounded wildcard permit?**

<details><summary>Answer</summary>Safe reading as the upper-bound type; it does not permit adding
an arbitrary subtype because the concrete element type is unknown.</details>

## Calculation practice

A list contains 4, 7, 9, 10. Write a streams pipeline that filters even values and sums them. The
answer is 14; state where the pipeline becomes a value rather than a lazy stream.

## Scenario judgment

A method must report that a lookup has no result, but absence is expected rather than exceptional.
Return Optional rather than a sentinel null; reserve exceptions for failure the caller must actively
handle.

## Design exercise

Model a small task board: use a Task record, a sealed status hierarchy, a generic list, a stream
that produces an open-task report, and a test that checks the report. Explain one benefit and one
cost of the chosen representation.

## Automaticity checklist

- [ ] I can create and run a Maven project from the terminal.
- [ ] I can choose a list, map, or set from the required access pattern.
- [ ] I can write a small stream pipeline and explain its terminal operation.
- [ ] I can distinguish identity from value equality.
- [ ] I can make an absence and a failure visible in the type or control flow.

## Why / why not prompts

- Why are records a poor fit for a mutable entity with hidden lifecycle state?
- Why should a stream pipeline not hide a complex side effect?
- Why does equals usually matter more than identity for values?
- Why does a checked exception make a method contract visible?
- Why use a build tool instead of compiling each source file by hand?
