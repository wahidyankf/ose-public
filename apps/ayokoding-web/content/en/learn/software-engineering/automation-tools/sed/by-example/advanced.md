---
title: "Advanced"
weight: 10000003
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Advanced sed examples covering complex multiline transforms, GNU vs BSD differences, pipeline integration, config file editing, log processing, and real-world scripts"
tags: ["sed", "stream-editor", "text-processing", "tutorial", "by-example", "code-first", "advanced"]
---

This tutorial covers advanced sed concepts through 29 self-contained, heavily annotated shell
examples. The examples address GNU vs BSD portability, complex multiline pattern matching,
config file manipulation, log processing, CSV field operations, HTML tag stripping, pipeline
integration, and real-world automation scripts — spanning 70-95% of sed features.

## GNU vs BSD Portability

### Example 57: GNU sed vs BSD sed In-Place Editing

The most critical portability difference between GNU sed (Linux) and BSD sed (macOS) is the
`-i` flag behavior. GNU sed treats the suffix as optional; BSD sed requires it explicitly,
even if empty.

```bash
# GNU sed (Linux): suffix is optional — no backup
sed -i 's/old/new/' file.txt
# => GNU: -i with no argument overwrites file without backup

# GNU sed: with backup
sed -i.bak 's/old/new/' file.txt
# => GNU: creates file.txt.bak then overwrites file.txt

# BSD sed (macOS): suffix argument is REQUIRED
# sed -i 's/old/new/' file.txt   # FAILS on macOS — -i requires argument
sed -i '' 's/old/new/' file.txt
# => BSD: -i '' means "no backup suffix" — empty string is required
# => This is the portable macOS form

# Cross-platform script: detect and adapt
if sed --version 2>/dev/null | grep -q GNU; then
  # => GNU sed detected
  sed -i 's/old/new/' file.txt
else
  # => BSD sed assumed (macOS, FreeBSD)
  sed -i '' 's/old/new/' file.txt
fi
```

**Key takeaway:** GNU sed uses `sed -i` (no suffix) or `sed -i.bak`; BSD sed requires
`sed -i ''` (empty string) for no backup — always test both when writing cross-platform scripts.

**Why it matters:** Scripts written on Linux break silently or with confusing errors on macOS
when they use `sed -i` without a suffix. Cross-platform CI pipelines, developer setup scripts,
and dotfiles all need to handle this difference. The detection pattern above is the standard
portable approach used in projects that support both Linux and macOS developers.

---

### Example 58: Extended Regex: GNU `-E` vs BSD `-E`

Both GNU and BSD sed support `-E` for extended regular expressions, making it the most
portable ERE flag. The older `-r` flag is GNU-only and should be avoided in portable scripts.

```bash
# Portable ERE flag: -E works on both GNU and BSD sed
echo "color colour" | sed -E 's/colou?r/shade/g'
# => -E is supported on GNU sed (Linux) and BSD sed (macOS 10.7+)
# => u? means optional "u" in ERE — no backslash needed
# => Output: shade shade

# GNU-only flag (avoid for portability):
# echo "color colour" | sed -r 's/colou?r/shade/g'
# => -r is GNU extension, fails on macOS BSD sed
# => Do NOT use in portable scripts
```

**Key takeaway:** Use `-E` for extended regex — it works on both GNU sed and BSD sed; avoid
`-r` which is GNU-only.

**Why it matters:** Many tutorials use `-r`, but `-r` breaks on macOS. Using `-E` consistently
in scripts and documentation ensures they work without modification in mixed Linux/macOS
environments, Docker containers, and CI systems using different base images.

---

## Complex Multiline Transforms

### Example 59: Multiline Pattern Matching Across Line Boundaries

The `N` command enables matching patterns that span two lines. This is the mechanism for
finding and transforming content split across adjacent lines.

```bash
# Join lines where the second line starts with lowercase (continuation line)
printf "This is a long\nsentence that wraps.\nNew sentence here.\n" \
  | sed -n 'N; /\n[a-z]/{ s/\n/ /; p; d }; P; D'
# => N: append next line to pattern space
# => /\n[a-z]/: if second line starts lowercase (continuation)
# =>   s/\n/ /: join with space
# =>   p; d: print joined line, delete and next cycle
# => P; D: if not continuation, print first line, delete it, re-process second
# => Output:
# => This is a long sentence that wraps.
# => New sentence here.
```

**Key takeaway:** Combining `N` with pattern matching on `\n` enables detection and
transformation of content split across two lines.

