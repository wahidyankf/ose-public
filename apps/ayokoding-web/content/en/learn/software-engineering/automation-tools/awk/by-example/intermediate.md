---
title: "Intermediate"
weight: 10000002
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Intermediate awk examples covering arrays, user-defined functions, string functions, getline, multiple files, and regular expressions"
tags: ["awk", "text-processing", "tutorial", "by-example", "code-first", "intermediate"]
---

This tutorial covers intermediate awk features through 28 self-contained, heavily annotated
examples. Each example builds on the beginner concepts and demonstrates one focused capability.
The examples progress through associative arrays, user-defined functions, built-in string
functions, getline for reading external data, multi-file processing, custom record separators,
and advanced pattern matching — spanning 40–75% of awk's feature set.

## Associative Arrays

### Example 29: Basic Associative Array

awk arrays are associative — indexed by arbitrary string keys, not integers. They require no
declaration and grow dynamically as keys are assigned.

```bash
printf "Alice Engineer\nBob Manager\nCarol Engineer\nDave Manager\nEve Director\n" | awk '
{
  count[$2]++    # => Use $2 (role) as array key; increment counter
  # => After "Alice Engineer": count["Engineer"] = 1
  # => After "Bob Manager":    count["Manager"]  = 1
  # => After "Carol Engineer": count["Engineer"] = 2
  # => After "Dave Manager":   count["Manager"]  = 2
  # => After "Eve Director":   count["Director"] = 1
}
END {
  # Print each role and its count
  for (role in count) {
    print role, count[role]   # => Iterate over all keys in count array
  }
}
'
# => Output (order not guaranteed — arrays are unordered):
# => Engineer 2
# => Manager 2
# => Director 1
```

**Key takeaway:** `array[key]++` creates the key with value 0 if absent, then increments — awk arrays auto-vivify, meaning you never need to initialize keys before first use.

**Why it matters:** Frequency counting — counting occurrences of status codes, IP addresses, user agents, error types — is the most common log analysis pattern. awk's associative arrays make it a one-pass operation without sorting or pre-processing, outperforming `sort | uniq -c` for complex multi-field aggregations.

---

### Example 30: Array Iteration with for..in

The `for (key in array)` loop iterates over all keys in an array in unspecified order. If
sorted output is needed, pipe through `sort` or use GNU awk's `asorti`.

```bash
printf "red 5\nblue 3\nred 2\ngreen 7\nblue 1\n" | awk '
{
  totals[$1] += $2    # => Accumulate totals by color (key=$1, value+=$2)
  # => After "red 5":   totals["red"]   = 5
  # => After "blue 3":  totals["blue"]  = 3
  # => After "red 2":   totals["red"]   = 7  (5+2)
  # => After "green 7": totals["green"] = 7
  # => After "blue 1":  totals["blue"]  = 4  (3+1)
}
END {
  for (color in totals) {              # => Iterate all keys
    printf "%-10s %d\n", color, totals[color]
    # => "red"   7
    # => "blue"  4
    # => "green" 7
  }
}
' | sort    # => Sort output for deterministic display
# => Output:
# => blue       4
# => green      7
# => red        7
```

**Key takeaway:** `for (key in array)` visits every key exactly once in implementation-defined order; sorting by piping to `sort -k2 -rn` or using `asorti()` (gawk) produces ordered output.

**Why it matters:** Group-by aggregation — summing sales by region, counting errors by type, totaling bandwidth by user — is a fundamental analytics operation. The `for (key in array)` pattern handles this cleanly in a single awk program, replacing SQL GROUP BY for text-based data sources.

---

### Example 31: Testing if a Key Exists

The `in` operator tests whether a key exists in an array without creating it (unlike accessing
`array[key]` directly, which auto-vivifies).

```bash
printf "alice\nbob\nalice\ncharlie\nbob\nalice\n" | awk '
{
  if ($1 in seen) {
    # => "in" tests existence without creating the key
    print $1, "duplicate"     # => Prints when already seen
  } else {
    seen[$1] = 1              # => Mark as seen on first occurrence
    print $1, "new"           # => Prints on first occurrence
  }
}
'
# => Record 1 "alice":   not in seen => new, seen["alice"]=1
# => Record 2 "bob":     not in seen => new, seen["bob"]=1
# => Record 3 "alice":   in seen => duplicate
# => Record 4 "charlie": not in seen => new, seen["charlie"]=1
# => Record 5 "bob":     in seen => duplicate
# => Record 6 "alice":   in seen => duplicate
# => Output:
# => alice new
# => bob new
# => alice duplicate
# => charlie new
# => bob duplicate
# => alice duplicate
```

**Key takeaway:** Use `(key in array)` to test existence; direct access `array[key]` would silently create the key with value "" — a subtle bug when checking existence before assignment.

