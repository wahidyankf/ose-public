---
title: "Intermediate"
weight: 10000002
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Intermediate sed examples covering advanced regex, backreferences, hold space, multiline operations, branching, and script files"
tags: ["sed", "stream-editor", "text-processing", "tutorial", "by-example", "code-first", "intermediate"]
---

This tutorial covers intermediate sed concepts through 28 self-contained, heavily annotated shell
examples. The examples build on beginner addressing and substitution to cover capture groups,
extended regex, hold space operations, multiline processing with `N`/`P`/`D`, labels and
branching, negated addresses, and practical text transformation patterns — spanning 35-70%
of sed features.

## Capture Groups and Backreferences

### Example 29: Capture Groups and `\1` Backreferences

Parentheses `\(` and `\)` in basic regex (BRE) capture the matched text into a numbered
group. `\1`, `\2`, etc. reference those groups in the replacement string. This is the most
powerful substitution technique in sed.

```bash
# Swap first and last name
echo "Smith John" | sed 's/\([A-Za-z]*\) \([A-Za-z]*\)/\2 \1/'
# => \([A-Za-z]*\) captures a word into group \1 (first name here: "Smith")
# => A space separates the two capture groups
# => \([A-Za-z]*\) captures the second word into group \2 ("John")
# => Replacement \2 \1 reverses order to "John Smith"
# => Output: John Smith
```

**Key takeaway:** `\(pattern\)` captures matched text into a numbered group; `\1` through `\9`
reference captured groups in the replacement — this is BRE syntax (no `-E` flag needed).

**Why it matters:** Data normalization is one of the most frequent sed tasks. Swapping name
order, reformatting dates from `YYYY-MM-DD` to `DD/MM/YYYY`, or wrapping a value in quotes
all require capturing the existing content and rearranging it. Backreferences make these
transformations safe: you reference what was actually there rather than hardcoding a value.

---

### Example 30: Reformatting Dates with Backreferences

A classic backreference application is reformatting date strings. This example converts ISO
8601 dates (`YYYY-MM-DD`) to a different display format.

```bash
# Convert YYYY-MM-DD to DD/MM/YYYY
echo "Event date: 2026-04-01" | sed 's/\([0-9]\{4\}\)-\([0-9]\{2\}\)-\([0-9]\{2\}\)/\3\/\2\/\1/'
# => Group 1 \([0-9]\{4\}\) captures the year "2026"
# => - literal hyphen between groups
# => Group 2 \([0-9]\{2\}\) captures the month "04"
# => Group 3 \([0-9]\{2\}\) captures the day "01"
# => Replacement \3\/\2\/\1 outputs day/month/year with / separators
# => Output: Event date: 01/04/2026
```

**Key takeaway:** Multiple capture groups with `\1`..`\9` enable complete date format
conversion in a single substitution expression.

**Why it matters:** Date format normalization is a mandatory step when ingesting data from
multiple sources into a single system. European (DD/MM/YYYY), American (MM/DD/YYYY), and ISO
(YYYY-MM-DD) formats coexist in the wild. sed date conversion handles millions of records in
a pipeline with no scripting overhead.

---

### Example 31: Extended Regex with `-E`

The `-E` flag (or `-r` on some systems) activates extended regular expressions (ERE). ERE uses
unescaped `(`, `)`, `|`, `+`, `?`, and `{n}` — removing the backslash noise of BRE.

```bash
# BRE requires backslashes before grouping metacharacters
echo "color colour" | sed 's/colo\(u\?r\)/shade/g'
# => BRE: \( \) for groups, \? for optional char — verbose
# => Output: shade shade

# ERE with -E: no backslashes before metacharacters
echo "color colour" | sed -E 's/colou?r/shade/g'
# => -E enables ERE syntax
# => u? means "zero or one u" without backslash
# => Output: shade shade
```

**Key takeaway:** `-E` switches sed to extended regex (ERE), where `(`, `)`, `+`, `?`, `|`,
and `{n,m}` work without backslashes — ERE scripts are significantly more readable.

