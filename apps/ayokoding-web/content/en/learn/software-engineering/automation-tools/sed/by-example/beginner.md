---
title: "Beginner"
weight: 10000001
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Beginner sed examples covering basic substitution, printing, deletion, line addressing, range addressing, and in-place editing"
tags: ["sed", "stream-editor", "text-processing", "tutorial", "by-example", "code-first", "beginner"]
---

This tutorial covers core sed concepts through 28 self-contained, heavily annotated shell examples.
Each example is a complete, runnable command demonstrating one focused concept. The examples
progress from the minimal substitution through addressing, deletion, insertion, in-place editing,
and single-character utility commands — spanning 0-35% of sed features.

## Basic Substitution

### Example 1: Minimal Substitution

The `s` command is the most-used sed command. It replaces the first match of a regex with a
replacement string on each line. Understanding the `s/old/new/` syntax is the foundation of
all sed work.

```bash
# Basic form: sed 's/pattern/replacement/' input
# sed reads from stdin when no file is given.
echo "hello world" | sed 's/hello/goodbye/'
# => sed scans the line for the first match of "hello"
# => Replaces that match with "goodbye"
# => Output: goodbye world
```

**Key takeaway:** `s/pattern/replacement/` replaces the first occurrence of `pattern` with
`replacement` on each input line.

**Why it matters:** Substitution is the bread and butter of sed. Nearly every automated text
processing task — renaming config keys, rewriting URLs, sanitizing log entries — starts with
`s///`. Mastering this single command covers 60% of real-world sed use. Without it, you would
rely on less portable tools or manual editing for operations that take milliseconds with sed.

---

### Example 2: Global Flag `g`

Without the `g` flag, `s///` replaces only the first occurrence per line. Adding `g` replaces
every occurrence. This distinction catches many beginners off guard when processing CSV data
or log lines with repeated tokens.

```bash
# Without g flag: only first match replaced
echo "cat cat cat" | sed 's/cat/dog/'
# => Only the first "cat" on the line is replaced
# => Output: dog cat cat

# With g flag: all matches on the line replaced
echo "cat cat cat" | sed 's/cat/dog/g'
# => Every "cat" on the line is replaced
# => Output: dog dog dog
```

**Key takeaway:** The `g` flag after the closing delimiter makes substitution global — replacing
all matches on each line rather than just the first.

**Why it matters:** Forgetting `g` is one of the most common sed bugs. If you are replacing a
delimiter character in CSV or cleaning repeated whitespace, partial replacement silently corrupts
data. Always decide consciously whether you need the first match or all matches — then pick the
right flag.

---

### Example 3: Case-Insensitive Flag `I`

The `I` flag (uppercase I on GNU sed; also `i` on some implementations) makes the pattern
match regardless of letter case. This is essential when processing user-generated content or
log files where capitalization is inconsistent.

```bash
# Without I: pattern is case-sensitive
echo "Hello HELLO hello" | sed 's/hello/hi/'
# => Only the lowercase "hello" matches
# => Output: Hello HELLO hi

# With I flag: all case variants match
echo "Hello HELLO hello" | sed 's/hello/hi/gI'
# => gI combines global replacement with case-insensitive matching
# => All three variants of "hello" are replaced
# => Output: hi hi hi
```

**Key takeaway:** The `I` flag enables case-insensitive matching; combine it with `g` as `gI`
to replace all case-insensitive occurrences on each line.

**Why it matters:** Log aggregation pipelines frequently receive mixed-case status strings like
"Error", "ERROR", and "error". Case-insensitive substitution normalizes these to a canonical
form in a single pass. Without `I`, you would need multiple `-e` expressions or a more complex
regex alternation.

---

### Example 4: Printing with `p` and `-n`

The `p` command prints the current pattern space. By default sed already prints every line, so
`p` alone doubles output. Pairing `p` with `-n` (suppress default output) lets you print only
selected lines — a grep-like filter.