**Why it matters:** Email headers, HTTP response headers, and RFC 2822 formatted messages
use line folding — long values continue on the next line with a leading whitespace. Unfolding
these requires detecting the continuation character across the line boundary, which is only
possible with `N`.

---

### Example 60: Sliding Window with `N` for Context

A sliding window of N lines enables context-aware processing: you can look at the current line
and the next line together before deciding what to output.

```bash
# Add a blank line before lines that follow a line ending with ":"
printf "Section:\nitem1\nitem2\nOther:\nitem3\n" \
  | sed 'N; /:\n/s/\n/\n\n/; P; D'
# => N: join current and next line
# => /:\n/: if current line ends with : (the embedded newline follows it)
# =>   s/\n/\n\n/: replace the embedded newline with two newlines
# => P: print the first line (with added blank if applicable)
# => D: delete first line, re-process second through the same script
# => Output:
# => Section:
# =>
# => item1
# => item2
# => Other:
# =>
# => item3
```

**Key takeaway:** The `N; ...; P; D` idiom implements a two-line sliding window — process
two adjacent lines as a unit, output the first, and re-examine the second with the third.

**Why it matters:** Context-sensitive formatting — adding blank lines before headings,
inserting separators between sections, or detecting record boundaries — requires knowing
the relationship between adjacent lines. The sliding window is the only sed pattern that
provides this without external state.

---

### Example 61: Removing a Block When Start and End Are on Adjacent Lines

When a block's start and end markers appear on the same or adjacent lines, range addressing
alone is insufficient. `N`-based matching handles these edge cases.

```bash
# Remove single-line block comments /* ... */ on one line
printf "code();\n/* single line comment */\nmore_code();\n" \
  | sed 's|/\*[^*]*\*/||g'
# => /\*  matches literal /*
# => [^*]* matches any characters that are not *
# => \*/  matches closing */
# => g removes all such inline comments on each line
# => Output:
# => code();
# =>
# => more_code();
```

**Key takeaway:** For same-line block delimiters, a single `s` with a non-greedy-like pattern
`[^*]*` handles the match without multi-line machinery.

**Why it matters:** Stripping inline comments from source code, removing XML attributes, or
cleaning up SQL hints are all single-line block patterns. Using `[^delimiter]*` instead of
`.*` prevents the regex from consuming too much (overgreedy matching across multiple comment
blocks on the same line).

---

## Config File Manipulation

### Example 62: Extracting a Config Value

Extracting a value from a `key=value` or `key: value` config file is a read-only operation
that uses sed as a targeted filter.

```bash
# Create a sample config
printf "host=localhost\nport=5432\ndbname=myapp\n" > /tmp/sed_app.conf

# Extract the value of "port"
sed -n 's/^port=//p' /tmp/sed_app.conf
# => -n suppresses all other output
# => s/^port=// matches lines starting with "port=" and removes that prefix
# => If substitution succeeds, p prints the remainder (the value)
# => Output: 5432

# Extract YAML-style value
printf "host: localhost\nport: 5432\n" | sed -n 's/^port: //p'
# => Same pattern adapted for YAML colon-space separator
# => Output: 5432
```

**Key takeaway:** `sed -n 's/^key=//p'` extracts the value for `key` from a `key=value`
config file — the substitution both selects the line and strips the key prefix.

**Why it matters:** Shell scripts frequently need to read individual config values without
loading a full config library. This sed pattern extracts a value in one expression. It is
used in deployment scripts, environment setup, and CI variable extraction from `.env` files
and YAML config files.

---

### Example 63: Updating a Config Value In-Place

Modifying a specific key's value in a config file while leaving all other lines unchanged
is the most common in-place sed operation in deployment scripts.

```bash
# Create a sample config
printf "host=localhost\nport=5432\ndbname=myapp\n" > /tmp/sed_deploy.conf

# Update the port value
sed -i.bak 's/^port=.*/port=3306/' /tmp/sed_deploy.conf
# => ^port=  anchors to lines starting with "port="
# => .*  matches any existing value (the old port number)
# => Replace the whole matched portion with port=3306
# => Lines not starting with "port=" are unchanged
# => .bak backup is created before modification

cat /tmp/sed_deploy.conf
# => Output:
# => host=localhost
# => port=3306
# => dbname=myapp
```

**Key takeaway:** `s/^key=.*/key=newvalue/` updates a key's value in a `key=value` config by
matching the full `key=oldvalue` line and replacing it with `key=newvalue`.

