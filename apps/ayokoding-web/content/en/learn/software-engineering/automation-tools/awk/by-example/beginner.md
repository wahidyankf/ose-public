---
title: "Beginner"
weight: 10000001
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Beginner awk examples covering field printing, separators, built-in variables, patterns, BEGIN/END blocks, arithmetic, and basic formatting"
tags: ["awk", "text-processing", "tutorial", "by-example", "code-first", "beginner"]
---

This tutorial covers foundational awk concepts through 28 self-contained, heavily annotated
examples. Each example is a complete, runnable shell snippet demonstrating one focused concept.
The examples progress from printing entire lines through field access, built-in variables,
pattern matching, BEGIN/END blocks, arithmetic, string operations, and output formatting —
spanning 0–40% of awk's feature set.

## Printing Records and Fields

### Example 1: Print Every Line

awk's default action is to print the current record. When you provide only a pattern with no
action, awk prints every matching line. Using `1` as a pattern (a non-zero number) matches every
record, making it equivalent to `cat` for plain text.

```bash
echo -e "apple\nbanana\ncherry" | awk '1'
# => awk reads three records: "apple", "banana", "cherry"
# => Pattern "1" is always true — matches every record
# => Default action {print} fires for each match
# => Output:
# => apple
# => banana
# => cherry
```

**Key takeaway:** In awk, `1` as a standalone pattern prints every line because non-zero numbers are always true; the default action when no `{...}` block is given is `{print $0}`.

**Why it matters:** Understanding that awk has a default print action prevents the common mistake of writing `{ print $0 }` everywhere. This idiom appears throughout awk one-liners in shell scripts, log processors, and data pipelines where you want to pass lines through unchanged after some other transformation.

---

### Example 2: Print a Specific Field

awk splits each input record into fields at whitespace (by default). Fields are accessed with
`$1`, `$2`, `$3`, and so on. This is awk's most fundamental operation — extracting columns from
structured text.

```bash
echo "Alice 30 Engineer" | awk '{ print $1 }'
# => Record: "Alice 30 Engineer"
# => $1 = "Alice", $2 = "30", $3 = "Engineer"
# => { print $1 } outputs the first field only
# => Output: Alice

echo "Alice 30 Engineer" | awk '{ print $3 }'
# => $3 = "Engineer"
# => Output: Engineer
```

**Key takeaway:** Fields are numbered from 1 (`$1`, `$2`, ...); `$0` is the entire record and `$1` is always the first whitespace-delimited token.

**Why it matters:** Column extraction is the single most common awk task in production. Log files, CSV exports, system command output (`ps aux`, `df -h`, `ls -l`) all produce columnar text. The ability to grab the third column with `awk '{ print $3 }'` without a CSV library is what makes awk indispensable in sysadmin and DevOps workflows.

---

### Example 3: Print Multiple Fields

Multiple fields print by listing them separated by commas inside `print`. The comma inserts
the output field separator (OFS, default space) between values, keeping them in a single
output record.

```bash
echo "Alice 30 Engineer New York" | awk '{ print $1, $3 }'
# => $1 = "Alice", $3 = "Engineer"
# => Comma between fields inserts OFS (default: single space)
# => Output: Alice Engineer

echo "Alice 30 Engineer New York" | awk '{ print $1 $3 }'
# => No comma — string concatenation, no separator inserted
# => Output: AliceEngineer
```

**Key takeaway:** Comma-separated fields in `print` insert OFS between them; adjacent fields with no comma concatenate directly without any separator.

**Why it matters:** Choosing between comma and concatenation controls whether output columns are separated. Real data extraction tasks — reordering CSV columns, building key-value pairs, reformatting log entries — depend on this distinction to produce correctly spaced or delimited output.

---

### Example 4: Print the Last Field with $NF

`NF` is a built-in variable holding the number of fields in the current record. Using `$NF`
dereferences it as a field index, giving you the last field regardless of how many fields exist.