```bash
# Without -n: default output PLUS explicit p doubles lines
echo -e "alpha\nbeta\ngamma" | sed '/beta/p'
# => Lines not matching /beta/ print once (default)
# => The matching line "beta" prints twice (default + p)
# => Output:
# => alpha
# => beta
# => beta
# => gamma

# With -n: only explicit p output
echo -e "alpha\nbeta\ngamma" | sed -n '/beta/p'
# => -n suppresses default print
# => Only lines matching /beta/ are printed by p
# => Output: beta
```

**Key takeaway:** Use `-n` with `p` to print only lines that match an address; without `-n`,
`p` produces duplicate lines.

**Why it matters:** The `-n`/`p` combination turns sed into a line filter that outperforms
`grep` when you need context-aware selection or when the selection criteria is a sed address
expression. It is the standard way to extract configuration values, log events, or specific
sections from structured text files.

---

### Example 5: Deleting Lines with `d`

The `d` command deletes the current line from the output entirely. It jumps to the next input
line immediately, skipping any remaining commands for the deleted line. This makes it ideal for
removing blank lines, comment lines, or unwanted headers.

```bash
# Delete lines matching a pattern
printf "line1\n# comment\nline2\n# another comment\nline3\n" | sed '/^#/d'
# => /^#/ matches lines starting with #
# => d discards each matched line — it never appears in output
# => Non-matching lines pass through unchanged
# => Output:
# => line1
# => line2
# => line3
```

**Key takeaway:** `d` removes the current line from output and immediately starts the next
input line, so commands after `d` in the same script do not run for that line.

**Why it matters:** Stripping comments from config files, removing blank lines before further
processing, and deleting CSV headers are all one-liner tasks with `d`. In production scripts,
`d` keeps data clean before passing it to downstream tools like `awk` or database import
utilities.

---

## Line Addressing

### Example 6: Addressing by Line Number

Prepending a line number to a command restricts it to that exact line. Line numbering starts at

1. This is the fastest way to operate on a specific line when you know its position.

```bash
# Apply substitution only to line 2
printf "first\nsecond\nthird\n" | sed '2s/second/SECOND/'
# => Line 1 "first" — no address match, passes through unchanged
# => Line 2 "second" — address 2 matches, s command runs
# => Line 3 "third" — no address match, passes through unchanged
# => Output:
# => first
# => SECOND
# => third
```

**Key takeaway:** A leading number restricts a sed command to only that line number in the
input stream.

**Why it matters:** Line-number addressing is indispensable when processing files with fixed
structure — replacing the second line of a CSV (headers followed by data), patching a specific
line in a config template, or modifying a known-position entry in a system file. It avoids
regex complexity when structure is positional.

---

### Example 7: The `$` Last-Line Address

`$` is a special address meaning the last line of input. It works regardless of how many lines
the input contains, making scripts file-length agnostic.

```bash
# Delete the last line of input
printf "line1\nline2\nline3\n" | sed '$d'
# => $ matches only the final line
# => d deletes it from output
# => Output:
# => line1
# => line2

# Substitute only on the last line
printf "END\nEND\nEND\n" | sed '$s/END/FINAL/'
# => Only the last "END" is targeted
# => Output:
# => END
# => END
# => FINAL
```

**Key takeaway:** `$` addresses only the last input line, enabling end-of-file operations
without knowing the line count in advance.

**Why it matters:** Log files, CSV exports, and generated reports often have trailing footer
lines or summary rows. `$` lets you strip or transform these without counting lines. It is also
useful for appending a closing tag or delimiter after all data lines have been processed.

---

### Example 8: Range Addressing with Line Numbers

A range `start,end` applies a command to every line from `start` through `end` inclusive.
This is the primary mechanism for processing blocks of text with known boundaries.

```bash
# Delete lines 2 through 4
printf "a\nb\nc\nd\ne\n" | sed '2,4d'
# => Lines 1 and 5 are outside the range — pass through unchanged
# => Lines 2, 3, and 4 match the range — d deletes each
# => Output:
# => a
# => e

# Substitute within a range
printf "x\ny\nz\n" | sed '1,2s/./UPPER/'
# => Address 1,2 restricts s to lines 1 and 2
# => . matches any single character
# => Output:
# => UPPER
# => UPPER
# => z
```