**Why it matters:** Deployment automation frequently needs to inject environment-specific
values (database URLs, API endpoints, feature flags) into config files checked out from
version control. This sed pattern is the standard approach — it is idempotent, doesn't require
knowing the old value, and works on any `key=value` format.

---

### Example 64: Commenting Out a Config Line

Disabling a config entry by prepending `#` is safer than deleting it — the original value
is preserved as a comment and can be re-enabled later.

```bash
printf "debug=true\nverbose=false\nlog_level=info\n" > /tmp/sed_flags.conf

# Comment out the "debug" line
sed -i.bak 's/^debug=/#debug=/' /tmp/sed_flags.conf
# => ^debug= matches lines starting with "debug="
# => # is prepended, turning it into a comment
# => The original value is preserved after the # for reference

cat /tmp/sed_flags.conf
# => Output:
# => #debug=true
# => verbose=false
# => log_level=info
```

**Key takeaway:** `s/^key=/#key=/` comments out a config line by prepending `#`, preserving
the old value for reference without deleting it.

**Why it matters:** In production systems, disabling a config flag by commenting rather than
deleting provides a quick rollback path: just remove the `#`. This is safer than deletion and
is standard practice in configuration management tools like Ansible and Puppet when they need
to disable settings.

---

### Example 65: Uncommenting a Config Line

The reverse of commenting out: removing a leading `#` to re-enable a config line.

```bash
printf "#debug=true\nverbose=false\n" > /tmp/sed_commented.conf

# Uncomment the debug line
sed -i.bak 's/^#\(debug=\)/\1/' /tmp/sed_commented.conf
# => ^# matches the leading comment character
# => \(debug=\) captures the key=prefix into group 1
# => Replacement \1 restores just the key= prefix without #
# => Lines not matching ^#debug= are unchanged

cat /tmp/sed_commented.conf
# => Output:
# => debug=true
# => verbose=false
```

**Key takeaway:** `s/^#\(key=\)/\1/` uncomments a specific key by removing only the leading
`#` from lines starting with `#key=`.

**Why it matters:** Toggling features via config file comments is a deployment pattern used
in nginx, Apache, sshd, and many other Unix daemons. Automating the comment/uncomment
operation with sed in deployment scripts is far safer than manual editing of production
config files.

---

## Log Processing

### Example 66: Extracting Fields from Log Lines

Access logs and application logs follow consistent formats. sed extracts specific fields
using capture groups and backreferences.

```bash
# Extract IP addresses from Apache-style access log lines
printf '192.168.1.1 - - [01/Apr/2026:10:00:00] "GET /index.html HTTP/1.1" 200 1234\n
10.0.0.5 - - [01/Apr/2026:10:01:00] "POST /api HTTP/1.1" 201 567\n' \
  | sed -n 's/^\([0-9.]*\) .*/\1/p'
# => -n suppresses default output
# => ^ anchors to start of line
# => \([0-9.]*\) captures the IP address (digits and dots)
# => .* matches the rest of the line
# => \1 in replacement outputs only the captured IP
# => p prints the result of successful substitutions
# => Output:
# => 192.168.1.1
# => 10.0.0.5
```

**Key takeaway:** `sed -n 's/^(field).*$/\1/p'` extracts the first field from structured log
lines — combining address-via-substitution with output suppression.

**Why it matters:** Log analysis pipelines need to extract specific fields (IP, status code,
URL, timestamp) from each log line before aggregating or counting them. sed extraction is
faster than awk for simple single-field extraction because it requires no field-splitting logic.

---

### Example 67: Filtering Log Lines by HTTP Status Code

Extracting log entries for specific HTTP status codes enables targeted incident analysis
without loading the entire log into memory.

```bash
# Extract only 5xx error lines from access log
printf '192.168.1.1 - - [01/Apr/2026] "GET / HTTP/1.1" 200 1234\n
192.168.1.2 - - [01/Apr/2026] "GET /api HTTP/1.1" 500 0\n
192.168.1.3 - - [01/Apr/2026] "POST /data HTTP/1.1" 503 120\n' \
  | sed -n '/ 5[0-9][0-9] /p'
# => / 5[0-9][0-9] / matches a space, then 5xx status, then space
# => The space boundaries prevent matching "500" inside a URL
# => -n + p prints only matched lines
# => Output:
# => 192.168.1.2 - - [01/Apr/2026] "GET /api HTTP/1.1" 500 0
# => 192.168.1.3 - - [01/Apr/2026] "POST /data HTTP/1.1" 503 120
```

