---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
---

jq is a lightweight, portable command-line JSON processor that lets you slice, filter,
map, and transform structured JSON data with a concise expression language. It reads JSON
from standard input (or files), applies a filter expression, and writes the result to
standard output — making it an indispensable tool in any shell-based data pipeline.

## What jq Provides

jq treats JSON as first-class data and provides a complete expression language for
transforming it. Filters compose with the pipe operator `|`, enabling you to build
complex transformations from small, focused pieces. Because jq is a single statically
linked binary with no runtime dependencies, it runs identically in CI/CD pipelines,
Docker containers, and developer laptops.

## Key Concepts

- **Filters**: Expressions that consume JSON input and produce JSON output; `.` is the
  identity filter that passes input unchanged
- **Pipes**: The `|` operator chains filters so output of one becomes input of the next
- **Types**: jq natively handles null, boolean, number, string, array, and object
- **Construction**: `{}` and `[]` build new objects and arrays from existing data
- **Built-in Functions**: `map`, `select`, `group_by`, `sort_by`, `reduce`, and many
  more transform collections without explicit loops
- **Conditionals**: `if-then-else`, the alternative operator `//`, and `try-catch`
  handle missing fields and type errors gracefully
- **Reduce**: Fold a stream of values into a single accumulated result
- **Path Expressions**: `path`, `getpath`, `setpath`, and `delpaths` manipulate the
  structural location of values inside JSON documents

## Content in This Section

- [By Example](/en/learn/software-engineering/automation-tools/jq/by-example) —
  Learn jq through 85 heavily annotated examples covering filters, pipes, types,
  object and array construction, built-in functions, conditionals, reduce, and
  real-world JSON processing (95% coverage).
