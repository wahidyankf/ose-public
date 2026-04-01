---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Overview of the jq by-example series: structure, approach, and what to expect from each level"
tags: ["jq", "json", "data-processing", "tutorial", "by-example", "code-first"]
---

This series teaches jq through heavily annotated, self-contained shell examples. Each
example focuses on a single concept and includes inline annotations explaining what
each command does, why that approach is idiomatic, and what output or state results.

## Series Structure

The examples are organized into three levels based on complexity:

- [Beginner](/en/learn/software-engineering/automation-tools/jq/by-example/beginner) —
  Identity filter, field access, array indexing, pipes, basic types, object and array
  construction, iteration, optional operators, and command-line flags
- [Intermediate](/en/learn/software-engineering/automation-tools/jq/by-example/intermediate) —
  `map`, `select`, `reduce`, `group_by`, `sort_by`, `unique_by`, conditionals, string
  functions, path expressions, and type conversions
- [Advanced](/en/learn/software-engineering/automation-tools/jq/by-example/advanced) —
  User-defined functions, recursion, path manipulation, format strings, streaming parser,
  SQL-style joins, environment variables, and real-world API data processing

## Structure of Each Example

Every example follows a consistent five-part format:

1. **Brief Explanation** — what the filter does and why it matters (2-3 sentences)
2. **Mermaid Diagram** — visual representation of data flow or filter composition (when appropriate)
3. **Heavily Annotated Code** — shell commands with `# =>` comments describing each filter stage and its output
4. **Key Takeaway** — the core insight to retain from the example (1-2 sentences)
5. **Why It Matters** — production relevance and real-world impact (50-100 words)

## How to Use This Series

Each page presents annotated shell invocations using `echo '...' | jq '...'` so every
example runs on any machine with jq installed. Read the annotations alongside the code
to understand both the mechanics and the intent. The examples build on each other within
each level, so reading sequentially gives the fullest understanding of how jq filters
compose into real-world pipelines.