```bash
echo "one two three four five" | awk '{ print $NF }'
# => NF = 5 (five whitespace-separated tokens)
# => $NF = $5 = "five" (last field)
# => Output: five

echo "alpha beta" | awk '{ print $NF }'
# => NF = 2
# => $NF = $2 = "beta"
# => Output: beta
```

**Key takeaway:** `$NF` always refers to the last field because `NF` holds the field count; `$(NF-1)` gives the second-to-last field.

**Why it matters:** Many command outputs end with the most useful value — a filename, a port number, a status. Using `$NF` instead of hardcoding a column number makes scripts resilient to inputs with varying column counts, such as file listings where the path appears at the end.

---

### Example 5: Print the Entire Record with $0

`$0` contains the complete current record exactly as it was read from input, before any field
splitting. Printing `$0` is the same as the default action, but using it explicitly signals
intent in longer programs.

```bash
printf "first line\nsecond line\nthird line\n" | awk '{ print $0 }'
# => $0 holds the full unmodified line for each record
# => print $0 is identical to the default action
# => Output:
# => first line
# => second line
# => third line
```

**Key takeaway:** `$0` is the entire current record; assigning to `$0` re-parses it into fields, while assigning to a field like `$1="new"` rebuilds `$0` using OFS.

**Why it matters:** Explicit use of `$0` communicates to readers that the program intentionally operates on whole lines. It also enables the powerful pattern of modifying `$0` to retokenize fields, which underpins many data transformation idioms.

---

## Field Separators

### Example 6: Custom Input Field Separator with -F

By default awk splits fields on runs of whitespace. The `-F` flag sets a custom input field
separator (FS) — essential for CSV, TSV, colon-delimited files like `/etc/passwd`, and any
non-space-delimited format.

```bash
echo "root:x:0:0:root:/root:/bin/bash" | awk -F: '{ print $1, $6 }'
# => -F: sets FS to ":"
# => $1 = "root" (username), $6 = "/root" (home directory)
# => Comma inserts OFS (default space) between fields
# => Output: root /root

echo "alice,30,engineer" | awk -F, '{ print $2 }'
# => -F, sets FS to ","
# => $2 = "30"
# => Output: 30
```

**Key takeaway:** `-F` sets the input field separator for the entire program; you can also set it inside a BEGIN block with `FS=","` for the same effect.

**Why it matters:** Real-world data rarely uses simple spaces — system files use colons, exports use commas or tabs, and application logs use pipes or semicolons. Setting `-F` correctly is the prerequisite for every field-extraction task on structured data.

---

### Example 7: Tab-Separated Input

Tab-separated values (TSV) are common in data exports and database dumps. Setting `FS="\t"` or
`-F'\t'` handles them correctly, distinguishing tabs from spaces.

```bash
printf "name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA\n" | awk -F'\t' '{ print $1, $3 }'
# => FS = "\t" (tab character)
# => First record: $1="name", $3="city" => header row
# => Second record: $1="Alice", $3="NYC"
# => Third record: $1="Bob", $3="LA"
# => Output:
# => name city
# => Alice NYC
# => Bob LA
```

**Key takeaway:** Use `-F'\t'` or `FS="\t"` for tab-separated input; unlike space-splitting, a single tab always means exactly one empty-or-filled field boundary.

**Why it matters:** TSV files are preferred over CSV in many data pipelines because tabs rarely appear in field values. Database exports, spreadsheet downloads, and bioinformatics tools frequently produce TSV. Knowing how to handle them prevents the subtle bugs that arise from treating tabs as whitespace.

---

### Example 8: Setting OFS — Output Field Separator

`OFS` controls the string inserted between fields when `print` uses commas. Setting OFS in a
BEGIN block is the standard way to reformat column-based output.