**Key takeaway:** `start,end` defines an inclusive line range; any sed command prefixed with
this range runs only on lines within that range.

**Why it matters:** Data files often have structured sections: a header block, a data block,
and a footer. Line-range addressing lets you transform each section independently without
splitting the file. This is a cornerstone technique for Makefile patching, config block
replacement, and log section extraction.

---

### Example 9: Regex Addressing

Instead of a line number, an address can be a regex pattern surrounded by `/`. The command
applies to every line where the pattern matches. This is the most flexible addressing mode.

```bash
# Print only lines containing "error" (case-insensitive)
printf "INFO start\nERROR disk full\nINFO end\nWARN low memory\n" \
  | sed -n '/[Ee][Rr][Rr][Oo][Rr]/p'
# => /[Ee][Rr][Rr][Oo][Rr]/ matches "ERROR" and "error" variants
# => -n suppresses default output
# => p prints matched lines only
# => Output: ERROR disk full
```

**Key takeaway:** `/regex/` as an address applies the command to every line matching the
pattern, regardless of line number.

**Why it matters:** Log analysis relies on regex addressing to extract event categories, filter
by severity, or isolate transactions. Unlike grep, sed regex addresses can be combined with
transformation commands — so you can find a line and modify it in the same pass, which is
impossible with grep alone.

---

### Example 10: Regex Range Addressing

A range can use two regex patterns: `/start/,/end/`. sed activates the range when it sees a
line matching `/start/` and deactivates it after the next line matching `/end/`.

```bash
# Extract content between BEGIN and END markers
printf "header\nBEGIN\ndata line 1\ndata line 2\nEND\nfooter\n" \
  | sed -n '/BEGIN/,/END/p'
# => /BEGIN/ activates the range on the line containing "BEGIN"
# => /END/ deactivates the range after the line containing "END"
# => Both boundary lines are included in the output
# => Output:
# => BEGIN
# => data line 1
# => data line 2
# => END
```

**Key takeaway:** `/start/,/end/` selects all lines from the first match of `/start/` through
the next match of `/end/`, inclusive of both boundary lines.

**Why it matters:** Configuration files, SQL dumps, and structured logs often delimit sections
with markers like `BEGIN`, `END`, `[section]`, or `---`. Regex range addressing extracts these
sections without writing a multi-step pipeline. It is the canonical sed technique for document
section extraction.

---

### Example 11: First Occurrence Only (No `g` Flag)

By default, `s///` replaces only the first occurrence per line. This behavior is intentional
and useful when you want to modify only the leading token on a structured line.

```bash
# Replace only the first colon on each line
printf "key:val:extra\nname:John:Doe\n" | sed 's/:/ = /'
# => s/:/ = / has no g flag — only first : per line is replaced
# => "key:val:extra" => "key = val:extra"
# => "name:John:Doe" => "name = John:Doe"
# => Output:
# => key = val:extra
# => name = John:Doe
```

**Key takeaway:** Without the `g` flag, `s///` transforms only the first match on each line —
use this deliberately when structure places the target token at a known position.

**Why it matters:** Many config formats use a separator character that also appears in values
(colons in `/etc/passwd`, equals signs in `.env` files). Replacing only the first occurrence
correctly splits key from value without mangling the value itself.

---

### Example 12: Nth Occurrence Flag

A numeric flag after the closing delimiter targets the Nth occurrence on each line. This is
supported by GNU sed and is useful when a token appears multiple times but only a specific
position matters.

```bash
# Replace the second occurrence of "x" on each line
echo "x one x two x three" | sed 's/x/X/2'
# => Flag 2 skips the first match and replaces the second
# => Output: x one X two x three

# Replace the third occurrence
echo "a-b-c-d-e" | sed 's/-/:/3'
# => Flag 3 replaces only the third hyphen
# => Output: a-b-c:d-e
```

**Key takeaway:** A numeric flag `N` on `s///N` replaces only the Nth occurrence of the
pattern on each line.