**Why it matters:** Deduplication and first-occurrence detection are essential for report generation, audit trails, and data cleaning. The safe existence test prevents the class of bugs where checking `array[key] == ""` accidentally creates empty entries that pollute iteration.

---

### Example 32: Deleting Array Elements

The `delete` statement removes a key-value pair from an array. `delete array` (without a key)
removes all elements, clearing the entire array.

```bash
printf "apple\nbanana\napple\ncherry\nbanana\napple\n" | awk '
{
  freq[$1]++   # => Count occurrences of each word
}
END {
  # Remove words that appear only once (keep only duplicates)
  for (word in freq) {
    if (freq[word] == 1) {
      delete freq[word]    # => Remove single-occurrence entries
      # => "cherry" appears once => deleted from freq array
    }
  }
  print "Words appearing more than once:"
  for (word in freq) {
    print word, freq[word]   # => Only remaining entries (apple, banana)
  }
}
'
# => freq after counting: apple=3, banana=2, cherry=1
# => delete removes "cherry" (count=1)
# => Remaining: apple=3, banana=2
# => Output:
# => Words appearing more than once:
# => apple 3
# => banana 2
```

**Key takeaway:** `delete array[key]` removes a single entry; `delete array` clears all entries; iterating and deleting simultaneously is safe in awk (unlike in some other languages).

**Why it matters:** Cleanup after aggregation — filtering out low-frequency entries, removing expired cache entries, pruning zero-count categories — requires deletion. Understanding that deletion is safe during iteration prevents the common defensive workaround of collecting keys to delete in a separate array first.

---

### Example 33: Array as a Set for Deduplication

Using array keys as set membership enables deduplication in a single pass without sorting.
Only the first occurrence of each value is output.

```bash
printf "apple\nbanana\napple\ncherry\nbanana\ndate\napple\n" | awk '
!seen[$0]++
# => For each record $0:
# =>   Check if seen[$0] is 0 (falsy) — ! inverts to true => PRINT
# =>   Then increment seen[$0] (post-increment happens after test)
# =>   On second occurrence: seen[$0]=1 => !1 = false => SKIP
# => "apple" first time:  seen["apple"]=0 => !0=true => print, seen becomes 1
# => "banana" first time: seen["banana"]=0 => print, seen becomes 1
# => "apple" second time: seen["apple"]=1 => !1=false => skip
# => "cherry":            seen["cherry"]=0 => print
# => "banana" second:     seen["banana"]=1 => skip
# => "date":              seen["date"]=0 => print
# => "apple" third:       seen["apple"]=2 => skip
'
# => Output (first occurrence order preserved):
# => apple
# => banana
# => cherry
# => date
```

**Key takeaway:** `!seen[$0]++` is the canonical awk deduplication idiom — it prints a line only on first occurrence by using the array as a seen-set with the `!` and post-increment trick.

**Why it matters:** Order-preserving deduplication is impossible with `sort -u` (which sorts). The `!seen[$0]++` one-liner is one of awk's most famous idioms — it appears in shell scripting references, Stack Overflow answers, and production scripts precisely because it solves a common problem elegantly.

---

## User-Defined Functions

### Example 34: Defining and Calling a Function

Functions are defined with `function name(params) { body }` anywhere in the awk program.
They can return values with `return` and share global variables.

```bash
printf "85\n92\n71\n88\n64\n" | awk '
function grade(score) {
  # => Returns letter grade based on numeric score
  if (score >= 90) return "A"    # => 90+ => A
  if (score >= 80) return "B"    # => 80-89 => B
  if (score >= 70) return "C"    # => 70-79 => C
  return "F"                     # => below 70 => F
}

{
  g = grade($1)                  # => Call user-defined function with $1
  printf "%d => %s\n", $1, g    # => Print score and grade
}
'
# => grade(85) returns "B"
# => grade(92) returns "A"
# => grade(71) returns "C"
# => grade(88) returns "B"
# => grade(64) returns "F"
# => Output:
# => 85 => B
# => 92 => A
# => 71 => C
# => 88 => B
# => 64 => F
```

**Key takeaway:** Functions in awk are global (no closures or modules); parameters are passed by value for scalars, by reference for arrays; local variables are declared as extra parameters by convention (`function f(a, b,    local1, local2)`).

**Why it matters:** Functions encapsulate reusable logic — grade calculations, data validation, formatting — that would otherwise repeat in every action block. For programs longer than a few lines, functions are the primary tool for keeping awk code readable and testable.

---

### Example 35: Local Variables in Functions

awk has no `local` keyword. The convention for local variables is to declare them as extra
function parameters separated by extra whitespace from the real parameters.