```bash
echo "Alice 30 Engineer" | awk 'BEGIN { OFS="," } { print $1, $2, $3 }'
# => BEGIN block sets OFS to "," before any input is read
# => { print $1, $2, $3 } inserts OFS between each pair
# => Output: Alice,30,Engineer

echo "Alice 30 Engineer" | awk 'BEGIN { OFS=" | " } { print $1, $3 }'
# => OFS is now " | "
# => Output: Alice | Engineer
```

**Key takeaway:** Setting `OFS` in a BEGIN block changes all comma-separated `print` arguments to use that separator; assigning to any field (even `$1=$1`) forces awk to rebuild `$0` using OFS.

**Why it matters:** Converting between delimited formats — space to CSV, CSV to pipe-delimited — is a daily task in data wrangling. Setting OFS in BEGIN is the clean, idiomatic approach that avoids string concatenation and keeps output consistent across all records.

---

### Example 9: Multi-Character Field Separator

FS can be a multi-character string or a regular expression, not just a single character. This
handles delimiters like `::`, `|`, or patterns like one-or-more spaces.

```bash
echo "alice::engineer::newyork" | awk -F'::' '{ print $1, $2, $3 }'
# => FS = "::" (two-character string)
# => $1="alice", $2="engineer", $3="newyork"
# => Output: alice engineer newyork

echo "one   two   three" | awk -F' +' '{ print $2 }'
# => FS = " +" (regex: one or more spaces)
# => Splits on any run of spaces: $2="two"
# => Output: two
```

**Key takeaway:** When FS contains more than one character, awk treats it as a regular expression; single-space FS is special and matches runs of whitespace, while `" +"` explicitly matches one-or-more spaces.

**Why it matters:** Multi-character separators appear in structured log formats, database dump files, and legacy application outputs. Using FS as a regex prevents the brittle workarounds of stripping extra separators or using multiple passes to normalize spacing.

---

## Built-in Variables

### Example 10: NR — Record Number

`NR` is the number of records (lines) read so far across all input files. It increments with
each record and is available inside every pattern-action pair.

```bash
printf "alpha\nbeta\ngamma\ndelta\n" | awk '{ print NR, $0 }'
# => NR starts at 1 and increments each line
# => Record 1: NR=1, $0="alpha"
# => Record 2: NR=2, $0="beta"
# => Record 3: NR=3, $0="gamma"
# => Record 4: NR=4, $0="delta"
# => Output:
# => 1 alpha
# => 2 beta
# => 3 gamma
# => 4 delta
```

**Key takeaway:** `NR` gives the absolute line number across all input; it never resets between files, unlike `FNR` which resets to 1 at the start of each new file.

**Why it matters:** Line numbers are essential for debugging, generating sequence numbers in reports, and implementing line-range filters. Production scripts routinely use NR to skip header rows (`NR > 1`), limit processing to a window of lines, or add row numbers to output.

---

### Example 11: NF — Number of Fields

`NF` holds the count of fields in the current record after splitting. It changes with each
record if the input has variable-width rows.

```bash
printf "one two three\nfour five\nsix seven eight nine\n" | awk '{ print NF, $0 }'
# => Record 1: NF=3, fields are "one","two","three"
# => Record 2: NF=2, fields are "four","five"
# => Record 3: NF=4, fields are "six","seven","eight","nine"
# => Output:
# => 3 one two three
# => 2 four five
# => 4 six seven eight nine
```

**Key takeaway:** `NF` reflects the actual field count of the current record; filtering with `NF == 3` selects only records with exactly three fields, and `NF > 0` filters out blank lines.

**Why it matters:** Variable-width input is the rule, not the exception. Log files drop optional fields, CSV exports omit trailing commas, and command output varies by system state. Checking NF before accessing fields prevents out-of-bounds reads and makes scripts robust to malformed input.

---

### Example 12: Combining NR and NF

Using both `NR` and `NF` together enables powerful filtering: skip header rows while also
enforcing structural expectations about column counts.

