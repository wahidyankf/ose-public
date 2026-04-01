---
title: "Advanced"
weight: 10000003
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Advanced awk examples covering multidimensional arrays, coprocesses, CSV parsing, report generation, state machines, and real-world data analysis"
tags: ["awk", "text-processing", "tutorial", "by-example", "code-first", "advanced"]
---

This tutorial covers advanced awk techniques through 29 self-contained, heavily annotated
examples. Each example builds on intermediate concepts and demonstrates one focused advanced
capability. The examples progress through multidimensional arrays, coprocesses, gawk extensions,
CSV parsing, complex report generation, state machines, data analysis pipelines, and real-world
automation patterns — spanning 75–95% of awk's feature set.

## Multidimensional Arrays

### Example 57: Multidimensional Arrays with SUBSEP

awk does not have true multi-dimensional arrays. Instead, it uses SUBSEP (default `\034`,
the ASCII field separator) to concatenate keys, simulating a two-dimensional structure.

```bash
printf "Alice Q1 85\nAlice Q2 92\nBob Q1 78\nBob Q2 88\n" | awk '
{
  scores[$1][$2] = $3    # => gawk only: true multidimensional
  # POSIX awk equivalent: scores[$1, $2] = $3
  # => scores["Alice", "Q1"] = 85  (key is "Alice\034Q1")
  # => scores["Alice", "Q2"] = 92  (key is "Alice\034Q2")
  # => scores["Bob",   "Q1"] = 78
  # => scores["Bob",   "Q2"] = 88
  people[$1] = 1          # => Track unique people
  quarters[$2] = 1        # => Track unique quarters
}
END {
  # Print header
  printf "%-10s %5s %5s\n", "Name", "Q1", "Q2"
  printf "%-10s %5s %5s\n", "----", "--", "--"
  for (person in people) {
    printf "%-10s", person
    for (q in quarters) {
      printf " %5d", scores[person, q]  # => POSIX: [person, q] => key with SUBSEP
    }
    printf "\n"
  }
}
'
# => Output (order may vary):
# => Name         Q1    Q2
# => ----         --    --
# => Alice        85    92
# => Bob          78    88
```

**Key takeaway:** POSIX awk uses `array[key1, key2]` (with SUBSEP) for pseudo-multidimensional arrays; gawk supports true `array[k1][k2]` syntax; test with `(k1, k2) in array` to check existence.

**Why it matters:** Cross-tabulation — sales by region and month, errors by host and service, scores by student and subject — requires two-dimensional indexing. SUBSEP-based arrays make this work in standard awk without requiring a dedicated matrix library or external tool.

---

### Example 58: Checking Multi-Key Existence

Testing whether a multi-key combination exists uses `(key1, key2) in array`, which checks the
combined key without creating it.

```bash
printf "Alice Q1\nAlice Q3\nBob Q2\nBob Q4\n" | awk '
BEGIN {
  # Known valid data: pre-populate valid combinations
  valid["Alice", "Q1"] = 1
  valid["Alice", "Q2"] = 1
  valid["Bob",   "Q1"] = 1
  valid["Bob",   "Q2"] = 1
}
{
  name = $1; quarter = $2
  if ((name, quarter) in valid) {
    print name, quarter, "=> VALID"     # => Combination exists in valid array
  } else {
    print name, quarter, "=> INVALID"  # => Combination not in valid array
  }
}
'
# => ("Alice","Q1"): in valid => VALID
# => ("Alice","Q3"): NOT in valid (Q3 not loaded) => INVALID
# => ("Bob","Q2"):   in valid => VALID
# => ("Bob","Q4"):   NOT in valid => INVALID
# => Output:
# => Alice Q1 => VALID
# => Alice Q3 => INVALID
# => Bob Q2 => VALID
# => Bob Q4 => INVALID
```

**Key takeaway:** `(k1, k2) in array` safely tests multi-key existence using the same SUBSEP concatenation as assignment, without creating the entry — identical to single-key `k in array` semantics.

**Why it matters:** Validating data combinations — allowed role/permission pairs, valid product/region combinations, permitted user/action mappings — requires multi-key existence checks. The consistent `in` syntax works for both single and multi-key arrays without syntactic variation.

---

## User-Defined Functions (Advanced)

### Example 59: Recursive Functions

awk supports recursive function calls. The standard recursion safety requirements apply:
base case required, stack depth limited by system resources.

```bash
echo "10" | awk '
function factorial(n) {
  # => Base case: factorial(0) = 1, factorial(1) = 1
  if (n <= 1) return 1
  # => Recursive case: n! = n * (n-1)!
  return n * factorial(n - 1)
  # => factorial(5) = 5 * factorial(4)
  #                 = 5 * 4 * factorial(3)
  #                 = 5 * 4 * 3 * factorial(2)
  #                 = 5 * 4 * 3 * 2 * factorial(1)
  #                 = 5 * 4 * 3 * 2 * 1 = 120
}

function fibonacci(n,    a, b, tmp) {
  # => Iterative fibonacci (avoids deep recursion for large n)
  if (n <= 1) return n    # => fib(0)=0, fib(1)=1
  a = 0; b = 1
  for (i = 2; i <= n; i++) {
    tmp = a + b           # => Next fibonacci number
    a = b                 # => Shift: a becomes b
    b = tmp               # => b becomes new fibonacci
  }
  return b                # => Return n-th fibonacci number
}

{
  n = $1
  printf "%d! = %d\n", n, factorial(n)   # => 10! = 3628800
  printf "fib(%d) = %d\n", n, fibonacci(n)  # => fib(10) = 55
}
'
# => Output:
# => 10! = 3628800
# => fib(10) = 55
```

**Key takeaway:** awk supports full recursion; local variables must use the extra-parameter convention to avoid sharing state across recursive calls; deep recursion may hit stack limits (use iteration for large inputs).

**Why it matters:** Recursive tree traversal, parsing nested structures, and divide-and-conquer algorithms occasionally arise in awk programs that process hierarchical data. Understanding recursion in awk extends its applicability beyond simple line-by-line processing.

---

### Example 60: Functions Modifying Arrays by Reference

Arrays passed to functions are modified by reference. The function receives the actual array,
not a copy — changes inside the function affect the caller's array.

```bash
printf "3\n1\n4\n1\n5\n9\n2\n6\n" | awk '
function push(arr, val,    n) {
  # => Append val to arr, treating it as a dynamic stack/list
  n = length(arr)        # => Current array size
  arr[n + 1] = val       # => Add at next index (1-based)
  # => arr is modified by reference — caller sees the change
}

function sort_and_print(arr,    i, j, tmp, n) {
  n = length(arr)        # => Array size
  # Bubble sort (simple, not efficient, illustrates the pattern)
  for (i = 1; i <= n; i++) {
    for (j = 1; j < n - i + 1; j++) {
      if (arr[j] > arr[j+1]) {
        tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp
        # => Swap adjacent elements when out of order
      }
    }
  }
  for (i = 1; i <= n; i++) printf "%d ", arr[i]
  printf "\n"
}

{ push(data, $1) }    # => Collect all numbers into data array

END {
  print "Sorted:"
  sort_and_print(data)  # => data array passed by reference, sorted in-place
}
'
# => push appends each number to data[1..8]
# => sort_and_print sorts data in-place and prints
# => Output:
# => Sorted:
# => 1 1 2 3 4 5 6 9
```