**Key takeaway:** Space-bounded patterns like `/ 5[0-9][0-9] /` match status codes accurately
by ensuring the digits are surrounded by field separators, preventing false matches.

**Why it matters:** During incident response, filtering a 100 GB access log to only 5xx errors
in seconds is operationally critical. sed processes the stream without loading the file,
making it feasible to run on production servers where memory is constrained.

---

### Example 68: Normalizing Timestamp Formats in Logs

Different systems emit timestamps in different formats. sed normalizes them to a canonical
format for unified log analysis.

```bash
# Convert "Apr 01 2026" to "2026-04-01"
printf "Apr 01 2026 event started\nApr 02 2026 event ended\n" \
  | sed -E 's/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]{2}) ([0-9]{4})/\3-\2-\1/'
# => -E enables ERE for cleaner syntax
# => Group 1 captures the month abbreviation
# => Group 2 captures the two-digit day
# => Group 3 captures the four-digit year
# => Replacement \3-\2-\1 reorders to YYYY-DD-Mon
# => (Further mapping of month names to numbers requires awk or multiple sed passes)
# => Output:
# => 2026-01-Apr event started
# => 2026-02-Apr event ended
```

**Key takeaway:** Backreferences enable field reordering within a line — combine with lookup
tables (multiple `-e` expressions) for complete month-name-to-number conversion.

**Why it matters:** Log aggregation systems like Elasticsearch and Splunk require consistent
timestamp formats for accurate time-series queries. Normalizing timestamps at ingest time
prevents out-of-order event problems and incorrect time window calculations.

---

## CSV and Structured Data

### Example 69: Extracting a CSV Field by Column Position

sed can extract a specific field from CSV by removing all fields before and after the target.
This works reliably for simple CSV without embedded commas in fields.

```bash
# Extract the second field (column 2) from CSV
printf "alice,30,engineer\nbob,25,designer\ncarol,35,manager\n" \
  | sed -E 's/^[^,]+,([^,]+),.*/\1/'
# => -E enables ERE
# => ^[^,]+ matches and discards field 1 (non-comma chars from start)
# => , literal comma separator
# => ([^,]+) captures field 2 into group 1
# => ,.* discards field 3 onwards
# => Replacement \1 outputs only field 2
# => Output:
# => 30
# => 25
# => 35
```

**Key takeaway:** `s/^[^,]+,([^,]+),.*/\1/` extracts the second CSV field by consuming
surrounding fields with non-comma anchored patterns.

**Why it matters:** Quick CSV field extraction without installing `cut` or invoking `awk`
is a common scripting need. The sed approach works in any POSIX environment and handles
fields at any column by extending or reducing the prefix-matching groups.

---

### Example 70: Adding a CSV Header

Prepending a header row to CSV data from a script or database export requires inserting
one line before all data — the classic `1i` pattern.

```bash
# Add CSV header to data without header
printf "alice,30,engineer\nbob,25,designer\n" | sed '1i\name,age,role'
# => 1i\ addresses line 1 and inserts text before it
# => "name,age,role" is the header line
# => All data lines follow unchanged
# => Output:
# => name,age,role
# => alice,30,engineer
# => bob,25,designer
```

**Key takeaway:** `1i\header_text` inserts a header before all data lines regardless of how
many data lines exist.

**Why it matters:** Database exports and script outputs rarely include headers. Adding them
in a pipeline step before passing to CSV parsers, spreadsheets, or reporting tools is a
one-expression sed operation that saves a separate file creation step.

---

### Example 71: Stripping HTML Tags

Removing HTML or XML tags from content produces plain text from markup. sed handles simple
tag stripping without a full parser.

```bash
# Strip all HTML tags
printf "<h1>Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>\n" \
  | sed 's/<[^>]*>//g'
# => <  matches opening angle bracket
# => [^>]* matches any characters that are not > (tag content)
# => >  matches closing angle bracket
# => g removes all tags on each line
# => Output:
# => Hello World
# => This is bold text.
```

**Key takeaway:** `s/<[^>]*>//g` strips HTML/XML tags from each line; `[^>]*` prevents
overgreedy matching across multiple tags on the same line.

**Why it matters:** Generating plain-text previews from HTML content, extracting readable
text for indexing, and stripping markup from template output are common content pipeline
tasks. sed tag stripping handles simple markup reliably and is orders of magnitude faster
than loading an HTML parser for bulk text extraction.

---

