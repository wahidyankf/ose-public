---
description: >-
  Separates the payload on standard output from every diagnostic on standard error, including a machine-readable error
  body, and fixes what a closed pipe must do.
when_to_use: >-
  Use when deciding which stream any output goes to, when adding a progress indicator or a warning, or when a tool is
  piped into another.
---

# Stream Discipline

## One Rule, Stated Once

**Standard output carries the payload. Standard error carries everything else.**

The payload is what the caller asked for: the matches, the rows, the rendered document, the answer. Everything else is a
diagnostic — errors, warnings, progress, counts, hints, timing, the reassurance that work is happening.

The test is not whether a line is important, and not whether it is bad news. The test is whether a caller who piped the
command into another program wants that line in the pipe. A progress spinner is friendly and belongs on stderr. A
warning may matter more than the result and still belongs on stderr, because a caller parsing the result cannot also
parse a warning that appears at an unpredictable point in the stream.

## Requested Help Is a Payload

`--help` and `--version`, when asked for, go to standard output and exit `0`. The caller asked for that text; it is the
result.

The mirror case is the one tools get wrong. A **usage mistake** is not a request for help. Its diagnostic goes to
standard error and exits `2`, and the usage text must not also be written to standard output. A failed invocation that
leaves output on standard output has told a downstream parser that it produced a result.

This is worth stating because it is a common framework default rather than a decision anyone made. One widely used
command framework emits its usage block on error through a writer the calling program supplies, so a program that points
that writer at standard output silently inherits the defect. Setting the suppression explicitly, at construction rather
than after parsing has already succeeded, is the fix.

## A Machine-Readable Error Body Is Still a Diagnostic

When a tool reports an error as structured data, that body goes to **standard error**, in both its human and its
machine-readable rendering.

This is the one place where the rule is easy to argue against, so it is settled here. A caller running
`tool --output json | parser` on the failure path gets an empty standard output and a parseable error on standard error;
the parser sees no input rather than malformed input, and the error is still machine-readable to anything that looks for
it. Putting the error body on standard output would mean a failing command emits something that parses as a result,
which is precisely the confusion the two streams exist to prevent.

## A Closed Pipe Exits `141`

`tool … | head -1` must end quietly and report `141`, which is the signal status for a closed pipe.

This is the most common real defect in the whole contract, and the remedy differs by runtime, so it needs a named fix
per tool rather than one shared one. Three patterns recur:

- A runtime that ignores the signal turns the closed pipe into an ordinary write error, which, unhandled, becomes a
  crash — and reports a crash status rather than a signal one.
- A runtime that raises the signal on standard output and standard error is already correct and needs nothing; the work
  is confirming that the tool has not defeated the default.
- A runtime whose own documentation prescribes catching the error, redirecting the stream to the null device so the
  exit-time flush cannot raise again, and then exiting `1` is half right. Take the redirect; reject the status. `1`
  means the work completed and found nothing.

In every case a closed pipe produces no diagnostic. The reader went away; there is nobody to tell.

## Buffering

A tool whose output is read incrementally flushes incrementally. Buffering the entire payload and printing once at the
end turns a closed pipe into a single unhandled failure at the very end of the run, and makes a progress indicator
useless, since nothing appears until there is nothing left to wait for.