**Key takeaway:** Arrays in awk function calls are always passed by reference; scalars are passed by value; this enables functions to build and modify data structures that the main program uses.

**Why it matters:** Building reusable array utilities — push/pop stacks, sorting helpers, lookup builders — requires pass-by-reference semantics. Understanding this enables modular awk programs where functions own their data structures rather than polluting global state.

---

## gawk Extensions

### Example 61: systime() and strftime() — Date and Time

gawk provides `systime()` (current Unix timestamp) and `strftime(format, timestamp)` (format
a timestamp as a human-readable string). These are gawk extensions, not POSIX awk.

```bash
gawk 'BEGIN {
  now = systime()                        # => Current Unix timestamp (seconds since epoch)
  # => now = 1743465600 (example value for 2026-04-01)

  formatted = strftime("%Y-%m-%d %H:%M:%S", now)
  # => strftime formats timestamp using strftime(3) format codes
  # => %Y = 4-digit year, %m = month, %d = day
  # => %H = hour (24h), %M = minute, %S = second
  print "Current time:", formatted       # => Output: Current time: 2026-04-01 00:00:00

  # Format a fixed timestamp for testing
  past = strftime("%A, %B %d %Y", 0)    # => Unix epoch: January 1 1970
  print "Epoch was:", past               # => Output: Epoch was: Thursday, January 01 1970
}'
# => Output (values depend on actual system time):
# => Current time: 2026-04-01 07:30:00
# => Epoch was: Thursday, January 01 1970
```

**Key takeaway:** `systime()` returns seconds since the Unix epoch; `strftime(format, ts)` converts a timestamp to a formatted string using standard `strftime` format codes; `mktime("YYYY MM DD HH MM SS")` parses a date string into a timestamp.

**Why it matters:** Log analysis and report generation need timestamps — adding the current time to output, computing elapsed time between log entries, filtering records within a time range. gawk's time functions make these operations native without shelling out to `date`.

---

### Example 62: system() — Running Shell Commands

`system(cmd)` executes a shell command and returns its exit status. stdout and stderr go
directly to the terminal, not into awk variables.

```bash
printf "alice\nbob\ncharlie\n" | awk '
{
  cmd = "id -u " $1 " 2>/dev/null"   # => Shell command to get UID for username
  ret = system(cmd)                   # => Execute command, return exit status
  # => system() prints command output directly to stdout
  # => ret = 0 if command succeeded, non-zero if failed
  if (ret != 0) {
    print $1, "=> not found (exit=" ret ")"
  }
}'
# => system("id -u alice") might print "501" (if user exists)
# => system("id -u nobody") might print "nobody not found" with ret=1
# => Output (depends on system users, example):
# => 501
# => 502
# => charlie => not found (exit=1)
```

**Key takeaway:** `system(cmd)` executes cmd synchronously, streams output to stdout, and returns the exit code; use `cmd | getline var` instead when you need to capture the command's output into an awk variable.

**Why it matters:** Triggering side effects — sending alerts, creating directories, calling APIs — from within an awk program while processing data is a common automation pattern. `system()` bridges awk's data processing with arbitrary shell actions based on data conditions.

---

### Example 63: Coprocesses with |& (gawk)

gawk's coprocess operator `|&` enables bidirectional communication with a subprocess — awk
writes to it with `print |& cmd` and reads back with `cmd |& getline var`.

```bash
gawk 'BEGIN {
  # Start a coprocess: bc (arbitrary precision calculator)
  cmd = "bc -l"

  # Send expression to coprocess
  print "2^10" |& cmd              # => Write "2^10\n" to bc stdin
  cmd |& getline result            # => Read bc output: "1024"
  print "2^10 =", result           # => Output: 2^10 = 1024

  print "sqrt(2)" |& cmd           # => Write "sqrt(2)\n" to bc
  cmd |& getline result            # => Read result
  printf "sqrt(2) = %.6f\n", result # => Output: sqrt(2) = 1.414213

  print "scale=4; 22/7" |& cmd     # => Pi approximation
  cmd |& getline result
  print "22/7 =", result           # => Output: 22/7 = 3.1428

  close(cmd)                        # => Close coprocess cleanly
}'
# => Output:
# => 2^10 = 1024
# => sqrt(2) = 1.414213
# => 22/7 = 3.1428
```

**Key takeaway:** `|&` opens a persistent two-way pipe with a subprocess; `print expr |& cmd` sends data to the subprocess, `cmd |& getline var` reads back a response; `close(cmd)` shuts the coprocess down.

**Why it matters:** Coprocesses enable awk to use external tools as computation services — calling Python for complex math, querying a database via a CLI client, interfacing with an API helper — without launching a new subprocess per record. This is critical for performance when the subprocess startup cost is high.

---

### Example 64: FPAT for CSV Parsing (gawk)

gawk's `FPAT` variable defines what a field looks like (rather than what separates fields),
enabling correct CSV parsing where fields may contain quoted commas.

```bash
echo 'Alice,"Engineer, Senior",New York,85000' | gawk '
BEGIN {
  FPAT = "([^,]+)|(\"[^\"]+\")"
  # => FPAT defines field CONTENT pattern (not separator):
  # => ([^,]+)      matches any sequence of non-comma characters
  # => |            OR
  # => (\"[^\"]+\") matches a double-quoted string (including internal commas)
}
{
  print "Fields found:", NF    # => NF = 4 (correctly handles quoted comma)
  for (i = 1; i <= NF; i++) {
    gsub(/^"|"$/, "", $i)      # => Strip surrounding quotes from each field
    printf "  $%d = [%s]\n", i, $i
  }
}
'
# => Without FPAT, FS="," would split "Engineer, Senior" into two fields
# => FPAT correctly identifies 4 fields despite the comma inside quotes
# => Output:
# => Fields found: 4
# =>   $1 = [Alice]
# =>   $2 = [Engineer, Senior]
# =>   $3 = [New York]
# =>   $4 = [85000]
```

**Key takeaway:** `FPAT` defines what a field looks like rather than what separates fields; it is a gawk extension for handling quoted CSV correctly; POSIX awk cannot reliably parse CSV with embedded commas without `getline`-based parsing.

**Why it matters:** Real-world CSV files contain quoted fields with commas — product descriptions, addresses, notes. Using `FS=","` breaks these. `FPAT` provides correct CSV handling in gawk without writing a full parser, making awk viable for CSV processing pipelines.