### Example 72: Extracting Simple JSON Field Values

For simple JSON (one value per line without nesting), sed can extract field values using
pattern matching. This avoids `jq` for basic cases in environments where it is not installed.

```bash
# Extract the "name" field from flat JSON
printf '{"name": "Alice", "age": 30}\n{"name": "Bob", "age": 25}\n' \
  | sed -E 's/.*"name": "([^"]+)".*/\1/'
# => -E enables ERE
# => .* matches everything before the "name" field
# => "name": " matches the literal key and opening quote
# => ([^"]+) captures the value (any chars except closing quote)
# => ".* matches the closing quote and rest of line
# => \1 outputs only the captured value
# => Output:
# => Alice
# => Bob
```

**Key takeaway:** `s/.*"key": "([^"]+)".*/\1/` extracts a JSON string field value from a
flat JSON line — use `jq` for nested or complex JSON.

**Why it matters:** Many API responses and configuration stores output single-line JSON.
When `jq` is not available (minimal containers, embedded systems, old servers), sed provides
a lightweight extraction method. For production pipelines with complex JSON, prefer `jq`.

---

## Pipeline Integration

### Example 73: Sed in a Pipeline Chain

sed is designed to be chained with other Unix tools. This example shows sed as one stage in
a multi-tool pipeline that transforms, filters, and aggregates data.

```bash
# Count unique IP addresses in an access log
printf '10.0.0.1 - GET /page1\n10.0.0.2 - GET /page2\n10.0.0.1 - GET /page3\n' \
  | sed -E 's/ .*//' \
  | sort \
  | uniq -c \
  | sort -rn
# => sed -E 's/ .*//' extracts the IP (removes everything from first space)
# => sort arranges IPs alphabetically
# => uniq -c counts consecutive identical IPs
# => sort -rn sorts by count descending
# => Output:
# =>       2 10.0.0.1
# =>       1 10.0.0.2
```

**Key takeaway:** sed fits naturally in Unix pipelines — pipe into sed, then into `sort`,
`uniq`, `awk`, or other tools, each doing one thing well.

**Why it matters:** The Unix philosophy of composable single-purpose tools is what makes
sed so durable. A sed preprocessing step that normalizes or extracts data keeps downstream
tools simpler. Each tool in the pipeline does exactly what it is best at, and the result is
faster, more readable, and more maintainable than a monolithic script.

---

### Example 74: Sed with `find -exec`

Combining `find` with `sed -exec` applies the same transformation to many files in a
directory tree — the standard in-place bulk editing pattern.

```bash
# Create sample files
mkdir -p /tmp/sed_bulk
printf "version: 1.0\n" > /tmp/sed_bulk/app.conf
printf "version: 1.0\n" > /tmp/sed_bulk/db.conf

# Update version in all .conf files under /tmp/sed_bulk
find /tmp/sed_bulk -name "*.conf" -exec sed -i.bak 's/version: 1.0/version: 2.0/' {} \;
# => find locates all *.conf files
# => -exec runs sed for each found file
# => {} is replaced by the current filename
# => \; terminates the -exec expression
# => sed -i.bak modifies each file in place with a .bak backup

grep version /tmp/sed_bulk/*.conf
# => Output:
# => /tmp/sed_bulk/app.conf:version: 2.0
# => /tmp/sed_bulk/db.conf:version: 2.0
```

**Key takeaway:** `find ... -exec sed -i.bak 's/old/new/' {} \;` applies in-place
substitution to every file matching the `find` criteria — the canonical bulk file editing
pattern.

**Why it matters:** Renaming a configuration key, updating a dependency version string, or
changing an API endpoint across hundreds of files in a monorepo is a single `find`/`sed`
command. This is how large-scale automated refactoring is done in shell without git's
interactive rebase or sed-based `sed -i` in a loop.

---

### Example 75: Sed with Heredoc Input

Heredoc syntax provides multiline string input to sed without creating a temporary file.
This is useful in scripts that generate configuration on the fly.

```bash
# Process multiline heredoc input with sed
sed 's/PLACEHOLDER/ACTUAL_VALUE/g' <<'EOF'
config:
  key: PLACEHOLDER
  other_key: PLACEHOLDER
  nested:
    value: PLACEHOLDER
EOF
# => <<'EOF' provides multiline input to sed's stdin
# => Single-quoted 'EOF' prevents shell variable expansion in the heredoc
# => s/PLACEHOLDER/ACTUAL_VALUE/g replaces every occurrence
# => Output:
# => config:
# =>   key: ACTUAL_VALUE
# =>   other_key: ACTUAL_VALUE
# =>   nested:
# =>     value: ACTUAL_VALUE
```