```bash
printf "name age city\nAlice 30 NYC\nBob 25\nCarol 35 LA\n" | awk 'NR > 1 && NF == 3 { print $1, $3 }'
# => NR > 1: skip the header row (record 1)
# => NF == 3: skip "Bob 25" which only has 2 fields
# => For remaining matching records: print name ($1) and city ($3)
# => Record 2 (NR=2, NF=3): Alice NYC => printed
# => Record 3 (NR=3, NF=2): Bob 25 => skipped (NF != 3)
# => Record 4 (NR=4, NF=3): Carol LA => printed
# => Output:
# => Alice NYC
# => Carol LA
```

**Key takeaway:** Combining `NR > 1` with field-count guards is the standard idiom for processing data files that have a header row and potentially missing columns.

**Why it matters:** Header-skipping and structural validation are two of the most frequent pre-processing steps in data pipelines. Doing both in a single awk condition eliminates the need for separate `tail -n +2` and `grep` commands, keeping the pipeline compact and readable.

---

## Pattern Matching

### Example 13: Regex Pattern Matching

A regex pattern enclosed in `/pattern/` matches records containing that pattern anywhere.
awk uses Extended Regular Expressions (ERE), the same dialect as `egrep`.

```bash
printf "apple pie\nbanana split\napricot jam\norange juice\n" | awk '/^a/'
# => /^a/ matches records starting with the letter "a"
# => "apple pie" => matches (starts with 'a')
# => "banana split" => no match
# => "apricot jam" => matches (starts with 'a')
# => "orange juice" => no match
# => Default action {print} fires for each match
# => Output:
# => apple pie
# => apricot jam
```

**Key takeaway:** Regex patterns in awk use ERE syntax; anchors `^` and `$` match record start and end, and the entire record (`$0`) is tested by default when no field comparison is made.

**Why it matters:** Pattern-based line filtering is awk's killer feature for log analysis. Filtering lines matching a status code, an IP range, or an error keyword without a separate `grep` pass keeps the pipeline simpler and avoids double-parsing the input.

---

### Example 14: Numeric Comparison Pattern

Patterns can be relational expressions comparing fields or variables. This selects records
based on field values rather than text content.

```bash
printf "Alice 85\nBob 92\nCarol 71\nDave 88\n" | awk '$2 > 80 { print $1, "passed" }'
# => $2 is the score field (numeric string, awk auto-converts)
# => Record 1: $2=85 > 80 => matches => print "Alice passed"
# => Record 2: $2=92 > 80 => matches => print "Bob passed"
# => Record 3: $2=71 > 80 => no match (71 is not > 80)
# => Record 4: $2=88 > 80 => matches => print "Dave passed"
# => Output:
# => Alice passed
# => Bob passed
# => Dave passed
```

**Key takeaway:** awk automatically converts string fields to numbers in numeric comparisons; strings that don't look numeric compare as 0, so `$2 > 80` works correctly when `$2` contains digit characters.

**Why it matters:** Numeric threshold filtering is ubiquitous — finding processes using more than 80% CPU, transactions exceeding a dollar amount, log entries above an error severity. awk's auto-coercion eliminates the explicit conversion step required in most other scripting languages.

---

### Example 15: String Comparison Pattern

Fields can be compared to string literals using `==`, `!=`, `<`, `>`, `<=`, `>=`. String
comparisons are lexicographic and case-sensitive by default.

```bash
printf "Alice Engineer\nBob Manager\nCarol Engineer\nDave Director\n" | awk '$2 == "Engineer" { print $1 }'
# => Compare $2 (role field) to the string "Engineer"
# => Record 1: $2="Engineer" => matches => print "Alice"
# => Record 2: $2="Manager" => no match
# => Record 3: $2="Engineer" => matches => print "Carol"
# => Record 4: $2="Director" => no match
# => Output:
# => Alice
# => Carol
```

**Key takeaway:** String equality with `==` is case-sensitive; use `tolower($2) == "engineer"` for case-insensitive matching, or regex matching with `$2 ~ /engineer/i` in gawk.