**Why it matters:** BRE backslash requirements make complex patterns hard to read and easy to
get wrong. ERE syntax matches POSIX ERE, Python `re`, and most modern regex engines, so
patterns are more transferable. Always use `-E` for non-trivial regex to reduce escaping bugs.

---

### Example 32: Alternation with `|`

In ERE (`-E`), the pipe `|` means "or" — it matches either the left or right expression. In
BRE, alternation requires `\|` (GNU extension) or multiple separate sed commands.

```bash
# Match and remove lines containing "foo" OR "bar"
printf "keep this\nfoo line\nbar line\nkeep too\n" | sed -E '/foo|bar/d'
# => -E enables ERE
# => foo|bar matches any line containing "foo" or "bar"
# => d deletes matched lines
# => Output:
# => keep this
# => keep too

# Substitute either variant
echo "grey and gray" | sed -E 's/gr(e|a)y/color/g'
# => (e|a) captures either "e" or "a" — matches "grey" and "gray"
# => Output: color and color
```

**Key takeaway:** In ERE (`-E`), `|` provides alternation between patterns; use `(a|b)` to
alternate within a larger pattern.

**Why it matters:** British/American spelling variants, multiple log level names, or synonym
normalization all require matching one of several alternatives. Alternation in a single pattern
is cleaner than multiple `-e` expressions and faster than two separate sed passes.

---

### Example 33: POSIX Character Classes

POSIX character classes like `[:alpha:]`, `[:digit:]`, `[:space:]`, and `[:alnum:]` are
portable across locales. They should be preferred over ASCII ranges like `[a-z]` or `[0-9]`
for maximum portability.

```bash
# Remove all non-alphanumeric characters
echo "Hello, World! 123." | sed 's/[^[:alnum:] ]//g'
# => [^[:alnum:] ] matches any character that is NOT alphanumeric or space
# => g replaces all such characters
# => Output: Hello World 123

# Extract only digits
echo "Price: $42.99 each" | sed 's/[^[:digit:]]//g'
# => [^[:digit:]] matches any non-digit character
# => Removing all non-digits leaves only the numeric characters
# => Output: 4299
```

**Key takeaway:** POSIX bracket expressions like `[[:alpha:]]`, `[[:digit:]]`, and
`[[:alnum:]]` are locale-aware and more portable than `[a-z]` or `[0-9]` ranges.

**Why it matters:** Scripts that run in environments with non-ASCII locales can produce
unexpected results when using ASCII character ranges. POSIX character classes delegate
character classification to the locale system, ensuring correct behavior for international
text without changing the script.

---

## Negated Addresses

### Example 34: Negated Address with `!`

Appending `!` to any address inverts its meaning — the command runs on every line that does
NOT match the address. This is the complement operator for sed addresses.

```bash
# Delete all lines EXCEPT those matching "keep"
printf "remove this\nkeep this\nremove too\nkeep that\n" | sed '/keep/!d'
# => /keep/ addresses lines containing "keep"
# => ! inverts: command runs on lines NOT matching /keep/
# => d deletes those non-matching lines
# => Output:
# => keep this
# => keep that

# Print only non-blank lines
printf "a\n\nb\n\nc\n" | sed -n '/^$/!p'
# => /^$/ matches blank lines; ! inverts to non-blank lines
# => -n + p prints only non-blank lines
# => Output:
# => a
# => b
# => c
```

**Key takeaway:** `address!command` runs the command on every line that does NOT match the
address — it is the logical negation of any sed address.

**Why it matters:** Many filtering tasks are easier to express as "delete everything except
what I want" rather than "print what I want". The `!` operator makes this natural and avoids
the need to construct complex complementary patterns.

---

### Example 35: Negating a Line Range

`!` applies to ranges as well as single addresses. `start,end!` runs the command on all lines
outside the range — lines before `start` and lines after `end`.