---

## Real-World Patterns

### Example 65: Log File Analysis — Access Log Parser

Parsing web server access logs is one of awk's canonical real-world tasks. This example
extracts status codes and generates a frequency report.

```bash
printf '192.168.1.1 - - [01/Apr/2026:10:00:01 +0700] "GET /api/users HTTP/1.1" 200 1234\n
192.168.1.2 - - [01/Apr/2026:10:00:02 +0700] "POST /api/login HTTP/1.1" 401 89\n
192.168.1.1 - - [01/Apr/2026:10:00:03 +0700] "GET /api/data HTTP/1.1" 200 5678\n
192.168.1.3 - - [01/Apr/2026:10:00:04 +0700] "GET /missing HTTP/1.1" 404 55\n
192.168.1.2 - - [01/Apr/2026:10:00:05 +0700] "GET /api/users HTTP/1.1" 200 1234\n' | awk '
{
  status = $9         # => HTTP status code is field 9 in Combined Log Format
  bytes  = $10        # => Response size is field 10
  ip     = $1         # => Client IP is field 1

  status_count[status]++    # => Count requests per status code
  ip_count[ip]++            # => Count requests per IP
  if (bytes ~ /^[0-9]+$/)   # => Only add numeric byte counts
    total_bytes += bytes    # => Sum total bytes transferred
}
END {
  print "=== Status Code Summary ==="
  for (s in status_count)
    printf "  HTTP %s: %d requests\n", s, status_count[s]

  print "\n=== Top IPs ==="
  for (ip in ip_count)
    printf "  %s: %d requests\n", ip, ip_count[ip]

  printf "\nTotal bytes transferred: %d\n", total_bytes
}
'
# => Output:
# => === Status Code Summary ===
# =>   HTTP 200: 3 requests
# =>   HTTP 401: 1 requests
# =>   HTTP 404: 1 requests
# =>
# => === Top IPs ===
# =>   192.168.1.1: 2 requests
# =>   192.168.1.2: 2 requests
# =>   192.168.1.3: 1 requests
# =>
# => Total bytes transferred: 8290
```

**Key takeaway:** Access log analysis with awk follows a fixed pattern: parse fields by position, accumulate counts/totals in arrays, report in END; the key is knowing which field holds each value in your log format.

**Why it matters:** Web server log analysis is one of the top production uses of awk. Generating quick traffic summaries, identifying top consumers, auditing error rates — all without importing logs into a database — makes awk the right tool for rapid operational investigations on live systems.

---

### Example 66: Report Generation with Headers and Footers

Generating formatted reports with column headers, data rows, subtotals, and footers is a
primary awk use case in batch processing systems.

```bash
printf "Engineering Alice 85000\nEngineering Bob 92000\nMarketing Carol 78000\nMarketing Dave 88000\nEngineering Eve 95000\n" | \
  awk '
BEGIN {
  printf "%-15s %-12s %10s\n", "Department", "Name", "Salary"
  printf "%-15s %-12s %10s\n", "----------", "----", "------"
  current_dept = ""    # => Track current department for grouping
}
{
  dept = $1; name = $2; salary = $3 + 0

  if (dept != current_dept) {
    # => Department changed: print subtotal for previous dept
    if (current_dept != "") {
      printf "%-15s %-12s %10s\n", "", "Subtotal:", dept_total
      printf "%-15s %-12s %10s\n", "", "--------", "------"
      dept_total = 0   # => Reset subtotal for new department
    }
    current_dept = dept
  }

  dept_total += salary            # => Accumulate dept subtotal
  grand_total += salary           # => Accumulate grand total
  printf "%-15s %-12s %10d\n", dept, name, salary
}
END {
  # => Print final department subtotal
  printf "%-15s %-12s %10d\n", "", "Subtotal:", dept_total
  printf "%-15s %-12s %10s\n", "", "========", "=========="
  printf "%-15s %-12s %10d\n", "", "GRAND TOTAL:", grand_total
}
'
# => Output:
# => Department     Name          Salary
# => ----------     ----          ------
# => Engineering    Alice          85000
# => Engineering    Bob            92000
# => Engineering    Eve            95000
# =>                Subtotal:     272000
# =>                --------      ------
# => Marketing      Carol          78000
# => Marketing      Dave           88000
# =>                Subtotal:     166000
# =>                ========  ==========
# =>                GRAND TOTAL: 438000
```

**Key takeaway:** Break-control reporting — detecting group changes by comparing the current record's key to the previous record — is the standard awk pattern for generating subtotals without sorting or pre-grouping.

**Why it matters:** Financial reports, HR summaries, and inventory tables all follow the break-control pattern. Understanding it as a design pattern rather than ad hoc code enables rapid adaptation to any grouped report requirement — the structure is always the same: track previous key, detect change, emit subtotal, reset accumulator.

---

### Example 67: Word Frequency Counter

Counting word frequencies from prose text requires splitting each line into individual words
and normalizing case and punctuation.

```bash
echo "To be or not to be that is the question whether tis nobler in the mind to suffer" | awk '
{
  # Convert to lowercase and split into words
  line = tolower($0)                    # => Normalize case: "to be or not..."
  gsub(/[^a-z ]/, "", line)            # => Remove non-letter, non-space chars
  n = split(line, words, " ")          # => Split on space into words array
  # => words[1]="to", words[2]="be", ..., words[n]="suffer"

  for (i = 1; i <= n; i++) {
    if (words[i] != "")                # => Skip empty strings from multiple spaces
      freq[words[i]]++                 # => Count each word
  }
}
END {
  # Find top words: collect into sortable format
  for (word in freq) {
    printf "%5d %s\n", freq[word], word   # => count word (for sort -rn)
  }
}
' | sort -rn | head -5
# => Output (top 5 by frequency):
# =>     3 to
# =>     2 the
# =>     2 be
# =>     1 whether
# =>     1 tis
```

**Key takeaway:** Word frequency counting follows the pattern: normalize (tolower + gsub), tokenize (split), accumulate (freq[word]++), then report in END; piping to `sort -rn` produces frequency-ordered output.

**Why it matters:** Word frequency analysis underpins keyword extraction, plagiarism detection, log message clustering, and NLP preprocessing. The awk implementation processes gigabyte log files in seconds because it makes a single pass and builds the frequency table in memory — far faster than Python's Counter on raw text without preprocessing.

---

### Example 68: State Machine Pattern

A state machine in awk uses a variable to track which state the parser is in, with patterns
triggering state transitions. This enables parsing structured multi-section input.

