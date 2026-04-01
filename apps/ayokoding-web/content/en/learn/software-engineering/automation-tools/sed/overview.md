---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
---

sed (stream editor) is a non-interactive command-line utility that reads text line by line,
applies a script of editing commands, and writes the result to standard output. It has shipped
with every Unix-like system since the 1970s and remains one of the most portable text-processing
tools available.

## What sed Provides

sed processes text as a stream: it reads one line at a time into its pattern space, applies
commands in the order they appear in the script, then either prints the pattern space or discards
it and moves to the next line. This line-oriented, non-interactive model makes sed ideal for
automated text transformation in shell scripts and pipelines.

## Key Concepts

- **Stream editing**: Text flows through sed one line at a time without loading the entire file
  into memory
- **Addresses**: Numeric line numbers, regex patterns, or ranges that restrict which lines a
  command applies to
- **Commands**: Single-character instructions (`s`, `d`, `p`, `a`, `i`, `c`, `y`, `q`, etc.)
  that transform the current line
- **Pattern space**: The working buffer holding the current line being processed
- **Hold space**: A secondary buffer used to save and retrieve text across line boundaries
- **Regular expressions**: POSIX basic regex (BRE) by default; extended regex (ERE) with `-E`
- **In-place editing**: The `-i` flag rewrites a file directly, optionally creating a backup

## Content in This Section

- [By Example](/en/learn/software-engineering/automation-tools/sed/by-example) —
  Learn sed through 85 heavily annotated examples covering substitution, deletion, insertion,
  addressing, regular expressions, hold space, branching, and real-world text processing.