**Why it matters:** Filtering by exact field value is fundamental to data extraction: selecting all rows with a specific status, category, or identifier. String comparisons in patterns are cleaner than regex when the match is literal and exact, avoiding accidental partial matches.

---

### Example 16: Compound Patterns with && and ||

Multiple conditions combine with `&&` (AND) and `||` (OR) to create compound patterns, enabling
multi-criteria filtering in a single awk pass.

```bash
printf "Alice 85 Engineer\nBob 92 Manager\nCarol 71 Engineer\nDave 88 Manager\n" | \
  awk '$2 > 80 && $3 == "Engineer" { print $1 }'
# => Condition 1: $2 (score) > 80
# => Condition 2: $3 (role) == "Engineer"
# => Both must be true (&&)
# => Record 1: 85>80 AND Engineer => matches => print "Alice"
# => Record 2: 92>80 BUT Manager => no match
# => Record 3: 71 NOT >80 => no match
# => Record 4: 88>80 BUT Manager => no match
# => Output: Alice
```

**Key takeaway:** `&&` requires both conditions true; `||` requires at least one; `!` negates a condition; operator precedence follows standard C rules with parentheses available for grouping.

**Why it matters:** Multi-criteria filtering eliminates multiple pipeline stages. Instead of `grep | awk` or `awk | awk`, one compound pattern achieves the same result in a single pass, which is both faster on large files and easier to read as a single statement of intent.

---

### Example 17: Negated Pattern with Exclamation Mark

Prepending `!` to a pattern inverts it, selecting records that do NOT match. This is the awk
equivalent of `grep -v`.

```bash
printf "INFO: server started\nERROR: connection failed\nINFO: request received\nWARN: slow query\n" | \
  awk '!/^INFO/'
# => !/^INFO/ selects records NOT starting with "INFO"
# => "INFO: server started" => matches /^INFO/ => SKIP (negated)
# => "ERROR: connection failed" => does NOT match => PRINT
# => "INFO: request received" => matches /^INFO/ => SKIP
# => "WARN: slow query" => does NOT match => PRINT
# => Output:
# => ERROR: connection failed
# => WARN: slow query
```

**Key takeaway:** `!pattern` is the logical inverse of `pattern`; `!/regex/` inverts a regex match and is equivalent to `grep -v regex` but usable within a larger awk program.

**Why it matters:** Exclusion filters are as common as inclusion filters — stripping comment lines, removing header rows already processed, excluding healthy status messages from error reports. The `!` prefix keeps the logic inline without needing a separate inverted condition.

---

### Example 18: Range Pattern

A range pattern `/start/,/end/` activates on the line matching `/start/` and deactivates after
the line matching `/end/`, processing the inclusive range of lines between them.

```bash
printf "header\n=== START ===\nline one\nline two\n=== END ===\nfooter\n" | \
  awk '/START/,/END/'
# => Range activates when /START/ matches
# => Range deactivates AFTER /END/ matches
# => "header" => range not active => skip
# => "=== START ===" => /START/ matches => range activates => PRINT
# => "line one" => range active => PRINT
# => "line two" => range active => PRINT
# => "=== END ===" => range active => PRINT, then deactivates
# => "footer" => range not active => skip
# => Output:
# => === START ===
# => line one
# => line two
# => === END ===
```

**Key takeaway:** Range patterns are inclusive — both the start and end matching lines are printed; the range can reactivate if `/start/` matches again after the range closes.

**Why it matters:** Extracting sections from structured text files — configuration blocks, log time windows, stanzas between delimiters — is a common sysadmin task. Range patterns handle this in one expression without tracking state variables manually.

---

## BEGIN and END Blocks

### Example 19: BEGIN Block

The `BEGIN` block executes once before awk reads any input. It is the standard place to
initialize variables, set separators, and print headers.