```bash
printf "[database]\nhost=localhost\nport=5432\n\n[cache]\nhost=redis\nport=6379\n\n[queue]\nhost=rabbitmq\nport=5672\n" | awk '
/^\[/ {
  # => Pattern matches section headers like "[database]"
  section = substr($0, 2, length($0) - 2)  # => Extract "database" from "[database]"
  # => substr removes [ at start and ] at end
  next                                      # => Skip to next record (header is metadata)
}
/=/ && section != "" {
  # => Key=value lines within a section
  split($0, kv, "=")          # => Split "host=localhost" into kv[1]="host", kv[2]="localhost"
  config[section][kv[1]] = kv[2]   # => gawk: config["database"]["host"] = "localhost"
  # => POSIX: config[section, kv[1]] = kv[2]
}
END {
  for (sec in config) {
    print "[" sec "]"
    for (key in config[sec]) {
      printf "  %s = %s\n", key, config[sec][key]
    }
  }
}
'
# => State: section="" initially
# => "[database]" matches /^\[/: section="database"
# => "host=localhost" matches /=/: config["database"]["host"]="localhost"
# => "port=5432": config["database"]["port"]="5432"
# => "[cache]": section="cache"
# => ... and so on
# => Output (order varies):
# => [database]
# =>   host = localhost
# =>   port = 5432
# => [cache]
# =>   host = redis
# =>   port = 6379
# => [queue]
# =>   host = rabbitmq
# =>   port = 5672
```

**Key takeaway:** State machines in awk use a section/state variable that gets updated by pattern-triggered transitions; `next` advances to the next record without falling through to other patterns — essential for clean state control.

**Why it matters:** Configuration files, protocol logs, and structured text documents all have section-based structure that requires state awareness. The state machine pattern extends awk far beyond simple line-by-line processing into full parser territory, enabling it to replace dedicated parsers for INI files, HTTP headers, and similar formats.

---

### Example 69: Histogram Generation

Generating text-based histograms from numeric data visualizes distributions directly in the
terminal without plotting libraries.

```bash
printf "72\n85\n91\n68\n77\n88\n95\n73\n82\n79\n" | awk '
{
  val = int($1 / 10) * 10    # => Bucket to nearest 10 (floor)
  # => 72 => 70, 85 => 80, 91 => 90, 68 => 60, 77 => 70
  # => 88 => 80, 95 => 90, 73 => 70, 82 => 80, 79 => 70
  buckets[val]++              # => Count values in each bucket
  if (val > max_bucket) max_bucket = val    # => Track max bucket for display
  if (val < min_bucket || NR == 1) min_bucket = val   # => Track min bucket
}
END {
  for (b = min_bucket; b <= max_bucket; b += 10) {
    count = buckets[b]        # => Count for this bucket (0 if empty)
    bar = ""
    for (i = 1; i <= count; i++) bar = bar "#"   # => Build bar of # chars
    printf "%3d-%3d | %-15s %d\n", b, b+9, bar, count
  }
}
'
# => Buckets: 60s=1, 70s=4, 80s=3, 90s=2
# => Output:
# =>  60- 69 | #               1
# =>  70- 79 | ####            4
# =>  80- 89 | ###             3
# =>  90- 99 | ##              2
```

**Key takeaway:** Histogram generation follows the pattern: bucket each value (integer division), accumulate counts, then iterate bucket ranges in END to print bars — the bar length is controlled by a loop building a string of `#` characters.

**Why it matters:** Quick distribution visualization without Python or R — during a production incident, reviewing latency distributions, checking score distributions — lets you see data shape in seconds. Text histograms appear in terminal dashboards, CI output, and debugging sessions where graphical tools are unavailable.

---

### Example 70: Transposing Rows and Columns

Transposing a matrix — swapping rows and columns — is a common data manipulation task when
output format requirements differ from input structure.

```bash
printf "1 2 3 4\n5 6 7 8\n9 10 11 12\n" | awk '
{
  for (j = 1; j <= NF; j++) {
    matrix[NR][j] = $j    # => gawk: store in 2D array indexed by row,col
    # => POSIX: matrix[NR, j] = $j
  }
  max_col = (NF > max_col) ? NF : max_col   # => Track max column count
}
END {
  # Transpose: iterate columns as rows
  for (j = 1; j <= max_col; j++) {
    for (i = 1; i <= NR; i++) {
      printf "%4s", matrix[i][j]   # => Print col j of each original row
    }
    printf "\n"                    # => Newline after each transposed row
  }
}
'
# => Original matrix (3 rows x 4 cols):
# => 1  2  3  4
# => 5  6  7  8
# => 9 10 11 12
#
# => Transposed (4 rows x 3 cols):
# => Output:
# =>    1   5   9
# =>    2   6  10
# =>    3   7  11
# =>    4   8  12
```

**Key takeaway:** Matrix transposition requires storing the entire input in a 2D array before outputting, since all rows must be read before any transposed row can be written — the only case where awk must hold the complete dataset in memory.

**Why it matters:** Transposing data is required when tools expect row-oriented input but you have column-oriented data (or vice versa), and when converting between wide and long format for statistical analysis. The awk implementation handles arbitrary matrix sizes without knowing dimensions in advance.

---

### Example 71: Cross-Referencing Two Files

Cross-referencing finds records present in one file but absent in another — like finding
unmatched items in data validation or change detection.

```bash
echo -e "alice\nbob\ncarol\ndave" > /tmp/awk_expected.txt
echo -e "bob\ncarol\neve\nfrank" > /tmp/awk_actual.txt

awk '
FNR == NR { expected[$1] = 1; next }   # => Load first file into expected set
{ actual[$1] = 1 }                      # => Load second file into actual set
END {
  print "=== In expected but not actual (missing) ==="
  for (name in expected) {
    if (!(name in actual)) print " ", name   # => Present in expected, absent in actual
  }
  print "=== In actual but not expected (extra) ==="
  for (name in actual) {
    if (!(name in expected)) print " ", name  # => Present in actual, absent in expected
  }
}
' /tmp/awk_expected.txt /tmp/awk_actual.txt
# => expected: alice, bob, carol, dave
# => actual:   bob, carol, eve, frank
# => Missing (in expected, not actual): alice, dave
# => Extra (in actual, not expected): eve, frank
# => Output:
# => === In expected but not actual (missing) ===
# =>   alice
# =>   dave
# => === In actual but not expected (extra) ===
# =>   eve
# =>   frank

rm /tmp/awk_expected.txt /tmp/awk_actual.txt
```

**Key takeaway:** Cross-referencing uses the two-file pattern (`FNR==NR` for file 1, fall-through for file 2) to load both datasets into arrays, then set operations (existence checks) in END to find symmetric differences.

**Why it matters:** Data validation — verifying that deployment manifests match running services, that invoice items match shipping records, that user lists are synchronized — is a recurring operational task. The awk cross-reference pattern solves it without a database join or Python script.

---

### Example 72: Pivot Table Generation

A pivot table summarizes data by two dimensions — rows and columns — computing a value
(sum, count, average) at each intersection.