```bash
# Replace text only outside the header block (lines 1-3)
printf "=== HEADER ===\nTitle: Report\nDate: 2026\ndata1\ndata2\ndata3\n" \
  | sed '1,3!s/data/RECORD/'
# => 1,3 is the address range covering lines 1-3
# => ! inverts: command applies to lines 4 onwards
# => s/data/RECORD/ runs only outside the header
# => Output:
# => === HEADER ===
# => Title: Report
# => Date: 2026
# => RECORD1
# => RECORD2
# => RECORD3
```

**Key takeaway:** `start,end!command` applies the command to all lines outside the specified
range — a clean way to protect a header or footer from transformation.

**Why it matters:** Many files have structured preambles (shebangs, license headers, YAML
front matter) that must not be modified when transforming the body content. Range negation
protects these sections without requiring two separate passes or a complex address calculation.

---

## Hold Space

### Example 36: Save to Hold Space with `h` and Retrieve with `g`

The hold space is a secondary buffer separate from the pattern space. `h` copies the pattern
space into the hold space. `g` copies the hold space back into the pattern space, replacing
its current content.

```bash
# Save first line and append it after last line
printf "HEADER\ndata1\ndata2\n" | sed -n '1h; 1!p; ${g;p}'
# => 1h: on line 1, copy "HEADER" to hold space
# => 1!p: on lines NOT 1, print the pattern space
# => ${g;p}: on last line ($), copy hold space back to pattern, then print
# => Output:
# => data1
# => data2
# => HEADER
```

**Key takeaway:** `h` saves the pattern space to hold space; `g` restores hold space to pattern
space — together they enable cross-line data manipulation.

**Why it matters:** Hold space unlocks sed's ability to process relationships between lines.
Saving a key from one line and referencing it when processing a subsequent line is impossible
with single-line commands. Hold space is the mechanism that makes sed capable of tasks like
reversing files, deduplication, and context-aware substitution.

---

### Example 37: Accumulate with `H` and `G`

`H` appends the pattern space to the hold space (with a newline separator). `G` appends the
hold space to the pattern space. These uppercase variants accumulate rather than replace.

```bash
# Collect all lines into hold space then print at end
printf "line1\nline2\nline3\n" | sed -n 'H; ${g;s/^\n//;p}'
# => H appends each line to hold space (with leading newline)
# => On last line ($):
# =>   g copies accumulated hold space into pattern space
# =>   s/^\n// strips the leading newline H introduced
# =>   p prints the entire accumulated buffer
# => Output:
# => line1
# => line2
# => line3
```

**Key takeaway:** `H` accumulates lines into hold space with newline separators; `G` appends
hold space content to the current pattern space — both are accumulate-and-join operations.

**Why it matters:** Some transformations require seeing multiple lines together before deciding
what to output — paragraph reformatting, block-level deduplication, or multi-line record
assembly. `H`/`G` are the primitives that make this possible within sed's line-at-a-time model.

---

### Example 38: Exchange Pattern and Hold Space with `x`

The `x` command swaps the pattern space and hold space entirely. This is the primary mechanism
for implementing a "sliding window" of two lines — processing the previous line while reading
the current one.

```bash
# Print each pair of consecutive lines (sliding window of 2)
printf "a\nb\nc\nd\n" | sed -n 'x; /./p; x'
# => Before first line: hold space is empty
# => x: swap pattern and hold — pattern becomes empty, hold becomes "a"
# => /./p: empty pattern space does not match — nothing printed
# => x: swap back — pattern is "a", hold is empty
# => On second line (b): x swaps again — pattern="", hold="b"... etc.
# => Simplified: this prints lines 2..N shifted by 1 (prev line echoed)
echo "---"
printf "a\nb\nc\nd\n" | sed -n '$!{x;p}; ${x;p;x;p}'
# => All lines except last: x (save current to hold, move prev to pattern), p (print prev)
# => Last line: print prev, swap to get last, print last
# => Output: a, b, c, d in order
```