```bash
printf "hello world\nfoo bar baz\ntest\n" | awk '
function count_chars(str,    i, n, total) {
  # => "str" is the real parameter
  # => "i", "n", "total" are local variables (extra params, never passed)
  total = 0
  n = length(str)         # => n = number of chars in str
  for (i = 1; i <= n; i++) {
    if (substr(str, i, 1) != " ")  # => Skip space characters
      total++             # => Count non-space characters
  }
  return total            # => Return non-space character count
}

{
  c = count_chars($0)           # => Count non-space chars in full line
  printf "%-20s => %d chars\n", $0, c
}
'
# => "hello world"    => h,e,l,l,o,w,o,r,l,d = 10 non-space chars
# => "foo bar baz"    => f,o,o,b,a,r,b,a,z   = 9 non-space chars
# => "test"           => t,e,s,t              = 4 non-space chars
# => Output:
# => hello world         => 10 chars
# => foo bar baz         => 9 chars
# => test                => 4 chars
```

**Key takeaway:** Declare local variables as extra parameters after real parameters, separated by extra whitespace — this is a community convention, not syntax; awk treats them as uninitialized parameters that default to "" or 0.

**Why it matters:** Without local variables, helper functions accidentally pollute global state. The extra-parameter convention is universally understood in awk code and prevents subtle bugs where two functions both use a variable named `i` for their loop counter.

---

## String Functions

### Example 36: length() — String and Array Length

`length(str)` returns the number of characters in a string. `length(array)` returns the number
of elements. `length` with no argument returns the length of `$0`.

```bash
printf "hello\nlonger string here\nhi\n" | awk '
{
  n = length($0)        # => Number of characters in current record
  # => "hello" => 5
  # => "longer string here" => 18
  # => "hi" => 2
  printf "%-20s length=%d\n", $0, n
}'
# => Output:
# => hello                length=5
# => longer string here   length=18
# => hi                   length=2
```

**Key takeaway:** `length(x)` works on strings, arrays, and the implicit `$0`; it counts characters (bytes in traditional awk, Unicode code points in gawk with proper locale).

**Why it matters:** Length checks validate field widths, detect truncated records, enforce maximum lengths in data pipelines, and help format fixed-width reports. It is the most frequently used string function alongside `substr` and `split`.

---

### Example 37: substr() — Substring Extraction

`substr(string, start)` extracts from position `start` to end. `substr(string, start, length)`
extracts exactly `length` characters. Positions are 1-indexed.

```bash
echo "2026-04-01T12:30:00" | awk '{
  year  = substr($0, 1, 4)    # => Characters 1-4: "2026"
  month = substr($0, 6, 2)    # => Characters 6-7: "04"
  day   = substr($0, 9, 2)    # => Characters 9-10: "01"
  time  = substr($0, 12)      # => Characters 12 to end: "12:30:00"
  printf "Year=%s Month=%s Day=%s Time=%s\n", year, month, day, time
}'
# => Input: "2026-04-01T12:30:00"
# => substr extracts fixed-position substrings
# => Output: Year=2026 Month=04 Day=01 Time=12:30:00
```

**Key takeaway:** `substr` is 1-indexed (not 0-indexed like most languages); if `start + length` exceeds the string, substr returns up to the end without error.

**Why it matters:** Fixed-format data — ISO dates, fixed-width log lines, packed binary text exports — requires positional extraction rather than delimiter-based splitting. `substr` handles these formats without requiring a custom FS or pre-processing step.

---

### Example 38: index() — Finding a Substring

`index(string, target)` returns the position of the first occurrence of `target` in `string`,
or 0 if not found. Positions are 1-indexed.

```bash
printf "error: disk full\ninfo: all good\nerror: timeout\n" | awk '
{
  pos = index($0, "error")    # => Find "error" in the line
  # => "error: disk full":  pos = 1 (starts at position 1)
  # => "info: all good":    pos = 0 (not found)
  # => "error: timeout":    pos = 1
  if (pos > 0) {
    msg = substr($0, pos + 7)  # => Skip "error: " (7 chars) to get message
    print "ALERT:", msg         # => Print just the error message part
  }
}'
# => Output:
# => ALERT: disk full
# => ALERT: timeout
```

**Key takeaway:** `index` returns 1-based position or 0 for not-found; combine with `substr` to extract content relative to a found substring's position.

**Why it matters:** Searching for a known string within a field — finding a delimiter inside a value, locating a key in a JSON-like line, detecting a prefix — is more precise than a regex when the target is a literal string. `index` avoids regex special-character escaping for literal searches.

---

### Example 39: split() — Split String into Array

`split(string, array, separator)` splits `string` on `separator` and stores the parts in
`array[1]`, `array[2]`, ..., returning the number of parts.