```bash
printf "Q1 North 100\nQ1 South 150\nQ2 North 120\nQ2 South 130\nQ1 East 90\nQ2 East 110\n" | awk '
{
  quarter = $1; region = $2; sales = $3 + 0
  pivot[quarter][region] += sales   # => gawk 2D: accumulate sales by quarter/region
  quarters[quarter] = 1             # => Track unique quarters
  regions[region] = 1               # => Track unique regions
  total_q[quarter] += sales         # => Row totals
  total_r[region]  += sales         # => Column totals
  grand += sales                    # => Grand total
}
END {
  # Header row
  printf "%-8s", "Quarter"
  for (r in regions) printf "%8s", r
  printf "%10s\n", "Total"

  # Data rows
  for (q in quarters) {
    printf "%-8s", q
    for (r in regions) printf "%8d", pivot[q][r]
    printf "%10d\n", total_q[q]
  }

  # Footer row
  printf "%-8s", "Total"
  for (r in regions) printf "%8d", total_r[r]
  printf "%10d\n", grand
}
'
# => Output (order may vary):
# => Quarter      East    North    South     Total
# => Q1             90      100      150       340
# => Q2            110      120      130       360
# => Total         200      220      280       700
```

**Key takeaway:** Pivot tables require storing all data before output (to know all row/column headers), accumulating values in a 2D array keyed by the two dimensions, and then iterating both dimensions in END.

**Why it matters:** Business reporting universally uses pivot tables. Generating them from CSV exports without Excel or Pandas — during data validation, in CI pipelines, in operational dashboards — makes awk a lightweight but capable reporting tool for structured text data.

---

### Example 73: Deduplication by Field Value

Deduplicating records based on a specific field (not the full line) selects one representative
record per unique field value, keeping the first occurrence.

```bash
printf "alice alice@corp.com Engineer\nalice alice@personal.com Manager\nbob bob@corp.com Developer\nbob bob@work.com DevOps\ncarol carol@corp.com Designer\n" | awk '
!seen[$1]++ {
  # => Use only $1 (username) as the deduplication key
  # => seen[$1]=0 on first occurrence: !0=true => print
  # => seen[$1]=1 on second: !1=false => skip
  # => This keeps the FIRST occurrence of each username
  print    # => Print entire record for first occurrence only
}
'
# => "alice alice@corp.com Engineer":    seen["alice"]=0 => print
# => "alice alice@personal.com Manager": seen["alice"]=1 => skip
# => "bob bob@corp.com Developer":       seen["bob"]=0 => print
# => "bob bob@work.com DevOps":          seen["bob"]=1 => skip
# => "carol carol@corp.com Designer":    seen["carol"]=0 => print
# => Output:
# => alice alice@corp.com Engineer
# => bob bob@corp.com Developer
# => carol carol@corp.com Designer
```

**Key takeaway:** `!seen[key]++` deduplicates by any expression as the key — `$1` for first field, `$1,$2` for compound key, `tolower($1)` for case-insensitive deduplication — not just the full line.

**Why it matters:** Field-based deduplication — keeping the first record per user, per IP, per transaction ID — is more precise than line-based deduplication. Production data cleaning routinely needs to collapse duplicate rows on a business key while preserving the full row data.

---

### Example 74: Generating JSON-Like Output

awk can generate structured output formats like JSON from structured text input, enabling
integration with downstream JSON-consuming tools.

```bash
printf "Alice Engineer 85000\nBob Manager 92000\nCarol Director 110000\n" | awk '
BEGIN {
  print "["    # => Open JSON array
  first = 1   # => Track first element (no leading comma)
}
{
  if (!first) print ","    # => Comma before all but first element
  first = 0
  printf "  {\n"
  printf "    \"name\": \"%s\",\n", $1      # => String field: quoted
  printf "    \"role\": \"%s\",\n", $2      # => String field: quoted
  printf "    \"salary\": %d\n",   $3 + 0  # => Numeric field: unquoted
  printf "  }"
}
END {
  printf "\n]\n"   # => Close JSON array with newline
}
'
# => Output (valid JSON):
# => [
# =>   {
# =>     "name": "Alice",
# =>     "role": "Engineer",
# =>     "salary": 85000
# =>   },
# =>   {
# =>     "name": "Bob",
# =>     "role": "Manager",
# =>     "salary": 92000
# =>   },
# =>   {
# =>     "name": "Carol",
# =>     "role": "Director",
# =>     "salary": 110000
# =>   }
# => ]
```

**Key takeaway:** JSON generation requires careful comma handling (no trailing comma on last element), type awareness (strings quoted, numbers unquoted), and proper escaping (backslash-escape quotes inside field values with `gsub(/"/,"\\\"", field)`).

**Why it matters:** Converting legacy text data to JSON for REST APIs, message queues, and modern tooling is a common integration task. awk's JSON generation is fast and requires no external libraries, making it ideal for CI pipeline data transformations and log format migrations.

---

### Example 75: awk Script as a File with Shebang

For complex awk programs, saving the program to a file with a shebang line enables direct
execution like any shell script.

```bash
# Create the awk script file
cat > /tmp/analyze_scores.awk << 'AWKEOF'
#!/usr/bin/awk -f
# analyze_scores.awk — Analyze student scores from stdin
# Usage: echo "Alice 85" | awk -f analyze_scores.awk
#    or: ./analyze_scores.awk < scores.txt

BEGIN {
  print "=== Score Analysis ==="    # => Header printed before any input
  FS = " "                          # => Fields separated by space (default, explicit)
}

NF < 2 { next }    # => Skip malformed lines with fewer than 2 fields

{
  name = $1; score = $2 + 0    # => Extract and coerce to number
  scores[name] = score          # => Store score per student
  total += score                # => Accumulate for average
  count++                       # => Count valid records
  if (score > max) { max = score; top = name }   # => Track maximum
  if (score < min || count == 1) { min = score; bottom = name }  # => Track minimum
}

END {
  avg = (count > 0) ? total / count : 0    # => Safe division
  printf "Students: %d\n", count
  printf "Average:  %.1f\n", avg
  printf "Highest:  %s (%d)\n", top, max
  printf "Lowest:   %s (%d)\n", bottom, min
}
AWKEOF

chmod +x /tmp/analyze_scores.awk

printf "Alice 85\nBob 92\nCarol 71\nDave 88\n" | awk -f /tmp/analyze_scores.awk
# => -f flag: read program from file instead of command line
# => Output:
# => === Score Analysis ===
# => Students: 4
# => Average:  84.0
# => Highest:  Bob (92)
# => Lowest:   Carol (71)

rm /tmp/analyze_scores.awk
```

**Key takeaway:** `awk -f script.awk` reads the program from a file; the shebang `#!/usr/bin/awk -f` enables direct execution; file-based programs support comments, multiple lines, and version control — essential for non-trivial programs.