**Key takeaway:** `x` swaps pattern and hold space atomically — use it to implement
look-behind patterns where you need to reference the previous line while processing the current.

**Why it matters:** Removing duplicate consecutive lines, printing lines that differ from the
previous, and detecting state transitions all require comparing the current line to the one
before it. The `x` command is the primitive that enables this cross-line comparison.

---

## Multiline Operations

### Example 39: Append Next Line with `N`

The `N` command appends the next input line to the pattern space, separated by a newline. The
pattern space now contains two lines and can be operated on as a unit.

```bash
# Join every pair of lines
printf "key1\nvalue1\nkey2\nvalue2\n" | sed 'N; s/\n/=/'
# => N reads the next line and appends it to pattern space with \n
# => Pattern space now holds "key1\nvalue1"
# => s/\n/=/ replaces the newline with =, joining the pair
# => sed then processes the next pair (key2, value2)
# => Output:
# => key1=value1
# => key2=value2
```

**Key takeaway:** `N` joins the next line to the pattern space with `\n`; subsequent commands
can then match or replace across line boundaries.

**Why it matters:** Many data formats split records across two lines — a label line followed
by a value line, or a continuation pattern in config files. `N` collapses these into a single
line for transformation before outputting, which is impossible with single-line sed processing.

---

### Example 40: Print First Line of Multiline Pattern Space with `P`

After `N` creates a multi-line pattern space, `P` prints only the first line (up to the first
embedded newline). This is the multiline counterpart of `p`.

```bash
# Print only the first line of joined pairs
printf "a\nb\nc\nd\n" | sed 'N; P; d'
# => N: append next line — pattern space is "a\nb"
# => P: print up to first \n — prints "a"
# => d: delete entire pattern space and start next cycle
# => Next iteration: N joins "c\nd", P prints "c", d discards
# => Output:
# => a
# => c
```

**Key takeaway:** `P` prints only the content of the pattern space before the first embedded
newline — the upper half of a multi-line pattern space created by `N`.

**Why it matters:** Multiline operations often need to selectively print parts of the assembled
buffer. `P`/`D` are the multiline-aware equivalents of `p`/`d`. They let you consume lines
from a sliding buffer without losing unprocessed content.

---

### Example 41: Delete First Line of Multiline Pattern Space with `D`

`D` deletes only the first line of a multiline pattern space (up to the first `\n`) and
restarts the script with the remaining content — without reading a new input line.

```bash
# Join continuation lines (lines starting with a tab) to the previous line
printf "long line\n\tcontinuation\nnew line\n" | sed 'N; /\n\t/s/\n\t/ /; P; D'
# => N: append next line — pattern has "long line\n\tcontinuation"
# => /\n\t/ matches an embedded newline followed by tab
# => s/\n\t/ / joins them with a space
# => P: print first part (now "long line continuation" since joined)
# => D: delete first line, restart with remaining
# => Output:
# => long line continuation
# => new line
```

**Key takeaway:** `D` removes the first line of the pattern space and re-runs the script on
the remainder — enabling a sliding-window loop without external counters.

**Why it matters:** Continuation-line folding (RFC 2822 email headers, HTTP headers, some INI
formats) requires joining a line with the next when the next starts with whitespace. `N`/`P`/`D`
implement this canonical pattern. It is also the basis for paragraph-mode processing in
sed scripts.

---

## Branching and Labels

### Example 42: Unconditional Branch with `b`

The `b` command jumps to a labeled point in the script. `b` without a label jumps to the end
of the script, bypassing remaining commands and printing the pattern space normally.

```bash
# Skip transformation for lines starting with #
printf "# comment\nfoo=bar\n# another\nbaz=qux\n" | sed '/^#/b; s/=/:/'
# => /^#/b — if line starts with #, branch to end of script
# => Lines starting with # skip the s command entirely
# => Other lines reach s/=/:/ and are transformed
# => Output:
# => # comment
# => foo:bar
# => # another
# => baz:qux
```

