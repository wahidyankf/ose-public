---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Bash](../just-enough-bash/learning/overview.md) (pipes,
  redirection, exit statuses, quoting, and strict mode). Every worked example in this course is
  a shell script that invokes `awk`, `sed`, or `jq`, so the pipe-and-redirect habits from
  that course earn their place from the first page.
- **Tools & environment**: a terminal with `awk`, `sed`, and `jq` (the harness pins GNU awk,
  GNU sed, and jq on Debian with no network; any recent macOS or Linux terminal runs every
  example because the course sticks to portable constructs); a text editor.
- **Assumed knowledge**: running commands in a shell; sending one program's output into
  another with `|`; redirecting output to a file; quoting arguments that contain spaces.

## Why this exists -- the big idea

**The problem before the solution**: shell users learn `grep`, `cut`, and `sort` early, then
stall. The moment a task stops being "find these lines" and starts being "reformat this
column, renumber these rows, reshape this JSON", they reach for a ten-line Python script --
or worse, a chain of six single-purpose tools duct-taped together -- because nobody taught
them the three pattern languages that live one keystroke away. `awk` has its own language
of fields and actions. `sed` has its own language of addresses and substitutions. `jq` has
its own language of filters over JSON. Each one replaces a script; used together, they
replace a program.

**The one idea worth keeping if you forget everything else**: awk thinks in fields and
records, sed thinks in addresses and substitutions, jq thinks in a filter pipeline over
JSON. Name the shape of your text -- columns, lines, or JSON -- and the tool picks itself:
columns mean awk, line surgery means sed, JSON means jq. Everything else in this course is
that sentence worked out in forty-eight examples.

This course is **deliberately a toolbox, not a language course**. Three small, related tool
languages each get their own themed walkthrough with diagrams of the field, address, and
filter models, because a dedicated concept page per idea beats one undifferentiated list of
forty-eight tricks. The sixteen concepts below are the whole vocabulary; every example names
the ones it exercises, and the drilling page makes you use each one twice.

## How this course is organized

- **[Learning](./learning/overview.md)** -- 48 worked examples in nine themes, each a
  runnable shell script with its committed input fixtures and recorded output:
  - **Theme A -- [awk Fields and Records](./learning/theme-a-awk-fields-and-records.md)**
    (Examples 1-5) -- splitting lines into fields, changing the separator, numbering lines,
    counting fields, reformatting output.
  - **Theme B -- [awk Patterns and Functions](./learning/theme-b-awk-patterns-and-functions.md)**
    (Examples 6-10) -- selecting rows by pattern and range, aggregating a column, writing
    your own functions, cleaning strings with built-ins.
  - **Theme C -- [sed Addressing](./learning/theme-c-sed-addressing.md)** (Examples 11-15)
    -- printing and deleting by line number, range, pattern, and negation.
  - **Theme D -- [sed Substitution and Hold Space](./learning/theme-d-sed-substitution-and-hold-space.md)**
    (Examples 16-21) -- first and global substitution, capture groups, reformatting with
    back-references, joining lines with the hold space and `N`.
  - **Theme E -- [jq Filters and the Pipe](./learning/theme-e-jq-filters-and-the-pipe.md)**
    (Examples 22-27) -- picking fields, walking arrays, `select`, chaining with `|`,
    defaults for missing data, emitting raw text.
  - **Theme F -- [jq Object and Array Construction](./learning/theme-f-jq-object-and-array-construction.md)**
    (Examples 28-33) -- building objects, renaming keys, `map`, `reduce`, `group_by`,
    sorting and deduplicating.
  - **Theme G -- [Combined Pipelines](./learning/theme-g-combined-pipelines.md)**
    (Examples 34-38) -- the three tools composed with each other and with `grep`, `cut`,
    and `sort`; streaming versus loading the whole file.
  - **Theme H -- [Idempotence and Safety](./learning/theme-h-idempotence-and-safety.md)**
    (Examples 39-43) -- substitutions that are safe to run twice, fenced edits, dry runs.
  - **Theme I -- [Choosing the Right Tool](./learning/theme-i-choosing-the-right-tool.md)**
    (Examples 44-48) -- which tool fits which shape of text, when to leave the toolbox,
    and a decision checklist you can run on any new task.
  - **[Capstone](./learning/capstone/overview.md)** -- a log-and-JSON report pipeline:
    parse a fixed-width log with awk, redact sensitive fields with sed, reshape a JSON API
    fixture with jq, and chain all three into one summary report with a golden expected file.

- **[Drilling](./drilling/overview.md)** -- recall questions, applied tool-choice problems,
  five hands-on katas, a self-check checklist, and design trade-off prompts.

## What this course is not

General shell scripting lives in `just-enough-bash` (quoting, variables, loops, functions,
strict mode) and `advanced-shell-scripting-in-depth` (larger script architecture). This
course assumes those habits and teaches only the three text-processing languages: awk's
fields and actions, sed's addresses and substitutions, and jq's filter pipeline. If an
example needs a loop, it is an awk loop over records, not a bash `for` loop -- the shell
here is the launcher, never the language being taught.