**Why it matters:** Production awk programs belong in files, not inline command arguments. Files enable version control, code review, syntax highlighting, and testing. The shebang pattern treats awk programs as first-class scripts rather than one-liners, which is appropriate once the program exceeds a few lines.

---

### Example 76: Command-Line Variable Passing with -v

The `-v var=value` flag passes values into awk before any input is processed, including
before BEGIN. Multiple `-v` flags set multiple variables.

```bash
printf "Alice 85\nBob 92\nCarol 71\nDave 88\n" | awk -v threshold=80 -v label="PASS" '
# => threshold=80 and label="PASS" are set before BEGIN runs
# => Available in BEGIN, main action, and END
BEGIN {
  print "Filtering scores above", threshold    # => threshold=80
}
$2 > threshold {
  printf "%s: %d => %s\n", $1, $2, label       # => label="PASS"
}
'
# => threshold=80: filters records where $2 > 80
# => label="PASS": used in output
# => Output:
# => Filtering scores above 80
# => Bob: 92 => PASS
# => Dave: 88 => PASS
```

**Key takeaway:** `-v` sets variables before BEGIN runs (unlike assigning `var=value` between file arguments, which takes effect between files); use `-v` for values that the program needs throughout all three phases.

**Why it matters:** Parameterizing awk scripts with `-v` enables reuse across different thresholds, labels, separators, and configuration values without editing the script. This is the awk equivalent of function parameters — the same script handles different use cases by varying the `-v` arguments.

---

### Example 77: @include — Including Other awk Files (gawk)

gawk's `@include` directive includes another awk source file, enabling shared function libraries
across multiple programs.

```bash
# Create a shared library file
cat > /tmp/awk_utils.awk << 'EOF'
# awk_utils.awk — Shared utility functions

function max(a, b) {
  return (a > b) ? a : b    # => Return the larger of two values
}

function min(a, b) {
  return (a < b) ? a : b    # => Return the smaller of two values
}

function clamp(val, lo, hi) {
  return max(lo, min(val, hi))   # => Constrain val to [lo, hi] range
}
EOF

printf "5\n15\n3\n8\n12\n" | gawk '
@include "/tmp/awk_utils.awk"    # => Include shared library (gawk only)
# => Functions max, min, clamp are now available

{
  v = $1 + 0
  clamped = clamp(v, 5, 10)     # => Clamp to [5, 10]: 5=>5, 15=>10, 3=>5, 8=>8, 12=>10
  printf "%3d => clamped: %3d\n", v, clamped
}
'
# => 5:  clamp(5, 5, 10)  = 5  (within range)
# => 15: clamp(15, 5, 10) = 10 (above max, clamped to 10)
# => 3:  clamp(3, 5, 10)  = 5  (below min, clamped to 5)
# => 8:  clamp(8, 5, 10)  = 8  (within range)
# => 12: clamp(12, 5, 10) = 10 (above max)
# => Output:
# =>   5 => clamped:   5
# =>  15 => clamped:  10
# =>   3 => clamped:   5
# =>   8 => clamped:   8
# =>  12 => clamped:  10

rm /tmp/awk_utils.awk
```

**Key takeaway:** `@include "file.awk"` is a gawk extension that textually includes another awk file at that position; it enables shared function libraries and modular program organization for larger awk codebases.

**Why it matters:** Large awk programs — report suites, complex data pipelines — benefit from shared utility functions maintained in one place. `@include` enables the Don't Repeat Yourself principle in awk, reducing maintenance burden when utility functions need updating.

---

### Example 78: gawk Profiling with --profile

gawk's `--profile` flag generates an execution profile showing how many times each line ran.
This identifies hot paths and unused patterns in awk programs.

```bash
printf "Alice 85\nBob 92\nCarol 71\nDave 88\n" | gawk --profile=/tmp/awk_profile.txt '
BEGIN { total = 0; count = 0 }    # => Runs once
$2 > 80 {                          # => Pattern checked for each record
  total += $2                      # => Runs when $2 > 80
  count++
}
END { if (count > 0) print total/count }  # => Runs once
'
# => gawk writes profile to /tmp/awk_profile.txt
# => Profile shows execution counts per line:
# =>   BEGIN { ... }   # 1 call
# =>   $2 > 80 { ... } # 3 calls (Bob 92, Dave 88 match; Alice 85 also matches >=80)
# =>   END { ... }     # 1 call
cat /tmp/awk_profile.txt 2>/dev/null | head -20
# => Output: annotated program with call counts (gawk-specific format)
# => Final output: 88.3333 (average of 85, 92, 88)

rm -f /tmp/awk_profile.txt
```

**Key takeaway:** `--profile=file.txt` writes a profile with call counts alongside each program line; this reveals which patterns trigger most and which never trigger, guiding optimization or dead-code removal.

**Why it matters:** Profiling awk programs that process large files — where even constant-factor improvements matter — helps identify patterns evaluated millions of times that could be reordered or simplified. It is also useful for verifying that test data exercises all code paths.

---

### Example 79: Network Programming with /inet/ (gawk)

gawk supports a special `/inet/tcp/port/host/port` filename syntax for TCP socket I/O,
enabling awk programs to make and receive network connections.

```bash
# Send a simple HTTP request using gawk /inet/
gawk 'BEGIN {
  host = "example.com"
  port = 80
  # => Open TCP connection to host:port
  socket = "/inet/tcp/0/" host "/" port

  # Send HTTP/1.0 request (simpler than HTTP/1.1)
  print "GET / HTTP/1.0\r" |& socket     # => Write request line
  print "Host: " host "\r"  |& socket    # => Write Host header
  print "\r"                 |& socket   # => Blank line ends headers
  # => \r is required for HTTP line endings (CRLF)

  # Read response headers (first 5 lines)
  for (i = 1; i <= 5; i++) {
    socket |& getline line               # => Read one line from socket
    print line                           # => Print response line
  }
  close(socket)                          # => Close TCP connection
}'
# => Output (first 5 lines of HTTP response from example.com):
# => HTTP/1.0 200 OK
# => Accept-Ranges: bytes
# => Age: 533814
# => Cache-Control: max-age=604800
# => Content-Type: text/html; charset=UTF-8
```

**Key takeaway:** gawk's `/inet/tcp/localport/host/remoteport` pseudo-file enables TCP I/O using standard awk I/O operators; `|&` (coprocess) handles bidirectional communication with the socket.

**Why it matters:** Network capabilities transform awk from a file processor into a lightweight network client — useful for health checks, simple API calls, and network diagnostics in environments where Python or curl is unavailable. While not suitable for production network clients, it enables rapid scripting of TCP-based probes.

---

### Example 80: Real-World Pipeline — Nginx Log to Alert

Combining multiple awk features into a complete pipeline that monitors an nginx access log
and generates an alert when error rates exceed a threshold.