**Key takeaway:** `b` without a label jumps to the end of the current cycle, printing the
pattern space unchanged — a clean way to skip processing for matched lines.

**Why it matters:** Protecting comment lines, header lines, or marker lines from being modified
by subsequent commands is a common requirement. Using `b` to short-circuit the script for those
lines is cleaner than wrapping all other commands in negated address conditions.

---

### Example 43: Labels and Conditional Branch with `t`

The `t` command branches to a label if a successful substitution has occurred since the last
input line was read or last `t` was tested. Labels are created with `:label`.

```bash
# Remove all leading spaces using a loop
echo "     indented text" | sed ':loop; s/^  //; t loop'
# => :loop defines a branch target named "loop"
# => s/^  // removes two leading spaces if present
# => t loop: if the substitution succeeded, jump back to :loop
# => Loop repeats until no two leading spaces remain
# => Output: indented text (in steps: 3 pairs of spaces removed)

echo "     5spaces" | sed ':loop; s/^ //; t loop'
# => Removes one space per iteration
# => t loop jumps back after each successful removal
# => When no leading space remains, t does not branch — script ends
# => Output: 5spaces
```

**Key takeaway:** `:label` defines a jump target; `t label` branches to it only if a
substitution occurred since the last line read — this implements conditional loops in sed.

**Why it matters:** Iterative transformations — collapsing multiple delimiters, removing
nested brackets, or normalizing repeated separators — require looping until no more matches
exist. The `t` loop is the sed idiom for this. It is more efficient than repeated sed passes
because it runs in a single process.

---

### Example 44: Negated Conditional Branch with `T`

`T` (GNU extension) branches to a label if NO successful substitution has occurred since the
last line was read or last test. It is the complement of `t`.

```bash
# Process only lines that were successfully modified
printf "foo\nbar\nbaz\n" | sed 's/foo/FOO/; T skip; s/FOO/FOUND_FOO/; :skip'
# => s/foo/FOO/ attempts substitution on each line
# => T skip: if substitution FAILED (no "foo" found), jump to :skip
# => s/FOO/FOUND_FOO/ runs only when s/foo/FOO/ succeeded (line 1)
# => :skip is the branch target for failed substitutions
# => Output:
# => FOUND_FOO
# => bar
# => baz
```

**Key takeaway:** `T label` branches when the previous substitution did NOT succeed —
the logical inverse of `t`, enabling different code paths for matched vs unmatched lines.

**Why it matters:** Complex sed scripts sometimes need to apply a follow-up transformation
only when a prerequisite substitution succeeded. `T` makes this branching explicit and
readable. Without it, you would use a flag variable in the hold space — a much more
complex idiom.

---

## Advanced Addressing

### Example 45: Step Addressing with `first~step`

GNU sed supports `first~step` addressing, which matches line `first` and every `step`th line
thereafter. `0~2` matches even lines, `1~2` matches odd lines.

```bash
# Print only odd-numbered lines (1, 3, 5, ...)
printf "line1\nline2\nline3\nline4\nline5\n" | sed -n '1~2p'
# => 1~2 means: start at line 1, then every 2nd line (1, 3, 5...)
# => -n suppresses default output
# => p prints only matched lines
# => Output:
# => line1
# => line3
# => line5

# Delete even-numbered lines
printf "a\nb\nc\nd\ne\n" | sed '0~2d'
# => 0~2 means: start at line 0 (first even: 2), then every 2nd line
# => d deletes lines 2, 4, 6...
# => Output:
# => a
# => c
# => e
```

**Key takeaway:** `first~step` addresses line `first` and every `step`th line after it —
a GNU extension for selecting regular intervals of lines.

**Why it matters:** Sampling large datasets (every 10th record), removing alternating lines
from interleaved output, or processing CSV where even rows are headers all benefit from step
addressing. Without it, you need arithmetic with line count variables in awk.

---

### Example 46: Address with `0,/regex/`