```bash
echo "alice:bob:carol:dave" | awk '{
  n = split($0, names, ":")   # => Split on ":" into names array
  # => n = 4 (number of parts)
  # => names[1]="alice", names[2]="bob", names[3]="carol", names[4]="dave"
  print "Count:", n
  for (i = 1; i <= n; i++) {
    print i, names[i]         # => Print index and value
  }
}'
# => Output:
# => Count: 4
# => 1 alice
# => 2 bob
# => 3 carol
# => 4 dave
```

**Key takeaway:** `split` returns the count of resulting parts and populates a numerically indexed array starting at 1; if the separator is omitted, FS is used; the separator can be a regex.

**Why it matters:** Splitting a field that itself contains a sub-delimiter — a comma-separated list in one column, a colon-delimited path in another — requires `split` because FS handles only the record-level separator. This is essential for parsing semi-structured data embedded in otherwise structured lines.

---

### Example 40: sub() and gsub() — Substitution

`sub(regex, replacement, target)` replaces the first match; `gsub(regex, replacement, target)`
replaces all matches. Both return the number of substitutions made.

```bash
echo "the cat sat on the mat" | awk '{
  original = $0               # => Save original: "the cat sat on the mat"

  n = gsub(/the/, "a", $0)   # => Replace all "the" with "a"
  # => "the cat sat on the mat" => "a cat sat on a mat"
  # => n = 2 (two replacements made)
  print $0, "(", n, "replacements)"
}'
# => Output: a cat sat on a mat ( 2 replacements)

echo "hello world hello" | awk '{
  sub(/hello/, "hi")   # => Replace only FIRST "hello"; target defaults to $0
  # => "hello world hello" => "hi world hello"
  print
}'
# => Output: hi world hello
```

**Key takeaway:** `gsub` replaces all occurrences (global); `sub` replaces only the first; both modify `$0` if target is omitted; `&` in the replacement string refers to the matched text.

**Why it matters:** Search-and-replace on streaming text is a primary use case for `sed`, but awk's `sub`/`gsub` enables the replacement to depend on other field values in the same record — something sed cannot do. This makes in-place transformations that combine substitution with conditional logic practical in a single tool.

---

### Example 41: match() — Regex Match with Position

`match(string, regex)` returns the position of the match (or 0) and sets `RSTART` and `RLENGTH`
built-in variables, enabling `substr` to extract the matched text.

```bash
printf "order-12345-shipped\norder-99-pending\nno-id-here\n" | awk '
{
  if (match($0, /[0-9]+/)) {
    # => RSTART = starting position of match
    # => RLENGTH = length of matched text
    id = substr($0, RSTART, RLENGTH)   # => Extract the matched digits
    printf "Line: %-25s => ID: %s\n", $0, id
  } else {
    printf "Line: %-25s => No ID found\n", $0
  }
}'
# => "order-12345-shipped": match at pos 7, length 5 => "12345"
# => "order-99-pending":    match at pos 7, length 2 => "99"
# => "no-id-here":          no match (RSTART=0)
# => Output:
# => Line: order-12345-shipped       => ID: 12345
# => Line: order-99-pending          => ID: 99
# => Line: no-id-here                => No ID found
```

**Key takeaway:** `match` sets `RSTART` (1-based start) and `RLENGTH` (-1 if no match); combining `match` + `substr(str, RSTART, RLENGTH)` extracts the matched portion without capturing groups.

**Why it matters:** Extracting embedded patterns — order IDs, version numbers, IP addresses from log lines — requires both detection and extraction. `match` + `substr` achieves this in POSIX awk where gawk's three-argument `match` with capture groups is unavailable.

---

### Example 42: tolower() and toupper()

`tolower(string)` converts to lowercase; `toupper(string)` converts to uppercase. Both return
the converted string without modifying the original.

```bash
printf "Alice ENGINEER New York\nBOB manager los angeles\n" | awk '{
  # Normalize: lowercase everything, then capitalize first field
  lower_line = tolower($0)    # => Entire line to lowercase
  # => "alice engineer new york"
  # => "bob manager los angeles"

  # Use toupper on just the first character of $1 for display
  name = toupper(substr($1, 1, 1)) tolower(substr($1, 2))
  # => toupper("A") + tolower("lice") = "Alice" (already mixed)
  # => toupper("B") + tolower("ob")   = "Bob"

  print name, tolower($2)   # => Name capitalized, role lowercase
}'
# => Output:
# => Alice engineer
# => Bob manager
```

**Key takeaway:** `tolower` and `toupper` operate on the entire string and return a new string; use with `substr` to capitalize only specific characters, like the first letter of a word.

**Why it matters:** Case normalization is essential for consistent comparisons — user input, system identifiers, and log levels often have inconsistent casing. Normalizing with `tolower` before comparison (`tolower($2) == "error"`) makes matches robust without requiring case-sensitive regex alternatives.

---

### Example 43: sprintf() — Format String Without Printing