**Why it matters:** Structured delimited data sometimes requires modifying a specific field
separator. For example, reformatting a date string `YYYY-MM-DD` by replacing only the second
hyphen would be awkward with `g` but straightforward with flag `2`.

---

## In-Place Editing

### Example 13: In-Place Editing with `-i`

The `-i` flag rewrites the input file in place instead of printing to stdout. On GNU sed,
`-i` takes an optional suffix argument for backup; on BSD sed (macOS), the suffix is mandatory.

```bash
# Create a test file
echo "color: blue" > /tmp/sed_test_config.txt

# GNU sed: -i with no suffix (no backup)
sed -i 's/blue/red/' /tmp/sed_test_config.txt
# => Reads /tmp/sed_test_config.txt
# => Applies substitution in memory
# => Overwrites the original file with modified content
# => No backup file is created

cat /tmp/sed_test_config.txt
# => Output: color: red
```

**Key takeaway:** `-i` modifies a file in place; on GNU sed the suffix is optional (no backup),
on BSD/macOS the suffix argument is required even if empty (`-i ''`).

**Why it matters:** In-place editing is what makes sed a file management tool rather than just
a filter. Deployment scripts use `-i` to patch configuration files, update version strings, and
replace environment-specific values during automated deployments without creating intermediate
temp files.

---

### Example 14: In-Place with Backup (`-i.bak`)

Passing a suffix to `-i` (like `.bak`) creates a backup of the original file before modifying
it. This is a safety net in automated scripts where human review is not possible.

```bash
# Create a test file
echo "version=1.0.0" > /tmp/sed_test_version.txt

# GNU sed: -i.bak creates version.txt.bak before modifying
sed -i.bak 's/1.0.0/2.0.0/' /tmp/sed_test_version.txt
# => /tmp/sed_test_version.txt.bak is created with original content
# => /tmp/sed_test_version.txt is overwritten with modified content

cat /tmp/sed_test_version.txt
# => Output: version=2.0.0

cat /tmp/sed_test_version.txt.bak
# => Output: version=1.0.0
```

**Key takeaway:** `-i.bak` (or any suffix) creates `filename.suffix` as the original before
overwriting the file — always use a backup suffix in production scripts.

**Why it matters:** Production deployments that use sed to patch configs carry operational risk.
A regex error or encoding problem can corrupt a critical file. Backup suffixes provide a
one-command rollback path. The minimal cost of a backup copy is always worth it when editing
live system files.

---

## Multiple Commands

### Example 15: Multiple Expressions with `-e`

The `-e` flag lets you chain multiple sed expressions in a single invocation. Each `-e` adds
one expression to the script. Expressions run in order on the same line.

```bash
echo "the quick brown fox" | sed -e 's/quick/slow/' -e 's/brown/white/' -e 's/fox/rabbit/'
# => First expression: replaces "quick" with "slow"
# => Second expression: replaces "brown" with "white"
# => Third expression: replaces "fox" with "rabbit"
# => All three run on each line in sequence
# => Output: the slow white rabbit
```

**Key takeaway:** `-e expr` chains multiple sed commands in a single invocation; each
expression applies to every line in the order specified.

**Why it matters:** Real config patching often requires changing multiple keys in one pass.
A single sed invocation with multiple `-e` flags is faster than piping multiple sed processes
because it reads and writes the input only once. It also keeps all related changes visible in
one command.

---

### Example 16: Commands from a Script File with `-f`

The `-f` flag reads a sed script from a file instead of the command line. This is the standard
approach when scripts grow beyond a couple of expressions or need to be reused across projects.

```bash
# Create a sed script file
printf 's/foo/bar/g\ns/baz/qux/g\n' > /tmp/myscript.sed

# Run sed with the script file
echo "foo and baz and foo" | sed -f /tmp/myscript.sed
# => sed reads commands from /tmp/myscript.sed line by line
# => First command: replaces all "foo" with "bar"
# => Second command: replaces all "baz" with "qux"
# => Output: bar and qux and bar
```

**Key takeaway:** `-f scriptfile` loads sed commands from a file, enabling reusable, version-
controlled transformation scripts.

