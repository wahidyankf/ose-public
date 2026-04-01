---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
---

awk is a domain-specific language for text processing and data extraction, designed around the
pattern-action paradigm. It reads input line by line, splits each line into fields, and executes
actions whenever a pattern matches — making it one of the most powerful tools in the Unix
text-processing toolkit for structured data manipulation.

## What awk Provides

awk processes text by scanning each record (line) of input against a set of pattern-action
pairs. When a pattern matches, its associated action executes. Programs can omit the pattern
(action runs on every line) or omit the action (matching lines print by default), making awk
concise for both filtering and transformation tasks.

## Key Concepts

- **Pattern-action pairs**: The core structure `pattern { action }` — patterns select records, actions process them
- **Fields**: Each record splits into numbered fields `$1`, `$2`, ... `$NF` using a field separator
- **Records**: Input lines (or multi-line blocks when RS is changed) — accessed as `$0`
- **Built-in variables**: `NR` (record number), `NF` (number of fields), `FS` (field separator), `OFS` (output field separator), `RS` (record separator), `ORS` (output record separator), `FILENAME`, `FNR`
- **BEGIN and END blocks**: Special patterns that execute before the first record and after the last record
- **Arrays**: Associative arrays (hash maps) for accumulating and cross-referencing data
- **Built-in functions**: String (`split`, `sub`, `gsub`, `match`, `substr`, `index`, `length`, `tolower`, `toupper`, `sprintf`), arithmetic (`sin`, `cos`, `sqrt`, `int`, `rand`), and I/O (`print`, `printf`, `getline`)
- **User-defined functions**: Reusable logic defined with `function name(params) { body }`
- **Regular expressions**: ERE (Extended Regular Expressions) for matching and substitution

## Content in This Section

- [By Example](/en/learn/software-engineering/automation-tools/awk/by-example) —
  Learn awk through 85 heavily annotated examples covering field processing, pattern matching,
  built-in variables, arrays, functions, and real-world text analysis.