```bash
printf "Alice 30\nBob 25\nCarol 35\n" | awk '
BEGIN {
  # => Executes BEFORE the first input line is read
  print "Name Age"         # => Output: Name Age
  print "---- ---"         # => Output: ---- ---
}
{ print $1, $2 }           # => Executes for each input record
'
# => Output:
# => Name Age
# => ---- ---
# => Alice 30
# => Bob 25
# => Carol 35
```

**Key takeaway:** `BEGIN` runs exactly once before any input is processed; it has access to ARGV and ARGC, can set FS/OFS/RS/ORS, and can exit the program early with `exit`.

**Why it matters:** Printing report headers, initializing counters, and setting separators are all actions that must happen before the first line arrives. BEGIN makes this explicit and avoids the NR==1 guard pattern, keeping initialization logic cleanly separated from per-record processing.

---

### Example 20: END Block

The `END` block executes once after all input has been processed. It is the standard place to
print summaries, totals, averages, and closing report lines.

```bash
printf "85\n92\n71\n88\n" | awk '
BEGIN { total = 0; count = 0 }   # => Initialize accumulators before input
{
  total += $1                     # => Add each score to running total
  count++                         # => Increment record counter
}
END {
  # => Executes AFTER the last input line is processed
  print "Total:", total           # => Output: Total: 336
  print "Count:", count           # => Output: Count: 4
  print "Average:", total/count   # => Output: Average: 84
}
'
# => Output:
# => Total: 336
# => Count: 4
# => Average: 84
```

**Key takeaway:** `END` runs exactly once after all input is consumed; `NR` still holds the final record count in END, and `FILENAME` holds the last processed filename.

**Why it matters:** Aggregation — counting, summing, averaging — is one of awk's primary use cases. The BEGIN/action/END structure maps naturally to setup/process/report, making it the standard template for generating summary statistics from log files, metrics data, and tabular reports.

---

### Example 21: BEGIN and END Together

Combining BEGIN and END with per-record processing is the complete awk program structure.
This example demonstrates the full three-part template.

```bash
printf "Alice Engineer 85000\nBob Manager 95000\nCarol Engineer 82000\n" | awk '
BEGIN {
  OFS="\t"                          # => Use tab as output separator
  print "Name\tSalary"              # => Print header
  print "----\t------"
  max_salary = 0                    # => Initialize tracker
}
{
  salary = $3 + 0                   # => Convert $3 to number (+ 0 forces numeric)
  print $1, $3                      # => Print name and salary, tab-separated
  if (salary > max_salary) {        # => Track highest salary
    max_salary = salary             # => Update max when current exceeds it
    top_earner = $1                 # => Record whose salary this is
  }
}
END {
  print "----\t------"
  print "Top earner: " top_earner " at $" max_salary  # => Summary line
}
'
# => Output:
# => Name     Salary
# => ----     ------
# => Alice    85000
# => Bob      95000
# => Carol    82000
# => ----     ------
# => Top earner: Bob at $95000
```

**Key takeaway:** The BEGIN/main-action/END triad is awk's fundamental program structure: BEGIN initializes, the main action processes each record, and END produces the final output.

**Why it matters:** This three-part structure maps directly to ETL (Extract, Transform, Load) pipelines: setup, per-row transformation, and summary. Understanding it as a template rather than three separate features unlocks awk's full power for building complete data processing programs.

---

## Arithmetic and Variables

### Example 22: Arithmetic Operations

awk supports the standard arithmetic operators `+`, `-`, `*`, `/`, `%` (modulo), and `^`
(exponentiation). Variables do not need to be declared — they initialize to 0 or empty string.

```bash
echo "10 3" | awk '{
  a = $1        # => a = 10
  b = $2        # => b = 3
  print a + b   # => 13 (addition)
  print a - b   # => 7  (subtraction)
  print a * b   # => 30 (multiplication)
  print a / b   # => 3.33333 (division, floating point result)
  print a % b   # => 1  (modulo: remainder of 10/3)
  print a ^ b   # => 1000 (exponentiation: 10 to the 3rd power)
}'
# => Output:
# => 13
# => 7
# => 30
# => 3.33333
# => 1
# => 1000
```