The `0,/regex/` range (GNU extension) starts from line 0 and ends at the first match of
`/regex/`. The key difference from `1,/regex/`: the ending pattern can match line 1 itself.

```bash
# Replace only the FIRST occurrence of "foo" anywhere in the file
printf "foo\nbar\nfoo\n" | sed '0,/foo/s/foo/FOO/'
# => 0,/foo/ is active from start until first match of /foo/
# => When /foo/ first matches (line 1), the range ends after that line
# => s/foo/FOO/ replaces "foo" on line 1 only
# => Line 3's "foo" is outside the range
# => Output:
# => FOO
# => bar
# => foo
```

**Key takeaway:** `0,/regex/` ends the range on the first line matching `/regex/`, even if
that is line 1 — use it when `1,/regex/` would skip a match on the very first line.

**Why it matters:** The distinction between `0,/p/` and `1,/p/` matters when the target
pattern can appear on line 1. `1,/p/` would treat line 1 as the range start and look for the
end on a subsequent line, modifying too many lines. `0,/p/` correctly stops at line 1 if
that is the first match.

---

## Practical Patterns

### Example 47: Removing Duplicate Consecutive Lines

Removing consecutive duplicate lines (like `uniq`) can be done in sed using hold space to
compare each line against the previous.

```bash
printf "apple\napple\nbanana\nbanana\nbanana\ncherry\n" | sed '$!N; /^\(.*\)\n\1$/!P; D'
# => $!N: on all lines except last, append next line to pattern space
# => Pattern space now has two consecutive lines: "prev\ncurrent"
# => /^\(.*\)\n\1$/: matches if both lines are identical (backreference)
# => !P: if they are NOT identical, print the first line
# => D: delete first line, restart with second line still in pattern space
# => Output:
# => apple
# => banana
# => cherry
```

**Key takeaway:** `$!N; /^\(.*\)\n\1$/!P; D` is the classic sed one-liner for removing
consecutive duplicate lines — it works by comparing adjacent lines via backreference.

**Why it matters:** Sorted data frequently contains duplicate consecutive lines. This sed
one-liner is the standard portable alternative to `uniq` when `uniq` is not available or
when you need to integrate deduplication into a larger sed script.

---

### Example 48: Printing Lines Between Two Patterns

Extracting content between two delimiter patterns (inclusive or exclusive) is a fundamental
document processing operation. This example shows both inclusive and exclusive variants.

```bash
# Inclusive: print from START to END including those lines
printf "before\nSTART\ndata1\ndata2\nEND\nafter\n" | sed -n '/START/,/END/p'
# => /START/,/END/ range includes both boundary lines
# => -n + p prints only the matched range
# => Output:
# => START
# => data1
# => data2
# => END

# Exclusive: print BETWEEN START and END, excluding boundaries
printf "before\nSTART\ndata1\ndata2\nEND\nafter\n" \
  | sed -n '/START/,/END/{/START/d; /END/d; p}'
# => /START/,/END/ selects the block
# => Within the block, /START/d and /END/d delete boundary lines
# => p prints the remaining (interior) lines
# => Output:
# => data1
# => data2
```

**Key takeaway:** `/start/,/end/p` includes boundaries; add `{/start/d; /end/d;}` inside the
block to exclude them — two variants covering inclusive and exclusive extraction.

**Why it matters:** Extracting sections from structured text (Markdown code blocks, XML
elements, SQL transactions, log sessions) is the most common document parsing task performed
by sed in production. Both inclusive and exclusive variants have real use cases depending on
whether the delimiters are part of the data.

---

### Example 49: Counting Lines (Using `=`)

The `=` command prints the current line number to stdout before printing the pattern space.
It is the simplest way to add line numbers to output.