**Key takeaway:** Piping a heredoc (`<<'EOF' ... EOF`) to sed processes multiline template
strings without creating temporary files — single-quote the delimiter to prevent shell
expansion inside the heredoc.

**Why it matters:** Dynamic configuration generation in deploy scripts often starts from a
template with placeholder values. Heredoc with sed replaces all placeholders in one command,
keeping the template inline in the script for easy review and modification.

---

### Example 76: Environment Variable Interpolation in Sed

Injecting shell variables into sed replacement strings requires careful quoting — single
quotes protect against most issues but prevent variable expansion.

```bash
# Inject a shell variable into a sed replacement
APP_PORT=8080
echo "port=3000" | sed "s/3000/$APP_PORT/"
# => Double quotes allow shell to expand $APP_PORT before sed sees the command
# => sed receives: s/3000/8080/
# => Output: port=8080

# Safer approach: use a variable for the whole expression
DB_HOST="db.prod.internal"
OLD_HOST="localhost"
echo "host=$OLD_HOST" | sed "s/$OLD_HOST/$DB_HOST/"
# => Both $OLD_HOST and $DB_HOST are expanded by the shell
# => sed receives: s/localhost/db.prod.internal/
# => Output: host=db.prod.internal

# WARNING: if the variable contains / it breaks the default delimiter
BAD_PATH="/usr/local/bin"
# echo "path=old" | sed "s/old/$BAD_PATH/"  # FAILS: / in value breaks s///
echo "path=old" | sed "s|old|$BAD_PATH|"
# => Use | as delimiter when the variable may contain /
# => Output: path=/usr/local/bin
```

**Key takeaway:** Use double quotes to allow shell variable expansion in sed expressions;
use an alternative delimiter (`|`, `,`, `@`) when variables may contain the default `/`
delimiter.

**Why it matters:** Deployment scripts inject runtime values (hostnames, ports, paths) into
config files. Shell variable interpolation in sed is the mechanism for this. The delimiter
problem with path values is a classic bug — using `|` as the delimiter prevents it entirely.

---

### Example 77: Alternative Delimiters

The delimiter in `s///` is not restricted to `/`. Any character that does not appear in the
pattern or replacement can serve as the delimiter, eliminating the need to escape forward
slashes.

```bash
# Using | as delimiter for URL patterns
echo "url=http://old.example.com/path" | sed 's|http://old.example.com|https://new.example.com|'
# => | is the delimiter — no / escaping needed
# => Pattern and replacement contain / freely
# => Output: url=https://new.example.com/path

# Using @ for filesystem paths
echo "include /etc/old/config.conf" | sed 's@/etc/old/@/etc/new/@'
# => @ as delimiter — the / in paths needs no escaping
# => Output: include /etc/new/config.conf

# Using , for comma-separated data
echo "a,b,c" | sed 's,b,B,'
# => , as delimiter — works when data contains no commas in the pattern
# => Output: a,B,c
```

**Key takeaway:** Any character can be the `s` command delimiter — choose one that does not
appear in your pattern or replacement to avoid backslash escaping.

**Why it matters:** URL and path substitutions with the default `/` delimiter require escaping
every `/` in the pattern and replacement. Alternative delimiters eliminate this noise, making
the command readable and reducing the chance of a missing escape causing a silent mismatch.

---

## Performance and Real-World Scripts

### Example 78: Early Exit for Large Files

For large files where you only need the first N matches, combining `q` or a match counter
with early exit avoids processing the entire file.

```bash
# Find the first ERROR line in a large log and stop
printf "INFO line1\nINFO line2\nERROR found it\nINFO after\nERROR second\n" \
  | sed -n '/ERROR/{p; q}'
# => /ERROR/ addresses lines matching ERROR
# => p prints the matched line
# => q quits sed immediately after the first match
# => Lines after the first ERROR are never processed
# => Output: ERROR found it
```

**Key takeaway:** `sed -n '/pattern/{p; q}'` prints the first matching line and exits
immediately — use this to find the first occurrence in large files without reading to the end.

**Why it matters:** Scanning a 10 GB log file to find the first occurrence of an error
should not require reading all 10 GB. Early exit with `q` stops processing at the first
match, reducing I/O from gigabytes to kilobytes in the common case where the error appears
early in the file.

---