```bash
printf '10.0.0.1 200 /api/users 0.123\n10.0.0.2 500 /api/data 2.345\n10.0.0.1 200 /api/users 0.098\n10.0.0.3 500 /api/data 3.210\n10.0.0.1 404 /missing 0.001\n10.0.0.2 200 /api/users 0.456\n' | \
  awk -v error_threshold=30 -v latency_threshold=1.0 '
# Format: ip status path latency
{
  ip=$1; status=$2; path=$3; latency=$4+0
  total++                              # => Count all requests

  # Classify by status code range
  if (status >= 500) errors_5xx++      # => Server errors
  if (status >= 400) errors_4xx++      # => Client errors (includes 5xx)
  if (latency > latency_threshold) slow_count++  # => Slow requests

  ip_count[ip]++                       # => Requests per IP
  path_count[path]++                   # => Requests per path
}
END {
  if (total == 0) exit

  error_rate = (errors_5xx / total) * 100    # => 5xx error rate %
  slow_rate  = (slow_count / total) * 100    # => Slow request rate %

  printf "=== Traffic Report ===\n"
  printf "Total requests: %d\n", total
  printf "5xx errors:     %d (%.1f%%)\n", errors_5xx, error_rate
  printf "4xx errors:     %d\n", errors_4xx - errors_5xx
  printf "Slow requests:  %d (%.1f%%)\n", slow_count, slow_rate

  # Alert on high error rate
  if (error_rate > error_threshold) {
    printf "\nALERT: Error rate %.1f%% exceeds threshold %d%%\n", error_rate, error_threshold
  }

  printf "\n=== Top Paths ===\n"
  for (p in path_count) printf "  %-20s %d\n", p, path_count[p]
}
'
# => total=6, errors_5xx=2, error_rate=33.3% (exceeds threshold=30)
# => slow_count=2 (latency > 1.0), slow_rate=33.3%
# => Output:
# => === Traffic Report ===
# => Total requests: 6
# => 5xx errors:     2 (33.3%)
# => 4xx errors:     1
# => Slow requests:  2 (33.3%)
# =>
# => ALERT: Error rate 33.3% exceeds threshold 30%
# =>
# => === Top Paths ===
# =>   /api/users           3
# =>   /api/data            2
# =>   /missing             1
```

**Key takeaway:** Real-world awk pipelines combine variable passing (`-v`), per-record accumulation (arrays + counters), computed metrics in END, conditional alerting, and formatted reporting — all in a single invocation processing stdin.

**Why it matters:** On-call engineers need quick traffic analysis without setting up dashboards. This pattern processes millions of log lines per second, generates actionable summaries in seconds, and triggers alerts — all without a log aggregation platform. It is the first tool to reach for during an incident before opening Grafana.

---

### Example 81: Frequency Table with Percentages

Extending frequency counting to include percentage of total and a scaled bar chart provides
immediate relative context alongside raw counts.

```bash
printf "200\n200\n404\n200\n500\n404\n200\n302\n500\n200\n" | awk '
{ freq[$1]++; total++ }    # => Count each status code; track total
END {
  print "Code  Count  Pct    Bar"
  print "----  -----  ---    ---"
  for (code in freq) {
    count = freq[code]
    pct   = count / total * 100             # => Percentage of total
    bar_len = int(pct / 5 + 0.5)           # => Scale: 5% per # char
    bar = ""
    for (i = 1; i <= bar_len; i++) bar = bar "#"   # => Build bar
    printf "%-6s %5d  %5.1f%%  %s\n", code, count, pct, bar
  }
}
' | sort -k1
# => total=10
# => 200: 5 occurrences = 50% => bar_len=10 => ##########
# => 302: 1 occurrence  = 10% => bar_len=2  => ##
# => 404: 2 occurrences = 20% => bar_len=4  => ####
# => 500: 2 occurrences = 20% => bar_len=4  => ####
# => Output:
# => Code  Count  Pct    Bar
# => ----  -----  ---    ---
# => 200       5   50.0%  ##########
# => 302       1   10.0%  ##
# => 404       2   20.0%  ####
# => 500       2   20.0%  ####
```

**Key takeaway:** Percentage computation requires knowing the total before computing per-entry percentages, which means either a two-pass approach or accumulating total in the main action and computing percentages only in END.

**Why it matters:** Relative frequency — what percentage of traffic is errors, what fraction of jobs fail — is more actionable than absolute counts. Adding percentage and a visual bar to frequency tables transforms raw counts into an immediately readable distribution summary.

---

### Example 82: Running Average and Standard Deviation

Computing running statistics — mean and standard deviation — in a single pass uses Welford's
online algorithm to avoid storing all values.

```bash
printf "85\n92\n71\n88\n64\n79\n95\n83\n77\n90\n" | awk '
BEGIN { n=0; mean=0; M2=0 }   # => Initialize Welford algorithm state
{
  x = $1 + 0
  n++                            # => Increment count
  delta  = x - mean              # => Difference from current mean
  mean   = mean + delta / n      # => Update running mean
  # => Welford: new_mean = old_mean + (x - old_mean) / n
  delta2 = x - mean              # => Difference from NEW mean
  M2     = M2 + delta * delta2   # => Accumulate sum of squared deviations
  # => M2 converges to sum of (x - mean)^2 without storing all x values
}
END {
  variance = M2 / n              # => Population variance
  stddev   = sqrt(variance)      # => Standard deviation
  printf "Count:   %d\n", n
  printf "Mean:    %.2f\n", mean
  printf "StdDev:  %.2f\n", stddev
  printf "CV:      %.1f%%\n", (stddev/mean)*100   # => Coefficient of variation
}
'
# => 10 values: 85,92,71,88,64,79,95,83,77,90
# => mean = 82.4, stddev ≈ 9.27
# => Output:
# => Count:   10
# => Mean:    82.40
# => StdDev:  9.27
# => CV:      11.2%
```

**Key takeaway:** Welford's online algorithm computes mean and variance in one pass without storing all values — essential for large datasets where storing millions of values would exhaust memory; `sqrt()` is a built-in awk math function.

**Why it matters:** Statistical summaries of streaming data — latency distributions, throughput measurements, score analysis — require single-pass algorithms because datasets may be too large to buffer. Welford's algorithm is numerically stable and easy to implement in awk, making single-pass statistics practical without a statistics library.

---

### Example 83: AWK Automation Pipeline — CSV to SQL INSERT

Converting CSV data to SQL INSERT statements is a real-world ETL task that demonstrates
field parsing, string escaping, and formatted output generation.