`sprintf(format, args...)` formats a string like `printf` but returns it as a value instead
of printing it, enabling formatted strings to be stored in variables.

```bash
printf "Alice 85.3\nBob 92.7\nCarol 71.1\n" | awk '
{
  # Build a formatted label string, store in variable
  label = sprintf("%-10s [%5.1f%%]", $1, $2)
  # => sprintf formats without printing — returns the string
  # => "%-10s" left-pads name to 10 chars
  # => "[%5.1f%%]" formats score with 1 decimal, %% is literal %

  # Use the label in further processing
  if ($2 >= 90) {
    print label, "PASS-A"   # => Append status
  } else if ($2 >= 70) {
    print label, "PASS"
  } else {
    print label, "FAIL"
  }
}'
# => Output:
# => Alice      [ 85.3%] PASS
# => Bob        [ 92.7%] PASS-A
# => Carol      [ 71.1%] PASS
```

**Key takeaway:** `sprintf` returns a formatted string without printing; it's the awk equivalent of Python's `str.format()` or C's `snprintf`, useful when the formatted value feeds into further computation or conditional logic.

**Why it matters:** Building formatted labels, keys, or messages that are then used in array indexes, comparisons, or multi-field print statements requires `sprintf`. The alternative — inline `printf` — cannot be used where a value expression is needed.

---

## getline

### Example 44: getline from Standard Input

`getline` reads the next record from stdin into `$0`, re-splits fields, and increments NR.
It returns 1 on success, 0 on end-of-file, -1 on error.

```bash
printf "Alice\n30\nEngineer\nBob\n25\nManager\n" | awk '
NR % 3 == 1 {
  # => Every 3rd record starting at 1 is a name line
  name = $0           # => Save name from current record

  getline age         # => Read next line into "age" variable (not $0)
  # => NR increments, $0 is NOT changed when target variable given

  getline role        # => Read next line into "role" variable
  # => NR increments again

  printf "Name=%-10s Age=%-5s Role=%s\n", name, age, role
}
'
# => Record 1 (NR=1): "Alice" => name="Alice"
# =>   getline reads NR=2 "30" into age
# =>   getline reads NR=3 "Engineer" into role
# =>   Prints: Name=Alice      Age=30    Role=Engineer
# => Record 4 (NR=4): "Bob" => name="Bob"
# =>   getline reads NR=5 "25" into age
# =>   getline reads NR=6 "Manager" into role
# =>   Prints: Name=Bob        Age=25    Role=Manager
# => Output:
# => Name=Alice      Age=30    Role=Engineer
# => Name=Bob        Age=25    Role=Manager
```

**Key takeaway:** `getline var` reads the next record into `var` without changing `$0` or splitting fields; bare `getline` reads into `$0` and re-splits; both increment NR and return 1/0/-1.

**Why it matters:** Multi-line records where each line represents a different attribute — name/value pairs, stanza-format config files, MIME headers — require reading multiple lines per logical record. `getline` enables this without custom RS or complex state machines.

---

### Example 45: getline from a File

`getline line < "filename"` reads a single line from a named file. Repeated calls read
successive lines. The file stays open between calls.

```bash
# Create a lookup file
echo -e "Alice,Engineering\nBob,Marketing\nCarol,Engineering" > /tmp/awk_departments.txt

printf "Alice 85\nBob 92\nCarol 71\n" | awk '
BEGIN {
  # Pre-load department lookup from file into array
  while ((getline line < "/tmp/awk_departments.txt") > 0) {
    # => getline returns 1 while lines available, 0 at EOF
    split(line, parts, ",")    # => Split "Alice,Engineering" into parts
    dept[parts[1]] = parts[2]  # => dept["Alice"] = "Engineering"
  }
  close("/tmp/awk_departments.txt")  # => Close file after reading
}
{
  print $1, $2, dept[$1]   # => Lookup department for each name
  # => dept["Alice"] = "Engineering"
  # => dept["Bob"]   = "Marketing"
  # => dept["Carol"] = "Engineering"
}
'
# => Output:
# => Alice 85 Engineering
# => Bob 92 Marketing
# => Carol 71 Engineering

rm /tmp/awk_departments.txt
```

**Key takeaway:** Loading a lookup file in BEGIN with `while ((getline line < file) > 0)` is the standard awk pattern for joining two data sources; always `close()` the file after reading to allow reopening later.

**Why it matters:** Joining two text files — enriching a data stream with a lookup table — is one of the most practical data wrangling tasks. The getline-from-file pattern in BEGIN achieves this without requiring both files as awk arguments, which enables using stdin as the main data stream.

---

### Example 46: getline from a Pipe

`cmd | getline var` runs a shell command and reads one line of its output into `var`. The pipe
stays open between calls, delivering successive lines.