### Example 79: Processing Only a Line Range for Performance

When you know the lines of interest are in a specific range (e.g., the last 1000 lines of a
log), restricting processing to that range avoids full-file I/O.

```bash
# Apply transformation only to the middle section of a file
printf "header1\nheader2\ndata1\ndata2\ndata3\nfooter\n" | sed -n '3,5p'
# => 3,5 selects only lines 3 through 5
# => -n + p outputs only those lines
# => Lines 1-2 and 6 are skipped entirely
# => Output:
# => data1
# => data2
# => data3
```

**Key takeaway:** Combining line-range addressing with `-n` and `p` extracts a known section
of a large file without loading or transforming the parts you do not need.

**Why it matters:** Extracting a section from a multi-gigabyte file by line range is much
faster than reading the whole file. For log rotation analysis, sectional config processing,
or sampling middle portions of large datasets, range extraction is the appropriate tool.

---

### Example 80: Block Commenting Multiple Lines

Prepending `#` to a range of lines comments out a configuration block — a common operation
when temporarily disabling a feature.

```bash
# Comment out lines 2 through 4
printf "line1\nline2\nline3\nline4\nline5\n" | sed '2,4s/^/# /'
# => 2,4 restricts substitution to lines 2-4
# => s/^/# / inserts "# " at the start of each line in the range
# => Output:
# => line1
# => # line2
# => # line3
# => # line4
# => line5
```

**Key takeaway:** `start,end s/^/# /` comments out a range of lines by prepending a hash-space to
each — combine with regex addressing to target a named block.

**Why it matters:** Disabling a configuration block (a server block in nginx, a feature flag
section, a cron group) by commenting it out is safer than deletion. This sed pattern performs
block commenting in one command and is reversible with the corresponding `s/^# //` pattern.

---

### Example 81: Uncommenting a Block

The reverse of block commenting: removing leading hash-space from a range of lines to re-enable
a configuration block.

```bash
# Uncomment lines 2 through 4
printf "line1\n# line2\n# line3\n# line4\nline5\n" | sed '2,4s/^# //'
# => 2,4 restricts substitution to lines 2-4
# => s/^# // removes the leading "# " from each line in the range
# => Lines outside the range are unchanged
# => Output:
# => line1
# => line2
# => line3
# => line4
# => line5
```

**Key takeaway:** `start,end s/^# //` uncomments a range of lines by removing the hash-space prefix
— the exact inverse of the block-commenting pattern.

**Why it matters:** Feature flags and environment-specific config blocks are often toggled
by commenting/uncommenting in automated deployment scripts. Pairing the comment and
uncomment patterns gives a complete, auditable toggle mechanism without manual file editing.

---

### Example 82: Sed One-Liner Collection for Common Tasks

Several sed one-liners are canonical solutions that every sed user should know. This example
demonstrates the most commonly needed transformations in one place.

```bash
# Double-space a file (add blank line after each line)
printf "a\nb\nc\n" | sed 'G'
# => G appends hold space (initially empty) to pattern space with \n
# => Result: each line followed by a blank line
# => Output: a, (blank), b, (blank), c, (blank)

# Number lines (alternative to cat -n)
printf "x\ny\nz\n" | sed '=' | sed 'N; s/\n/\t/'
# => First sed: = prints line number, default prints line
# => Second sed: N joins number line + content line, s replaces \n with tab
# => Output:
# => 1  x
# => 2  y
# => 3  z

# Remove all blank lines
printf "a\n\nb\n\nc\n" | sed '/^[[:space:]]*$/d'
# => ^[[:space:]]*$ matches lines with only whitespace (or empty)
# => d deletes them
# => Output: a, b, c
```

**Key takeaway:** `G` double-spaces; `=` + `N;s/\n/\t/` numbers lines; `/^[[:space:]]*$/d`
removes blank/whitespace-only lines — three one-liners covering the most frequent text
formatting tasks.

**Why it matters:** These canonical one-liners solve recurring problems without writing new
logic. Knowing them prevents reinventing solutions to problems that have been solved for
decades. They are the "muscle memory" of experienced sed users.

---

### Example 83: Real-World: Patching a Version String in Multiple Files

Version string updates across a codebase during release automation use `find` with sed in-place
editing — the production release engineering pattern.