**Why it matters:** Deployment tooling and CI pipelines benefit from sed scripts stored in
version control alongside the files they transform. A named script file is self-documenting,
testable, and can be reviewed in pull requests — advantages a shell one-liner cannot offer.

---

## Insertion Commands

### Example 17: Append with `a`

The `a` command appends text after the current line. The appended text is printed after the
pattern space, not placed in it — meaning subsequent commands in the script do not see it.

```bash
# Append a blank line after every line matching "SECTION"
printf "SECTION ONE\nitem a\nSECTION TWO\nitem b\n" | sed '/SECTION/a\\'$'\n'
# => /SECTION/ addresses only lines containing "SECTION"
# => a appends a blank line after each matched line
# => Output:
# => SECTION ONE
# =>
# => item a
# => SECTION TWO
# =>
# => item b

# Simpler portable form: append a fixed string
printf "line1\nline2\n" | sed '1a\--- inserted ---'
# => a\ followed by text appends that text after line 1
# => Output:
# => line1
# => --- inserted ---
# => line2
```

**Key takeaway:** `a\text` appends text immediately after the addressed line in the output
stream, without placing it in the pattern space.

**Why it matters:** Inserting separators, adding closing tags, or appending tracking comments
after specific lines are common document assembly tasks. The `a` command performs them in a
single pass without complex scripting.

---

### Example 18: Insert with `i`

The `i` command inserts text before the current line. Like `a`, the inserted text bypasses
further script processing for that content.

```bash
# Insert a header before the first line
printf "data1\ndata2\ndata3\n" | sed '1i\NAME,VALUE,STATUS'
# => i\ inserts text before line 1
# => The inserted text "NAME,VALUE,STATUS" appears first
# => Output:
# => NAME,VALUE,STATUS
# => data1
# => data2
# => data3
```

**Key takeaway:** `i\text` inserts text immediately before the addressed line; use it to prepend
headers or labels to blocks of data.

**Why it matters:** Generating CSV or TSV output from log data often requires prepending a
header row. The `i` command at address `1` inserts the header in a single sed expression,
turning a raw data stream into a labeled dataset ready for spreadsheet import.

---

### Example 19: Change with `c`

The `c` command replaces the entire matched line with new text. Unlike `s///`, which modifies
content within a line, `c` substitutes the whole line.

```bash
# Replace any line containing "TODO" with a placeholder
printf "step1: done\nstep2: TODO\nstep3: done\n" | sed '/TODO/c\step2: PENDING REVIEW'
# => /TODO/ addresses the line containing "TODO"
# => c replaces the entire line with "step2: PENDING REVIEW"
# => Non-matching lines pass through unchanged
# => Output:
# => step1: done
# => step2: PENDING REVIEW
# => step3: done
```

**Key takeaway:** `c\text` replaces the entire addressed line with the provided text, making it
useful for swapping whole configuration entries.

**Why it matters:** Config files sometimes contain entire lines that need replacement (not just
a value within the line). Using `c` avoids complex regex to match and reconstruct the whole line
— you simply provide the replacement line directly, which is safer and more readable.

---

## Transliteration and Quitting

### Example 20: Transliterate with `y`

The `y` command performs character-by-character transliteration, similar to the `tr` command.
It maps each character in the source set to the corresponding character in the destination set.

```bash
# Convert lowercase vowels to uppercase
echo "hello world" | sed 'y/aeiou/AEIOU/'
# => y/src/dst/ maps each char in src to the corresponding char in dst
# => a->A, e->E, i->I, o->O, u->U
# => Non-mapped characters pass through unchanged
# => Output: hEllO wOrld

# Convert spaces to underscores
echo "file name with spaces" | sed 'y/ /_/'
# => Every space character is replaced with underscore
# => Output: file_name_with_spaces
```

**Key takeaway:** `y/source/dest/` transliterates characters one-for-one; both sets must have
equal length, and no regex is used — it is a pure character mapping.

**Why it matters:** Transliteration is faster than substitution for single-character mappings
and is explicitly non-regex, avoiding special-character escaping issues. Converting spaces to
underscores for filenames, normalizing separators, or ROT13-encoding content are all cleaner
with `y` than with `s`.