```bash
echo "check" | awk '
{
  # Run date command and capture output
  "date +%Y-%m-%d" | getline today    # => Reads one line from date command
  # => today = "2026-04-01" (current date)

  "hostname" | getline host           # => Reads hostname
  # => host = "myserver" (or whatever hostname returns)

  print "Date:", today
  print "Host:", host
  print "Processing:", $0
}
'
# => Output (date and hostname vary by system):
# => Date: 2026-04-01
# => Host: myserver
# => Processing: check
```

**Key takeaway:** `"command" | getline var` captures one line of command output; call `close("command")` between records if you want the command to re-execute each time rather than continuing the same pipe.

**Why it matters:** Enriching records with system information — current timestamp, hostname, environment values — without pre-computing them in shell variables is a common scripting pattern. Embedding command execution inside awk keeps the data processing and metadata gathering in one place.

---

## Multiple File Processing

### Example 47: FILENAME Variable

`FILENAME` contains the name of the file currently being processed. It is empty when reading
from stdin and changes as awk moves between files.

```bash
# Create two temp files
echo -e "alice\nbob" > /tmp/awk_file1.txt
echo -e "carol\ndave" > /tmp/awk_file2.txt

awk '{ print FILENAME, NR, FNR, $0 }' /tmp/awk_file1.txt /tmp/awk_file2.txt
# => FILENAME: current input file name
# => NR: total records read so far (across all files)
# => FNR: record number within current file (resets to 1 per file)
# => Output:
# => /tmp/awk_file1.txt 1 1 alice
# => /tmp/awk_file1.txt 2 2 bob
# => /tmp/awk_file2.txt 3 1 carol
# => /tmp/awk_file2.txt 4 2 dave

rm /tmp/awk_file1.txt /tmp/awk_file2.txt
```

**Key takeaway:** `FILENAME` gives the current file path; `FNR` resets to 1 per file while `NR` continues counting across all files; `FNR == 1` detects the first record of each new file.

**Why it matters:** Processing multiple files — combining monthly log files, merging data exports — requires knowing which file each record came from. `FILENAME` and `FNR` enable per-file headers, validation, and routing without shell loops or file-by-file invocations.

---

### Example 48: Using FNR and NR Together for Two-File Join

The pattern `FNR == NR` is true only while processing the first file (NR equals FNR before
the second file starts). This is the classic awk two-file join idiom.

```bash
echo -e "Alice,Engineering\nBob,Marketing\nCarol,Engineering" > /tmp/awk_depts.txt
echo -e "Alice 85\nBob 92\nCarol 71" > /tmp/awk_scores.txt

awk -F'[,\t ]' '
FNR == NR {
  # => Only true while reading the first file (depts.txt)
  # => NR==FNR because both count from same start for first file
  dept[$1] = $2    # => dept["Alice"]="Engineering", etc.
  next             # => Skip to next record, do not fall through
}
{
  # => Executes for second file (scores.txt) only
  print $1, $2, dept[$1]   # => Join score with department
}
' /tmp/awk_depts.txt /tmp/awk_scores.txt
# => First file: load dept["Alice"]="Engineering", dept["Bob"]="Marketing", dept["Carol"]="Engineering"
# => Second file: print Alice 85 Engineering, Bob 92 Marketing, Carol 71 Engineering
# => Output:
# => Alice 85 Engineering
# => Bob 92 Marketing
# => Carol 71 Engineering

rm /tmp/awk_depts.txt /tmp/awk_scores.txt
```

**Key takeaway:** `FNR == NR` identifies processing of the first file in a two-file invocation; combining it with `next` to skip fall-through is the canonical awk file-join pattern.

**Why it matters:** Two-file joins without a database — enriching a transaction log with a user lookup, joining a price list with an order file — are common in data wrangling. The `FNR==NR` pattern achieves this cleanly in one awk invocation, which is faster than sorting both files and using `join`.

---

### Example 49: ARGC and ARGV

`ARGC` holds the count of command-line arguments (program name + files); `ARGV[0]` is "awk",
`ARGV[1]` is the first file, and so on.

```bash
awk 'BEGIN {
  print "ARGC:", ARGC          # => Number of arguments including "awk"
  for (i = 0; i < ARGC; i++) {
    print "ARGV[" i "]:", ARGV[i]
  }
}' /dev/null /dev/null
# => ARGC = 3 (awk + two /dev/null arguments)
# => ARGV[0] = "awk"
# => ARGV[1] = "/dev/null"
# => ARGV[2] = "/dev/null"
# => Output:
# => ARGC: 3
# => ARGV[0]: awk
# => ARGV[1]: /dev/null
# => ARGV[2]: /dev/null
```

**Key takeaway:** `ARGC` and `ARGV` let awk programs inspect their own command line; you can modify `ARGV` in BEGIN to add/remove files dynamically, or check argument count to give usage errors.