**Key takeaway:** awk uses floating-point arithmetic throughout; integer division like `10/3` produces `3.33333`, not `3` — use `int(a/b)` to truncate to an integer.

**Why it matters:** Arithmetic is central to report generation, metric computation, and data transformation. Unlike Python or Ruby, awk does not require importing a math module or wrapping values in numeric types — fields convert to numbers automatically, enabling compact calculations directly on parsed data.

---

### Example 23: Increment, Decrement, and Assignment Operators

awk supports C-style shorthand operators: `++`, `--`, `+=`, `-=`, `*=`, `/=`, `%=`. These
shorten common accumulation patterns.

```bash
printf "5\n10\n15\n20\n" | awk '
BEGIN { count = 0; total = 0 }
{
  count++              # => Pre-increment: count = count + 1 each line
  total += $1          # => Compound assignment: total = total + $1
}
END {
  print count, total   # => count=4, total=50
  # => count++ is equivalent to count = count + 1
  # => total += $1 is equivalent to total = total + $1
}
'
# => Output: 4 50
```

**Key takeaway:** `count++` and `total += $1` are the most common accumulation idioms; `++count` increments before use, `count++` increments after — the difference only matters when the expression value is used directly.

**Why it matters:** Accumulation patterns are the backbone of every awk counting and summing program. Using `count++` instead of `count = count + 1` is not just shorter — it signals intent clearly to experienced readers, aligning with the conventions used in shell scripts, C code, and every major language that borrowed from C syntax.

---

### Example 24: String Concatenation

awk concatenates strings by placing them adjacent to each other with no operator. This is
different from most languages, which use `+` or `.` for string joining.

```bash
echo "Alice Engineer" | awk '{
  greeting = "Hello, " $1 "!"     # => Adjacent expressions concatenate
  # => "Hello, " + $1 + "!" => "Hello, Alice!"
  print greeting                  # => Output: Hello, Alice!

  role_tag = "[" $2 "]"           # => Bracket $2 field
  # => "[" + "Engineer" + "]" => "[Engineer]"
  full = $1 " " role_tag          # => Join name and tag
  # => "Alice" + " " + "[Engineer]" => "Alice [Engineer]"
  print full                      # => Output: Alice [Engineer]
}'
# => Output:
# => Hello, Alice!
# => Alice [Engineer]
```

**Key takeaway:** String concatenation in awk is implicit — adjacent string expressions join without any operator; this is unlike Python (`+`), Perl (`.`), or JavaScript (`+`).

**Why it matters:** Building formatted output strings — constructing log lines, generating report cells, assembling key-value pairs — relies on concatenation. The implicit operator reduces visual noise in compact one-liners and aligns with the way awk programs are typically written.

---

## Output Formatting

### Example 25: printf for Formatted Output

`printf` provides C-style formatted output without an automatic newline, giving precise control
over field widths, decimal places, and alignment.

```bash
printf "Alice 85.5\nBob 92.333\nCarol 71.1\n" | awk '{
  # %-10s: left-align string in 10-character field
  # %6.2f: right-align float in 6 chars, 2 decimal places
  printf "%-10s %6.2f\n", $1, $2
  # => Field 1 ($1) padded to 10 chars left-aligned
  # => Field 2 ($2) formatted as float with 2 decimals in 6-char column
}'
# => Output:
# => Alice       85.50
# => Bob         92.33
# => Carol       71.10
```

**Key takeaway:** `printf` uses `%s` for strings, `%d` for integers, `%f` for floats; `-` flag left-aligns, a number specifies minimum width, `.N` specifies precision after the decimal.