```bash
# Print line numbers alongside content
printf "alpha\nbeta\ngamma\n" | sed '='
# => = prints the current line number on its own line
# => Default output then prints the line content
# => Output:
# => 1
# => alpha
# => 2
# => beta
# => 3
# => gamma

# Count total lines (like wc -l)
printf "a\nb\nc\nd\n" | sed -n '$='
# => -n suppresses all output except explicit commands
# => $ addresses only the last line
# => = prints that line's number — the total line count
# => Output: 4
```

**Key takeaway:** `=` prints the current line number; `-n '$='` prints only the last line
number, giving the total line count equivalent to `wc -l`.

**Why it matters:** Adding line numbers to output for debugging, generating numbered lists, or
counting records in a pipeline without spawning a separate `wc` process are all accomplished
with `=`. It integrates into sed scripts that already process the content, avoiding a second
pass.

---

### Example 50: Reversing File Lines

Reversing the order of lines (`tac` equivalent) demonstrates hold space's role as an
accumulator. Each line is prepended to the hold space until all lines are read, then the
hold space is printed.

```bash
printf "first\nsecond\nthird\n" | sed -n '1!G; h; $p'
# => 1!G: on all lines except line 1, append hold space to pattern space
# =>      (initially hold is empty, so G just adds a trailing newline)
# => h: copy pattern space (accumulated lines) to hold space
# => $p: on last line, print the accumulated hold space
# => The effect: each new line is prepended to the growing buffer
# => Output:
# => third
# => second
# => first
```

**Key takeaway:** `1!G; h; $p` is the classic sed line-reversal idiom — it accumulates all
lines in reverse order in hold space and prints the result after the last line is read.

**Why it matters:** Reversing a file is useful for appending to the beginning of another file,
processing log files in chronological vs reverse-chronological order, or implementing a stack
data structure in a shell pipeline. Understanding this idiom demonstrates mastery of hold space.

---

### Example 51: Converting Windows Line Endings to Unix

Windows line endings (`\r\n`, CRLF) cause parsing failures on Unix systems. sed removes the
carriage return character cleanly.

```bash
# Create a file with Windows line endings using printf
printf "line1\r\nline2\r\nline3\r\n" | sed 's/\r//'
# => \r is the carriage return character (hex 0D)
# => s/\r// removes \r from each line
# => The remaining \n is the Unix line ending
# => Output: (each line ends with Unix \n only)
# => line1
# => line2
# => line3

# Alternative: use character class
printf "line1\r\nline2\r\n" | sed 's/[[:cntrl:]]//'
# => [[:cntrl:]] matches control characters including \r
# => Works when you are unsure of the exact control character
```

**Key takeaway:** `s/\r//` removes Windows carriage returns from each line; pair with `-i`
to convert files in place.

**Why it matters:** CRLF line endings are one of the most common cross-platform compatibility
issues. Git, Python, bash, and most Unix tools misinterpret CR characters. A single sed
one-liner in a pre-processing step or git clean filter prevents downstream tool failures
without requiring `dos2unix` to be installed.

---

### Example 52: Inserting a Line After a Match

Using `a` with a regex address inserts text after every line matching a pattern. This is
the insertion variant of the address-plus-command pattern.

```bash
# Insert a separator after every line containing "SECTION"
printf "SECTION A\nitem 1\nSECTION B\nitem 2\n" | sed '/SECTION/a\---'
# => /SECTION/ addresses lines containing "SECTION"
# => a\--- appends "---" after each matched line
# => Output:
# => SECTION A
# => ---
# => item 1
# => SECTION B
# => ---
# => item 2
```

**Key takeaway:** Combining a regex address with `a` inserts content after every line matching
the pattern — not just after a fixed line number.

**Why it matters:** Report generation often requires separators between sections identified
by content rather than position. Regex-addressed `a` handles dynamic section boundaries
automatically, adapting to files where section count varies.

---

### Example 53: Deleting Lines Matching a Range of Patterns

Combining regex range addressing with `d` removes entire blocks of content between two
pattern delimiters, such as stripping license headers or comment blocks.

