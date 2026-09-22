---
description: >-
  Fixes machine-readable output as a versioned contract — how the mode is selected, which fields an error body must
  carry, and why the mode is not a rendering of the human one.
when_to_use: >-
  Use when adding or changing a structured output mode, an error code vocabulary, or a schema another program parses.
---

# Machine-Readable Output

## The Mode Is Selected, Never Guessed

A machine-readable mode is entered by an explicit flag — `--output <format>`, with a shorthand permitted for the common
case. It is never selected by detecting that output is not a terminal.

Detection sounds helpful and is a trap. It makes the tool's contract depend on where it was run, so the same command
emits different shapes in a terminal, in a pipe, in a hook, and in a hosted job. A caller cannot write against that, and
a person debugging it cannot reproduce what the caller saw.

## It Is a Contract, Not a Rendering

Human output may change whenever it reads better. Machine-readable output may not, because something is parsing it.

Every machine-readable document therefore carries a **`schemaVersion`**, and a caller may branch on it. Fields are added
compatibly; a field is never removed, renamed, or given a new meaning under the same version. A change that cannot be
made compatibly raises the version.

Machine-readable output is also clean output. No ANSI escapes, no progress indicator, and no interleaved diagnostic,
unconditionally — even when colour was explicitly forced. A caller that asked for colour and structured data at once
asked for two incompatible things, and the parseable one wins.

## The Error Body

An error reported in a machine-readable mode is a document with an `error` object, written to standard error.

| Field             | Required | Carries                                                 |
| ----------------- | -------- | ------------------------------------------------------- |
| `schemaVersion`   | yes      | The document's version, so a caller can branch on shape |
| `error.code`      | yes      | A stable, namespaced identifier for what went wrong     |
| `error.message`   | yes      | One sentence stating what is wrong, for a person        |
| `error.field`     | no       | The input element at fault, where one applies           |
| `error.retryable` | no       | Whether retrying unchanged could succeed                |

Only the first three are required. A tool whose own policy keeps a caller's rejected input out of every diagnostic — a
reasonable policy, and sometimes a mandatory one — still conforms without `error.field`.

## Codes Are Namespaced and Closed

`error.code` is where all the precision the exit status gave up now lives. It is namespaced by tool and area, in the
shape `tool.area.reason`, and it is a **closed vocabulary**: every code a tool can emit is published, and a new failure
mode adds a code rather than inventing one at the point of failure.

Namespacing is not decoration. A caller aggregating several tools will hold codes from all of them, and unnamespaced
codes collide on exactly the generic names every tool wants — `invalid_arguments`, `not_found`, `timeout`. The namespace
also makes the code searchable in the source that emits it.

A code is as stable as an exit status, and for the same reason. Once a caller branches on it, renaming it breaks that
caller silently. A code whose meaning changes gets a new code; the old one keeps meaning what it meant.

## Streaming

A tool emitting an unbounded or long-running sequence emits one record per line rather than one enclosing document, so a
caller can process results as they arrive rather than waiting for a closing bracket that may be minutes away — or may
never come if the run is interrupted.