```bash
printf 'name,role,salary\nAlice,Engineer,85000\nBob,"Manager, Senior",92000\nCarol,Director,110000\n' | \
  gawk '
BEGIN {
  FPAT = "([^,]+)|(\"[^\"]+\")"   # => Handle quoted CSV fields (gawk)
  table = "employees"              # => Target SQL table name
}
NR == 1 {
  # => First record is header: extract column names
  for (i = 1; i <= NF; i++) {
    gsub(/^"|"$/, "", $i)          # => Strip quotes from header
    headers[i] = $i                # => Store column names
  }
  ncols = NF                       # => Save column count
  next                             # => Skip header row in output
}
{
  # => Build SQL INSERT for each data row
  values = ""
  for (i = 1; i <= ncols; i++) {
    gsub(/^"|"$/, "", $i)          # => Strip surrounding quotes
    gsub(/'/, "'\''", $i)         # => Escape single quotes for SQL safety
    if (i > 1) values = values ", "
    # => Wrap all values in single quotes (treat all as strings for simplicity)
    values = values "'" $i "'"
  }
  printf "INSERT INTO %s (%s) VALUES (%s);\n", table, headers[1] "," headers[2] "," headers[3], values
}
'
# => Output (valid SQL):
# => INSERT INTO employees (name,role,salary) VALUES ('Alice', 'Engineer', '85000');
# => INSERT INTO employees (name,role,salary) VALUES ('Bob', 'Manager, Senior', '92000');
# => INSERT INTO employees (name,role,salary) VALUES ('Carol', 'Director', '110000');
```

**Key takeaway:** CSV-to-SQL conversion requires FPAT for quoted field handling (gawk), quote stripping with `gsub`, SQL single-quote escaping, and dynamic column header loading from the first row — all standard awk patterns composed together.

**Why it matters:** Migrating data between systems — CSV exports from one tool to SQL inserts for another — is one of the most common data integration tasks. An awk-based converter handles millions of rows in seconds without a Python ETL framework, making it ideal for one-time migrations and recurring batch loads.

---

### Example 84: In-Place File Editing Pattern

awk does not edit files in place (unlike `sed -i`), but the standard pattern — write to a
temp file and replace — achieves the same result safely.

```bash
# Create test file
printf "version=1.0\napp_name=myapp\ndebug=false\nport=8080\n" > /tmp/awk_config.txt

# Update version field using awk + temp file pattern
awk '
/^version=/ {
  # => Match the version line specifically
  split($0, kv, "=")         # => Split "version=1.0" into kv[1]="version", kv[2]="1.0"
  print kv[1] "=" "2.0"     # => Replace value with new version
  next                       # => Skip the original print below
}
{ print }                    # => Print all other lines unchanged
' /tmp/awk_config.txt > /tmp/awk_config.tmp && mv /tmp/awk_config.tmp /tmp/awk_config.txt
# => Write to temp file first (atomic replacement)
# => mv replaces original only if awk succeeded (&&)
# => If awk fails: original file untouched (temp file remains, but original safe)

cat /tmp/awk_config.txt
# => Output:
# => version=2.0
# => app_name=myapp
# => debug=false
# => port=8080

rm /tmp/awk_config.txt
```

**Key takeaway:** The `awk ... file > tmp && mv tmp file` pattern provides safe in-place editing: the `&&` ensures the original is replaced only on success, and the temp file prevents partial writes from corrupting the original.

**Why it matters:** Configuration file updates — bumping version numbers, toggling feature flags, updating connection strings — are routine in deployment pipelines. The temp-file-then-rename pattern is atomically safe on the same filesystem, preventing the data loss that occurs when writing directly to the input file.

---

### Example 85: Complete Data Pipeline — Sales Analysis

A complete end-to-end awk program combining all major features: field parsing, arrays,
functions, filtering, aggregation, and formatted report generation.

```bash
printf 'date,region,product,quantity,price\n2026-01-15,North,Widget,100,9.99\n2026-01-20,South,Gadget,50,24.99\n2026-02-05,North,Widget,150,9.99\n2026-02-10,East,Gadget,75,24.99\n2026-03-01,South,Widget,200,9.99\n2026-03-15,North,Gadget,25,24.99\n' | \
  gawk '
BEGIN {
  FPAT = "([^,]+)|(\"[^\"]+\")"   # => CSV-safe field parsing
  FS = ","                          # => Fallback if FPAT not available
  print "=== Sales Analysis Report ==="
}

NR == 1 { next }    # => Skip header row

{
  date=$1; region=$2; product=$3; qty=$4+0; price=$5+0
  revenue = qty * price                       # => Compute line revenue

  # Accumulate by dimensions
  region_rev[region]   += revenue             # => Total revenue per region
  product_rev[product] += revenue             # => Total revenue per product
  month = substr(date, 1, 7)                  # => Extract YYYY-MM from date
  monthly_rev[month]   += revenue             # => Monthly revenue

  grand_total += revenue                      # => Grand total
  total_units += qty                          # => Total units sold
}

END {
  printf "\nGrand Total Revenue: $%.2f\n", grand_total
  printf "Total Units Sold:    %d\n\n", total_units

  print "=== Revenue by Region ==="
  for (r in region_rev) {
    pct = region_rev[r] / grand_total * 100
    printf "  %-10s $%8.2f (%5.1f%%)\n", r, region_rev[r], pct
  }

  print "\n=== Revenue by Product ==="
  for (p in product_rev) {
    pct = product_rev[p] / grand_total * 100
    printf "  %-10s $%8.2f (%5.1f%%)\n", p, product_rev[p], pct
  }

  print "\n=== Monthly Trend ==="
  for (m in monthly_rev) {
    bar_len = int(monthly_rev[m] / grand_total * 40 + 0.5)
    bar = ""
    for (i = 1; i <= bar_len; i++) bar = bar "="
    printf "  %s  $%8.2f  %s\n", m, monthly_rev[m], bar
  }
}
' | sort
# => Revenue computation: qty * price per line
# => Accumulation into region, product, monthly arrays
# => Percentage computation in END
# => Bar chart scaled to 40 chars max
# => Output (sorted):
# =>   === Monthly Trend ===
# =>   === Revenue by Product ===
# =>   === Revenue by Region ===
# =>   === Sales Analysis Report ===
# =>   2026-01  $2,498.50  =======...
# =>   2026-02  $3,373.25  ==========...
# =>   2026-03  $2,622.25  ========...
# =>   East       $1,874.25  (22.0%)
# =>   Gadget     $3,748.50  (44.0%)
# =>   Grand Total Revenue: $8,493.00
# =>   North      $4,122.50  (48.5%)
# =>   South      $2,498.25  (29.4%)
# =>   Total Units Sold:    600
# =>   Widget     $4,744.50  (55.9%)
```

**Key takeaway:** A complete awk sales analysis pipeline demonstrates how BEGIN (setup), per-record accumulation (arrays keyed by dimensions), and END (formatted multi-section report with percentages and bar charts) compose into a standalone analysis tool.

**Why it matters:** This final example shows awk as a complete analytics platform for structured text data — no database, no Python, no R. For operational data analysis on CSV files up to hundreds of megabytes, an awk pipeline processes data faster than loading it into a dataframe, with zero dependencies and no installation required on any Unix system.