---

### Example 21: Quit with `q`

The `q` command exits sed after processing the current line. It is an efficient way to stop
processing after finding what you need, without reading the entire input.

```bash
# Print only the first 3 lines (like head -3)
printf "line1\nline2\nline3\nline4\nline5\n" | sed '3q'
# => sed processes lines 1, 2, 3 normally (default print)
# => At line 3, q causes sed to exit after printing it
# => Lines 4 and 5 are never read
# => Output:
# => line1
# => line2
# => line3
```

**Key takeaway:** `Nq` processes and prints lines 1 through N then exits, making it equivalent
to `head -N` but implemented entirely within sed.

**Why it matters:** When processing very large files where you only need the beginning (sampling
a log file, checking a header, extracting the first record), `q` prevents wasted I/O. For files
in the gigabyte range, quitting early can reduce processing time from minutes to milliseconds.

---

## File Operations

### Example 22: Read from File with `r`

The `r` command reads the contents of a named file and appends them to the output after the
current line. This is useful for inserting file contents at a specific position in a stream.

```bash
# Create an insert file
echo "--- INSERTED CONTENT ---" > /tmp/sed_insert.txt

# Insert file contents after matching line
printf "before\nINSERT HERE\nafter\n" | sed '/INSERT HERE/r /tmp/sed_insert.txt'
# => /INSERT HERE/ addresses the matching line
# => r reads /tmp/sed_insert.txt and appends its content after the line
# => The original "INSERT HERE" line still appears; r only appends
# => Output:
# => before
# => INSERT HERE
# => --- INSERTED CONTENT ---
# => after
```

**Key takeaway:** `r filename` appends the contents of `filename` to the output after the
addressed line; the file is read once per match.

**Why it matters:** Template assembly is a common deployment task: a base config file has
marker lines where environment-specific blocks should be inserted. The `r` command implements
this pattern — insert a pre-built block at a marker without writing a full template engine.

---

### Example 23: Write to File with `w`

The `w` command writes the current pattern space to a named file instead of (or in addition to)
stdout. Multiple matches append to the same file in a single sed run.

```bash
# Write only error lines to a separate file
printf "INFO ok\nERROR disk full\nINFO ok\nERROR timeout\n" \
  | sed -n '/ERROR/w /tmp/sed_errors.txt'
# => -n suppresses stdout output
# => /ERROR/ addresses lines containing "ERROR"
# => w writes each matched line to /tmp/sed_errors.txt
# => The file is created or truncated at the start of the sed run

cat /tmp/sed_errors.txt
# => Output:
# => ERROR disk full
# => ERROR timeout
```

**Key takeaway:** `w filename` writes the current line to `filename`; combine with `-n` to
filter output entirely to a file without printing to stdout.

**Why it matters:** Log routing — splitting a combined log stream into separate files by
severity — is a real operational need. The `w` command performs this in one pass without
multiple grep invocations. Each grep requires a separate read of the file; sed with multiple
`w` commands reads the file once.

---

## Practical Combinations

### Example 24: Suppress Output and Print Selectively

Combining `-n` with multiple `p` commands gives fine-grained control over which lines appear
in the output and in what order.

```bash
# Print only non-blank lines
printf "line1\n\nline2\n\nline3\n" | sed -n '/./p'
# => /./  matches any line containing at least one character
# => Blank lines have no characters — they do not match
# => -n suppresses default; p prints only matched (non-blank) lines
# => Output:
# => line1
# => line2
# => line3
```

**Key takeaway:** `/./` is the standard regex to match any non-empty line; pair with `-n` and
`p` to strip blank lines from output.

**Why it matters:** Data pipelines frequently receive input with spurious blank lines from
editors, generators, or copy-paste. Stripping blanks early in the pipeline prevents downstream
tools from misinterpreting empty records as data, which causes field-count errors in CSV
parsers and off-by-one bugs in line-oriented processors.

---

### Example 25: Combining Address and Substitution