```bash
# Setup: create sample files with version strings
mkdir -p /tmp/sed_release
printf 'APP_VERSION="1.2.3"\n' > /tmp/sed_release/version.sh
printf 'version: "1.2.3"\n' > /tmp/sed_release/chart.yaml
printf '"version": "1.2.3"\n' > /tmp/sed_release/package.json

NEW_VERSION="1.3.0"

# Update version in all relevant files
find /tmp/sed_release -type f \
  \( -name "*.sh" -o -name "*.yaml" -o -name "*.json" \) \
  -exec sed -i.bak "s/1\.2\.3/$NEW_VERSION/g" {} \;
# => find selects files matching any of the name patterns
# => -exec runs sed for each matched file
# => s/1\.2\.3/$NEW_VERSION/g — dots escaped, shell expands $NEW_VERSION
# => .bak backup created before each modification

grep -r "version" /tmp/sed_release/ --include="*.sh" --include="*.yaml" --include="*.json"
# => Output (new version in all files):
# => /tmp/sed_release/version.sh:APP_VERSION="1.3.0"
# => /tmp/sed_release/chart.yaml:version: "1.3.0"
# => /tmp/sed_release/package.json:"version": "1.3.0"
```

**Key takeaway:** Escape regex metacharacters in version strings (`.` becomes `\.`); use shell
variable expansion in double-quoted sed expressions to inject the new version at runtime.

**Why it matters:** Release automation that manually edits version strings in multiple files
is error-prone and non-reproducible. A single `find`/`sed` command makes version bumping
atomic and auditable. The `.bak` backups provide rollback in case of a wrong version string.

---

### Example 84: Real-World: Anonymizing Log Data

Replacing PII (personally identifiable information) like email addresses, IPs, and names in
log files before sharing them for debugging is a data privacy requirement.

```bash
# Anonymize email addresses in log output
printf 'User alice@example.com logged in\nUser bob@company.org failed auth\n' \
  | sed -E 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/[REDACTED]/g'
# => [a-zA-Z0-9._%+-]+ matches the local part of email (before @)
# => @ literal at sign
# => [a-zA-Z0-9.-]+ matches the domain name
# => \. literal dot
# => [a-zA-Z]{2,} matches the TLD (2+ alpha chars)
# => [REDACTED] replaces the entire email address
# => g replaces all occurrences per line
# => Output:
# => User [REDACTED] logged in
# => User [REDACTED] failed auth
```

**Key takeaway:** A well-crafted email regex with `g` flag anonymizes all email addresses in
a log stream; apply similar patterns for IPs (`[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}`)
and credit card numbers.

**Why it matters:** Sharing production logs with third-party support teams or committing debug
logs to public repositories creates GDPR and PCI-DSS compliance risks. Automated PII redaction
with sed in the log export pipeline ensures sensitive data never leaves the production boundary.

---

### Example 85: Real-World: Generating a Configuration File from a Template

The most complete production sed pattern: reading a template with named placeholders and
replacing all of them with runtime values in a single sed invocation.

```bash
# Template configuration file
cat > /tmp/sed_template.conf << 'TEMPLATE'
server {
    listen DB_PORT;
    server_name APP_HOST;
    root APP_ROOT;
    access_log LOG_DIR/access.log;
}
TEMPLATE

# Runtime values
APP_HOST="myapp.prod.internal"
DB_PORT="8080"
APP_ROOT="/var/www/myapp"
LOG_DIR="/var/log/nginx"

# Generate final config from template using multiple -e expressions
sed \
  -e "s|APP_HOST|$APP_HOST|g" \
  -e "s|DB_PORT|$DB_PORT|g" \
  -e "s|APP_ROOT|$APP_ROOT|g" \
  -e "s|LOG_DIR|$LOG_DIR|g" \
  /tmp/sed_template.conf
# => Each -e expression replaces one placeholder with its runtime value
# => | delimiter avoids escaping the / in path values
# => Shell expands each variable before sed sees the expression
# => g flag handles multiple occurrences of the same placeholder
# => Output:
# => server {
# =>     listen 8080;
# =>     server_name myapp.prod.internal;
# =>     root /var/www/myapp;
# =>     access_log /var/log/nginx/access.log;
# => }
```

**Key takeaway:** Multiple `-e` expressions with `|` delimiters and shell-expanded variables
implement a lightweight template engine — replace all named placeholders from a template file
in one sed invocation.

**Why it matters:** Every production deployment involves some form of config templating —
injecting environment-specific values into a config checked out from version control. sed
provides a zero-dependency templating solution available on every Unix system. For complex
templating needs, `envsubst` or a proper template engine is more appropriate, but sed handles
the majority of cases with less overhead and better portability.