**Why it matters:** Scripts that accept variable numbers of input files, or that need to conditionally add a lookup file to `ARGV`, rely on `ARGC`/`ARGV`. This enables awk programs to behave differently based on how many files were provided without external shell conditionals.

---

## Record and Output Separators

### Example 50: RS — Custom Record Separator

`RS` controls how input is split into records. Setting `RS` to a non-newline value — or to
a regex in gawk — enables processing of non-line-oriented data.

```bash
printf "name=Alice;age=30;role=Engineer\nname=Bob;age=25;role=Manager\n" | awk '
BEGIN { RS="\n"; FS=";" }   # => Each line is a record, fields split on ";"
{
  # => Each record is one person's data: "name=Alice;age=30;role=Engineer"
  # => $1="name=Alice", $2="age=30", $3="role=Engineer"
  split($1, n, "="); name = n[2]    # => Extract value after "="
  split($2, a, "="); age  = a[2]
  split($3, r, "="); role = r[2]
  printf "Name=%-10s Age=%-5s Role=%s\n", name, age, role
}
'
# => Output:
# => Name=Alice      Age=30    Role=Engineer
# => Name=Bob        Age=25    Role=Manager
```

**Key takeaway:** RS defaults to newline; setting `RS=""` activates paragraph mode (blank-line-separated records); setting RS to a multi-character string or regex (gawk only) enables custom delimiters.

**Why it matters:** Not all data is line-oriented. Configuration stanzas, multi-line log entries, and fixed-format database exports use alternative record delimiters. Custom RS enables awk to process these formats without pre-processing to normalize line endings.

---

### Example 51: ORS — Output Record Separator

`ORS` is appended after each `print` statement. It defaults to newline. Changing it enables
joining records with custom separators or producing single-line output from multi-line input.

```bash
printf "alpha\nbeta\ngamma\ndelta\n" | awk '
BEGIN { ORS=" | " }   # => Join records with " | " instead of newline
{ print $0 }
END { printf "\n" }   # => Add final newline (ORS replaces it otherwise)
'
# => Each "print" appends ORS (" | ") instead of "\n"
# => "alpha" + " | " => "alpha | "
# => "beta"  + " | " => appended: "alpha | beta | "
# => "gamma" + " | " => appended: "alpha | beta | gamma | "
# => "delta" + " | " => appended: "alpha | beta | gamma | delta | "
# => END printf adds final "\n"
# => Output: alpha | beta | gamma | delta |
```

**Key takeaway:** ORS defaults to `"\n"`; setting ORS to `" "` or `","` joins records on a single line; setting it in BEGIN affects all `print` statements throughout the program.

**Why it matters:** Generating comma-separated lists, space-joined values, or custom-terminated output from line-oriented input is a frequent formatting task. Setting ORS avoids manually tracking whether to print a separator before or after each record — the separator is automatic.

---

### Example 52: Multiline Records with RS=""

Setting `RS=""` activates paragraph mode: records are separated by one or more blank lines.
Newlines within a record become field separators when `FS="\n"` is also set.

```bash
printf "Alice\nEngineer\nNew York\n\nBob\nManager\nLos Angeles\n\n" | awk '
BEGIN {
  RS=""    # => Paragraph mode: records separated by blank lines
  FS="\n"  # => Fields within each record are newline-separated
}
{
  # => Each record is a blank-line-separated block
  # => $1 = first line = name
  # => $2 = second line = role
  # => $3 = third line = city
  printf "Name=%-10s Role=%-12s City=%s\n", $1, $2, $3
}
'
# => Record 1: $1="Alice", $2="Engineer", $3="New York"
# => Record 2: $1="Bob",   $2="Manager",  $3="Los Angeles"
# => Output:
# => Name=Alice      Role=Engineer     City=New York
# => Name=Bob        Role=Manager      City=Los Angeles
```

**Key takeaway:** `RS=""` (paragraph mode) combined with `FS="\n"` is the standard pattern for processing multi-line records where each attribute occupies its own line within blank-line-delimited blocks.

**Why it matters:** Many real-world formats use paragraph-style records — vCard contacts, ldif directory exports, certain configuration files, and multi-line log entries. Paragraph mode handles them without preprocessing to collapse multi-line records into single lines.

---

## Regular Expression Operators

### Example 53: ~ and !~ Operators

The `~` operator tests whether a field matches a regex; `!~` tests non-match. Both work on
any field, unlike `/regex/` which always tests against `$0`.