Addresses and commands combine freely: prefix any command with an address to restrict it. This
example shows the pattern of targeting a specific section before applying a transformation.

```bash
# Change "status: pending" to "status: complete" only on lines after line 3
printf "status: pending\nstatus: pending\nstatus: pending\nstatus: pending\n" \
  | sed '3,$ s/pending/complete/'
# => 3,$ is the address range: line 3 through last line
# => s/pending/complete/ runs only within that range
# => Lines 1 and 2 are outside the range — unchanged
# => Output:
# => status: pending
# => status: pending
# => status: complete
# => status: complete
```

**Key takeaway:** Any address (line number, `$`, regex, or range) can prefix any command to
restrict its scope — this composability is the core power of sed's addressing model.

**Why it matters:** Structured files often repeat the same token with different meanings in
different sections. Scoping commands to address ranges prevents unintended matches in the
header or footer and makes the intent of each transformation explicit.

---

### Example 26: Deleting Blank Lines

Removing blank lines is one of the most common sed one-liners. Two equivalent approaches
exist: matching empty lines with `^$` or using the negation of the any-character pattern.

```bash
# Method 1: match empty lines with ^$
printf "a\n\nb\n\nc\n" | sed '/^$/d'
# => ^$ matches lines with no characters (start immediately followed by end)
# => d deletes each blank line
# => Output:
# => a
# => b
# => c

# Method 2: delete lines not matching any character (same result)
printf "a\n\nb\n\nc\n" | sed '/./!d'
# => /./  matches non-blank lines; ! negates to match blank lines
# => d deletes matched (blank) lines
# => Output:
# => a
# => b
# => c
```

**Key takeaway:** `/^$/d` and `/./!d` both delete blank lines; choose `^$` for clarity and
`/./!d` when you already need the negation idiom.

**Why it matters:** Most data cleaning pipelines include a blank-line removal step. Blank lines
in CSV cause extra empty rows; blank lines in INI files can confuse parsers. Building this
step into a sed pipeline costs one expression and zero additional processes.

---

### Example 27: Stripping Leading Whitespace

Trimming leading whitespace normalizes indented text for further processing. The `s` command
with an anchored regex handles this cleanly.

```bash
# Strip leading spaces and tabs from each line
printf "  indented\n\t\ttab indented\nnormal\n" | sed 's/^[[:space:]]*//'
# => ^ anchors to start of line
# => [[:space:]]* matches zero or more whitespace chars (spaces, tabs)
# => Replacement is empty string — whitespace is deleted
# => Lines without leading whitespace are unaffected (zero matches)
# => Output:
# => indented
# => tab indented
# => normal
```

**Key takeaway:** `s/^[[:space:]]*//'` strips all leading whitespace from every line;
`[[:space:]]` is the POSIX portable character class for spaces and tabs.

**Why it matters:** Log parsers, YAML processors, and column-aligned data tools all expect
consistently formatted input. Normalizing indentation in a preprocessing step prevents
unexpected behavior in downstream tools that treat leading whitespace as structural markers.

---

### Example 28: Stripping Trailing Whitespace

Trailing whitespace is invisible and causes line-ending comparison failures, diff noise, and
linting errors. Removing it with sed is a standard cleanup step in pre-commit hooks and CI.

```bash
# Strip trailing spaces and tabs from each line
printf "hello   \nworld\t\t\nclean\n" | sed 's/[[:space:]]*$//'
# => [[:space:]]* matches zero or more whitespace chars at the end
# => $ anchors the match to end of line
# => Replacement is empty — trailing whitespace is deleted
# => Lines without trailing whitespace are unaffected
# => Output:
# => hello
# => world
# => clean
```

**Key takeaway:** `s/[[:space:]]*$//` removes all trailing whitespace from every line; anchor
with `$` to ensure only end-of-line whitespace is targeted.

**Why it matters:** Trailing whitespace breaks `diff` output readability, triggers editor and
linter warnings, and can cause hash mismatches in signed configuration files. A single sed
expression in a pre-commit hook or build pipeline eliminates this class of issues entirely
across the codebase.