**Why it matters:** Tabular report generation requires aligned columns. `print` alone produces ragged output; `printf` formats it into readable tables that align numbers, pad strings, and control decimal precision — essential for financial reports, system summaries, and human-readable dashboards.

---

### Example 26: Redirect Output to a File

awk can redirect output to files using `>` (overwrite) and `>>` (append) directly inside the
program. The file stays open until awk exits or you explicitly close it.

```bash
printf "Alice Engineer\nBob Manager\nCarol Engineer\nDave Director\n" | awk '
{
  # Redirect each line to a file named after the role
  print $1 > ("/tmp/awk_role_" $2 ".txt")
  # => "Alice Engineer" => appends "Alice" to /tmp/awk_role_Engineer.txt
  # => "Bob Manager"    => appends "Bob" to /tmp/awk_role_Manager.txt
  # => "Carol Engineer" => appends "Carol" to /tmp/awk_role_Engineer.txt
  # => "Dave Director"  => appends "Dave" to /tmp/awk_role_Director.txt
}
END {
  print "Files written"   # => Output: Files written
}
'
# => Creates three files:
# => /tmp/awk_role_Engineer.txt: Alice\nCarol
# => /tmp/awk_role_Manager.txt:  Bob
# => /tmp/awk_role_Director.txt: Dave
cat /tmp/awk_role_Engineer.txt
# => Output:
# => Alice
# => Carol
```

**Key takeaway:** Redirect `>` inside awk opens the file on first use and keeps it open; use `close(filename)` to flush and reopen, which is necessary when the same filename is used in both write and read operations.

**Why it matters:** Splitting input into multiple output files based on field values — partitioning logs by date, separating records by category — is a common ETL pattern. awk's inline redirection handles this without external `split` utilities or temporary arrays, processing the split in a single pass.

---

### Example 27: Pipe Output to a Command

awk can pipe output to shell commands using `|`. The pipe stays open between records, batching
output to the command rather than opening a new process per line.

```bash
printf "banana\napple\ncherry\ndate\n" | awk '{ print | "sort" }'
# => All records are piped to a single "sort" process
# => awk accumulates lines and sends them when the pipe closes (at exit)
# => sort receives: banana\napple\ncherry\ndate
# => sort produces alphabetical order
# => Output:
# => apple
# => banana
# => cherry
# => date
```

**Key takeaway:** The pipe `|` in awk opens the command once and sends all matching output to it; to open a new process per record, use `close("sort")` after each `print`.

**Why it matters:** Piping awk output to sort, mail, or other commands from within the program avoids shell pipeline complexity. This pattern is especially useful when the set of records to pipe depends on awk logic — you can conditionally pipe some records to one command and others to another.

---

### Example 28: Multiple Statements and Comments

awk allows multiple statements per action block using semicolons or newlines. Comments start
with `#` and continue to end of line.

```bash
printf "Alice 85\nBob 92\nCarol 71\n" | awk '
# This is a comment — ignored by awk
# Program: grade each student based on score
{
  name = $1; score = $2    # Semicolon separates statements on same line
  # => name = field 1, score = field 2

  # Determine grade using nested if/else if
  if (score >= 90) {
    grade = "A"            # => 90+ => A
  } else if (score >= 80) {
    grade = "B"            # => 80-89 => B
  } else if (score >= 70) {
    grade = "C"            # => 70-79 => C
  } else {
    grade = "F"            # => below 70 => F
  }

  print name, score, grade # => Print all three values
}
'
# => Output:
# => Alice 85 B
# => Bob 92 A
# => Carol 71 C
```

**Key takeaway:** Semicolons separate statements on one line; newlines inside `{...}` separate statements across lines; comments start with `#` and apply to the entire rest of the line.

**Why it matters:** Multi-statement blocks with comments are the difference between a one-liner and a maintainable script. Production awk programs in version-controlled codebases need comments explaining business logic — the grading thresholds, the format expectations, the edge cases — just as any other code does.