```bash
printf "alice@company.com Engineer\nbob@gmail.com Manager\ncarol@company.com Director\n" | awk '
$1 ~ /company\.com/ { print $1, "internal" }
$1 !~ /company\.com/ { print $1, "external" }
# => $1 ~ /company\.com/: does $1 contain "company.com"?
# => \. escapes the dot (literal dot, not "any character" in regex)
'
# => "alice@company.com": matches ~ /company\.com/ => internal
# => "bob@gmail.com":     does NOT match => external
# => "carol@company.com": matches ~ /company\.com/ => internal
# => Output:
# => alice@company.com internal
# => bob@gmail.com external
# => carol@company.com internal
```

**Key takeaway:** `field ~ /regex/` tests a specific field; `/regex/` without a field tests `$0`; `!~` is the non-match operator; backslash-escape regex metacharacters like `.` and `*` when matching literals.

**Why it matters:** Testing specific fields against patterns — email domains in `$1`, log levels in `$3`, hostnames in `$5` — requires `~` because `/regex/` would match any field in the record. This precision prevents false positives when a pattern appears in a different column than expected.

---

### Example 54: OFMT and CONVFMT

`OFMT` controls the format used when printing numbers implicitly (not via printf). `CONVFMT`
controls how numbers convert to strings in concatenation and array indexing.

```bash
echo "3.14159265358979" | awk '
BEGIN {
  OFMT = "%.4f"       # => 4 decimal places for implicit number output
  CONVFMT = "%.2f"    # => 2 decimal places when converting number to string
}
{
  pi = $1 + 0         # => Force numeric conversion: pi = 3.14159265358979
  print pi            # => Uses OFMT: "3.1416" (4 decimal places, rounded)

  s = pi ""           # => Concatenate with empty string => string conversion
  # => Uses CONVFMT: s = "3.14"
  print "As string:", s
  print "Length:", length(s)  # => 4 ("3.14" has 4 chars)
}
'
# => Output:
# => 3.1416
# => As string: 3.14
# => Length: 4
```

**Key takeaway:** `OFMT` (default `"%.6g"`) formats numbers in `print`; `CONVFMT` (default `"%.6g"`) formats them during string conversion; both accept `printf`-style format strings.

**Why it matters:** Controlling numeric precision prevents runaway decimal places in financial or scientific reports. Setting OFMT once in BEGIN is cleaner than using printf for every number output, especially in programs that mix print and printf statements.

---

### Example 55: ENVIRON Array

`ENVIRON` is an associative array containing all environment variables, indexed by name. It is
available without any special setup.

```bash
HOME=/tmp DEBUG=1 awk 'BEGIN {
  print "HOME:", ENVIRON["HOME"]      # => "/tmp" (from environment)
  print "DEBUG:", ENVIRON["DEBUG"]    # => "1"
  print "PATH exists:", ("PATH" in ENVIRON)  # => 1 (true, PATH always set)
  print "MISSING:", ENVIRON["NOSUCHVAR"]     # => "" (empty string, not error)
}'
# => ENVIRON holds all shell environment variables
# => Keys that do not exist return "" (empty string)
# => Output:
# => HOME: /tmp
# => DEBUG: 1
# => PATH exists: 1
# => MISSING:
```

**Key takeaway:** `ENVIRON["VAR"]` accesses shell environment variables; missing keys return empty string without error; use `("VAR" in ENVIRON)` to check existence without auto-vivifying.

**Why it matters:** Configuration via environment variables — database connection strings, output paths, feature flags — is the twelve-factor app standard. `ENVIRON` lets awk scripts read these values directly without shell variable passing through `-v` flags, making awk pipelines easier to configure in containerized environments.

---

### Example 56: Ternary Operator

awk supports the C-style ternary operator `condition ? value_if_true : value_if_false`.
It is an expression, so it can appear anywhere a value is expected.

```bash
printf "Alice 85\nBob 58\nCarol 92\nDave 74\n" | awk '
{
  status = ($2 >= 70) ? "PASS" : "FAIL"
  # => If $2 >= 70: status = "PASS"; else status = "FAIL"
  # => Alice 85: 85 >= 70 => PASS
  # => Bob 58:   58 < 70  => FAIL
  # => Carol 92: 92 >= 70 => PASS
  # => Dave 74:  74 >= 70 => PASS

  marker = ($2 >= 90) ? " ***" : ""
  # => Add marker for scores 90+: Carol gets " ***"

  printf "%-10s %3d  %-4s%s\n", $1, $2, status, marker
}'
# => Output:
# => Alice       85  PASS
# => Bob         58  FAIL
# => Carol       92  PASS ***
# => Dave        74  PASS
```

**Key takeaway:** The ternary `cond ? a : b` is an expression returning a value, not a statement — it can be used inside `print`, `sprintf`, array indexing, and arithmetic; nested ternaries work but reduce readability.

**Why it matters:** Inline conditional values — status labels, default substitutions, conditional formatting — appear in nearly every awk report. The ternary operator avoids if/else blocks when the purpose is to choose between two values, keeping the logic compact and the intent clear.