```bash
# Remove the comment block between /* and */
printf "code before\n/* LICENSE\nfull license text\nEND */\ncode after\n" \
  | sed '/\/\*/,/\*\//d'
# => /\/\*/ matches lines containing /*  (escaped for BRE)
# => /\*\// matches lines containing */
# => The range /\/\*/,/\*\// selects all lines from /* through */
# => d deletes every line in that range
# => Output:
# => code before
# => code after
```

**Key takeaway:** `'/start/,/end/d'` deletes all lines from the first match of `start` through
the next match of `end` — the block deletion counterpart of block extraction.

**Why it matters:** License headers, configuration block removal, and stripping debug sections
from generated files are common tasks in build pipelines. Block deletion with range addressing
handles these without knowing the exact line numbers, making the script robust to file changes.

---

### Example 54: Multiple Commands in a Block `{}`

Curly braces `{}` group multiple commands under a single address. All commands in the block
run when the address matches.

```bash
# For lines in range 2-4: substitute AND prepend a marker
printf "line1\nline2\nline3\nline4\nline5\n" \
  | sed '2,4{s/line/LINE/; s/^/>> /}'
# => 2,4 restricts the block to lines 2-4
# => First command in block: s/line/LINE/
# => Second command in block: s/^/>> / prepends "> > "
# => Both commands run on each line in range 2-4
# => Line 1 and 5 are untouched
# => Output:
# => line1
# => >> LINE2
# => >> LINE3
# => >> LINE4
# => line5
```

**Key takeaway:** `address{ cmd1; cmd2; }` groups multiple commands under one address — all
commands in the block execute when the address matches.

**Why it matters:** Without blocks, each command in a script needs its own address expression.
For operations that apply multiple transformations to the same set of lines, blocks eliminate
address repetition, reduce the chance of address mismatch bugs, and make the script's intent
clearer.

---

### Example 55: Trimming Whitespace from Both Ends

Combining leading and trailing whitespace removal in a single sed invocation cleans up
user-submitted data, config file values, and log fields.

```bash
# Trim leading and trailing whitespace
printf "  hello world  \n\t  tabbed  \t\n  clean  \n" \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
# => First expression s/^[[:space:]]*//'  strips leading whitespace
# => Second expression s/[[:space:]]*$// strips trailing whitespace
# => Both run on each line in a single sed invocation
# => Output:
# => hello world
# => tabbed
# => clean
```

**Key takeaway:** Chain `s/^[[:space:]]*//` and `s/[[:space:]]*$//` (or use `-e` for each)
to trim both leading and trailing whitespace in one pass.

**Why it matters:** User input and externally generated data almost always contains unexpected
whitespace. Trimming in a preprocessing step prevents comparison failures, column alignment
issues, and database constraint violations. This two-expression pattern is one of the most
frequently used sed one-liners in data ingestion pipelines.

---

### Example 56: Wrapping Lines in Quotes

Enclosing field values in quotes is a common requirement when generating CSV, JSON, or
shell-safe arguments. sed's substitution can add delimiters around each line or field.

```bash
# Wrap each line in double quotes
printf "value one\nvalue two\nvalue three\n" | sed 's/.*/"&"/'
# => .* matches the entire line content
# => & in replacement refers to the entire matched text
# => "& " wraps the matched text in double quotes
# => Output:
# => "value one"
# => "value two"
# => "value three"

# Wrap only the value in a key=value pair
echo "name=John Doe" | sed -E 's/^([^=]+)=(.*)/\1="\2"/'
# => -E enables ERE
# => Group 1 captures the key (everything before =)
# => Group 2 captures the value (everything after =)
# => Replacement wraps group 2 in quotes
# => Output: name="John Doe"
```

**Key takeaway:** `&` in the replacement string refers to the entire matched text — use it
to wrap content without repeating the capture group.

**Why it matters:** Generating properly quoted CSV output from log data, wrapping shell
arguments safely, and producing JSON string values all require adding quotes around existing
content. The `&` reference makes wrapping a one-expression operation rather than requiring
a capture group for the entire line.
