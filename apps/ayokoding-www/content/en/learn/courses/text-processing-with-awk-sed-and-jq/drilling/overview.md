---
title: "Drilling Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Recall questions, applied judgement problems, hands-on katas, a readiness checklist,
and design trade-off prompts. Work them after the themes: recall locks in the
vocabulary, applied problems force tool choice under ambiguity, katas rebuild the
muscle, and the checklist tells you when to stop. Do them with a terminal open and
the course fixtures at hand -- every question and problem below is answerable by
running a command from Themes A through I, and the habit of verifying an answer by
running it is the real skill being drilled. A passing score here means you can route
a new text task to its tool, write the program, prove the rerun, and explain the
choice, all without reopening the lessons. Keep a log of every miss and every slow
answer: the log becomes your personal review deck for the week after you finish.

## Recall Q&A

Twenty-four short-answer questions, one or two per concept below. Answer from memory,
then check. Star the ones you miss and repeat them after a day; spaced repetition only
works when the misses decide what comes back. Say each answer as a command shape, not
just a fact -- "NR over one" rather than "record number" -- because recall that stops
at vocabulary cannot become a program under time pressure.

### Q1 (co-01): What is a record and what is a field in awk?

<details><summary>Answer</summary>

A record is one line of input (`$0`); a field is one whitespace-separated chunk of that
line (`$1`, `$2`, and so on). awk splits every record into fields before any rule runs,
so every action thinks in columns, never in raw text.

</details>

### Q2 (co-01): How do you print the last field of rows with different widths?

<details><summary>Answer</summary>

With `$NF`: `NF` holds the current record's field count, so `$NF` always names the last
column even when rows carry three, five, or nine fields. Fixed numbers like `$3` break
on ragged rows; `$NF` adapts to each row.

</details>

### Q3 (co-02): In `pattern { action }`, what runs when, and what happens to non-matches?

<details><summary>Answer</summary>

awk tests every record against the pattern; matching records run the action,
non-matching records are skipped silently. A bare `/fail/ { print $1 }` therefore
prints exactly the failing rows' names and nothing else -- selection and projection in
one rule.

</details>

### Q4 (co-03): What does NR count, and why does `NR > 1` skip headers?

<details><summary>Answer</summary>

`NR` counts records read so far, starting at 1, so the header row is record 1 and every
data row is record 2 or later. `NR > 1` is false only for the header, which keeps
column names out of sums, averages, and reformatted output.

</details>

### Q5 (co-03): Which builtins does awk fill in, and which do you set: FS, NF, NR, OFS?

<details><summary>Answer</summary>

awk fills in `NF` (this record's field count) and `NR` (records read so far); you set
`FS` (how input splits) and `OFS` (how output joins). Reading `NF` diagnoses ragged
rows, setting `OFS` converts delimiters -- input facts versus output choices.

</details>

### Q6 (co-04): When do you write an awk function instead of repeating the action?

<details><summary>Answer</summary>

When one decision -- a threshold, a classification, a format -- appears in two or more
places. `function status(t)` names the rule once, every action calls it, and the next
threshold change edits one line instead of hunting every copy.

</details>

### Q7 (co-04): What does `gsub` return, and what does it change?

<details><summary>Answer</summary>

`gsub` returns the count of replacements it made and edits its target string in place.
`gsub(/ /, "", clean)` therefore strips every space from `clean` and tells you how
many it stripped -- the return value audits, the side effect cleans.

</details>

### Q8 (co-05): What does `sed -n '2,4p'` print, and why is `-n` required?

<details><summary>Answer</summary>

Lines 2 through 4, both ends inclusive, and nothing else. Without `-n`, sed prints
every line by default and the addressed lines print twice; `-n` suppresses the
automatic printing so only the `p` command speaks.

</details>

### Q9 (co-05): When do you address by pattern instead of line number?

<details><summary>Answer</summary>

When the file can grow, rotate, or reorder: `/down/p` finds every down service no
matter which line it sits on, while `3p` breaks the first time a row is added above
line 3. Address content when layout shifts; address numbers only for stable slices.

</details>

### Q10 (co-06): What changes when you add `g` to `s///`, and when do you leave it off?

<details><summary>Answer</summary>

The substitution repeats for every match on the line instead of stopping at the first.
Add `g` when every occurrence must change (normalizing, redacting); leave it off when
only the first match is yours to edit (a prefix, a first column), so later matches
survive untouched.

</details>

### Q11 (co-07): How do capture groups reorder text without retyping it?

<details><summary>Answer</summary>

Parentheses remember each match part and `\1`, `\2` replay the parts in any order:
`s/([a-z]+) ([a-z]+)/\2 \1/` swaps two words. The groups capture the text once and the
replacement re-emits it rearranged, so nothing is ever retyped or mistyped.

</details>

### Q12 (co-08): What are the pattern space and the hold space, and what moves text between them?

<details><summary>Answer</summary>

The pattern space holds the current line; the hold space parks a second one. `h`
copies the line into hold space, `H` appends below it, `g` pulls both back, and `N`
appends the next input line directly -- the four commands that let a one-line editor
think in two lines.

</details>

### Q13 (co-09): What does `.[]` do to an array, and what comes out?

<details><summary>Answer</summary>

It explodes one array into a stream of its elements: three values in, three values
out, in order, with the brackets gone. Downstream filters then think about one item
at a time, which is what keeps jq pipelines one level deep instead of nested.

</details>

### Q14 (co-09): What does `select` keep, what does it drop, and what does it never emit?

<details><summary>Answer</summary>

`select(test)` keeps values that pass and drops the rest entirely -- no empty line, no
null, just absence. It never transforms: the kept value passes through unchanged, so
filtering (admit or reject) stays separate from projecting (reshape).

</details>

### Q15 (co-10): Read `.[] | select(.up) | .name` left to right: what does each pipe hand over?

<details><summary>Answer</summary>

`.[]` hands one service object at a time to `select`, which hands only the passing
objects to `.name`, which hands each name onward. Every pipe carries values, never
syntax: the left filter's output is the right filter's input, one value at a time.

</details>

### Q16 (co-11): How do you build an object that renames keys?

<details><summary>Answer</summary>

With literal new keys and value filters: `{first: .fn, last: .ln}` copies each value
to its renamed key. Construction never mutates the input -- it emits a new object --
so the old and new shapes can coexist in one pipeline while you verify the mapping.

</details>

### Q17 (co-12): When do you reach for `map`, and when for `reduce`?

<details><summary>Answer</summary>

`map` when every element needs the same treatment and the count must stay the same
(double each number, clean each string); `reduce` when many elements collapse into one
value (a total, a merged object, a best pick). Same length means `map`, one value
means `reduce`.

</details>

### Q18 (co-12): Why does `group_by` need sorted input, and what fixes unsorted input?

<details><summary>Answer</summary>

`group_by` buckets only adjacent equal keys, so unsorted input splits one key into
several groups. Pipe through `sort_by(.key)` first: sorting gathers equal keys
together, and then each key becomes exactly one bucket.

</details>

### Q19 (co-13): Streaming versus slurping: which wins for a pipeline, and which for a total?

<details><summary>Answer</summary>

Streaming (default jq, awk without arrays) wins for pipelines: constant memory, works
on files no machine could load. Slurping (`jq -s`, awk arrays, `group_by`) wins for
whole-file questions -- sorting, grouping, counting -- that genuinely need the full
set before answering.

</details>

### Q20 (co-14): What makes an edit idempotent, and how do you prove it?

<details><summary>Answer</summary>

An edit whose pattern cannot match its own output: anchored substitutions, fenced
addresses, converging normalizations, conditional defaults. Prove it by running the
edit twice inside the script and comparing -- `stable: yes` is the acceptance test,
not a feeling.

</details>

### Q21 (co-14): Why preview an edit before running it for real?

<details><summary>Answer</summary>

Because the preview shows the transformation as data while it is still reversible:
original-then-proposed on stdout, fixture untouched. An over-broad pattern caught in
the preview costs one more draft; caught after `-i`, it costs the file.

</details>

### Q22 (co-15): Columns, lines, or JSON: which tool for each shape, and why?

<details><summary>Answer</summary>

Columns mean awk (fields plus arithmetic), addressed lines mean sed (addresses plus
substitution), nested JSON means jq (paths plus filters). The shape decides because
each tool sees its shape natively and the others only by contortion.

</details>

### Q23 (co-15): When do you leave all three tools for a general-purpose language?

<details><summary>Answer</summary>

When the program needs its own sort routine, branching state, or nested data the
filters cannot reach -- the median in Example 47 is the boundary marker. "It works in
awk" is not "it belongs in awk": hand-rolled algorithms in a text tool are write-only.

</details>

### Q24 (co-16): In a clean pipeline, what is each stage's job?

<details><summary>Answer</summary>

Prepare (strip wrappers with sed, narrow with grep), parse (jq for JSON, awk fields
for columns), aggregate (awk sums, jq reduce, sort plus uniq). One stage, one job, in
that order -- and redact secrets before all of it, so no later stage can leak them.

</details>

## Applied problems

Eight judgement problems drawn from real operational shapes. Five ask you to pick a
tool for an ambiguous task and justify the pick; the last three hand you a broken
script or filter to diagnose. Work each on paper before comparing.

### Problem 1: Count signups per plan from a nightly CSV

A nightly export lists `date,user,plan` with a header, ten thousand rows, and occasional
blank lines. Produce per-plan counts for the daily report. Name the tool, the exact
program, and why the alternatives lose. A strong answer picks awk -- `NR > 1 && $3 !=
""` guarding the header and blanks, an associative count, one `END` report -- because
the task needs fields plus aggregation in one pass. A weak answer chains `grep -v`
plus `cut` plus `sort | uniq -c`, paying three processes for what one rule does. Run
both versions against a fixture with one blank line and confirm only the strong answer
counts every plan exactly once.

### Problem 2: Strip debug lines from a two-gigabyte log

A production log mixes `DEBUG` noise with the `INFO` and `ERROR` lines the on-call
needs, and the file is too large to load. Extract the keeper lines to stdout for the
pager. Name the tool, the exact command, and what must not happen. A strong answer
picks sed -- `/DEBUG/d` as a read-only filter -- because addressing plus deletion
streams in constant memory and the file stays untouched. A weak answer loads the file
into an editor, or reaches for awk fields when no column is involved. Verify with a
ten-line fixture first: the keepers print in order, the debug lines vanish, and the
input file's bytes never change.

### Problem 3: List admin emails from a nested API response

The users endpoint returns `{"users": [{"name": ..., "email": ..., "roles": [...]}, ...
]}`, and you need the emails of everyone with `"admin"` in roles. Name the tool, the
exact filter, and what breaks in a line-tool attempt. A strong answer picks jq --
`.users[] | select(.roles[] == "admin") | .email` with `-r` -- because nesting and
array membership are structure questions. A weak answer greps for `admin` and prints
the whole line, pairing every email with its neighbor's role. Test with one admin, one
viewer, and one user with no roles key: only the admin's email prints, and no error
appears.

### Problem 4: Rank error hosts from JSON-wrapped log lines

Each log line is a timestamp, a tag, then a JSON object with `host` and `level` keys;
you need hosts ranked by their `error` count. Name the stages in order, the exact
commands, and why the order matters. A strong answer strips the prefix with sed, keeps
errors with `jq -r 'select(.level == "error") | .host'`, then ranks with `sort |
uniq -c` plus awk -- prepare, parse, aggregate -- because jq cannot parse the wrapper
and the shell cannot parse the JSON. A weak answer pipes raw log lines into jq, which
fails on the first timestamp, or ranks before filtering and counts the noise too.
Run each stage alone against three fixture lines first: stripped JSON parses, the
select admits one host, and the ranking counts exactly that host.

### Problem 5: Unwrap continued lines, then extract the totals column

A config report wraps long rows with trailing backslashes and separates columns with
pipes; you need the third column of the logical rows. Name the two stages, the exact
commands, and the trap in doing it in one stage. A strong answer unwraps with sed
first (`:join` loop, Example 21), then splits with `awk -F'|'`, because partially
wrapped rows would shift every column mid-file. A weak answer splits first and reads
`$3` off fragments, silently reporting continuation text as totals. Prove the order
with one wrapped and one plain row: the strong answer reports both totals correctly,
the weak answer reports the continuation fragment as a number.

### Problem 6: Find the idempotence bug in this sed script

A deploy script runs `sed 's/version 1/version 2/' releases.txt` on every release.
After the second release train, `version 10` services report as `version 20` and
already-upgraded services get rewritten every run. Name the two failures, the exact
fix, and the proof. A strong answer names the unanchored prefix match (it fires
inside `version 10`) and the missing rerun guard, fixes with `s/version 1$/version
2/`, and proves it by running the edit twice and comparing. A weak answer pins the
line number, which breaks the next time the file grows a row. Extend the fixture with
`version 100` afterwards: the strong answer still leaves it alone, because the anchor
means "trailing", not "starting with".

### Problem 7: Fix the jq filter that drops nulls incorrectly

A sync script keeps users with `select(.nickname)` before emailing them, but users who
never set a nickname vanish silently -- while users with `"nickname": false` and
`"nickname": ""` vanish too, which nobody intended. Name what truthiness eats, the
exact fix, and the case the fix preserves. A strong answer names that bare `select`
drops null, false, zero, and empty strings alike, fixes with `select(.nickname !=
null)`, and preserves the empty-string and false nicknames as real values. A weak
answer adds `// "n/a"` before the select, which masks the gap instead of testing for
it. Check all four cases -- absent, null, false, empty string -- and confirm only the
first two are dropped while the last two pass through untouched.

### Problem 8: Count event types in a fifty-gigabyte JSONL dump

One object per line, fifty gigabytes, and the question is just per-type counts. Name
the memory profile you need, the exact pipeline, and what you refuse to do. A strong
answer streams -- `jq -r '.type'`, then `LC_ALL=C sort | uniq -c` with awk
reformatting -- because constant memory is the only profile that finishes, and
refuses `jq -s` or any whole-file load. A weak answer slurps the file to "make it
easier" and trades a finished report for an out-of-memory kill. Justify the refusal
with one number: peak memory stays flat as the file grows tenfold, while the slurp
grows with it -- streaming is the only profile whose cost does not depend on size.

## Code katas

Five hands-on katas. Each starts from the `Before` starter, and the `After` reference
shows one good solution with its recorded output. Make the starter match before
peeking. Work them in order: the awk consolidation first, because every later kata
assumes one program does one job; the idempotent substitution next, because safety
underlies every edit after it; flattening third, because nested JSON appears in the
last two; format conversion fourth, because it fuses reading and building; redaction
last, because it assembles selection, substitution, and rerun-safety into one gate.
For each kata, first run the starter and read its wrong output carefully -- the wrong
output is the lesson, because production bugs look exactly like it. Then close the
page, write your fix from memory, and diff your script against the reference: matching
output with different structure still counts as a win if every line is justified.

### Kata 01: Replace a cut and grep Chain With One awk Program

(Concepts: co-01, co-02.)

Turn the starter's `grep` plus `cut` chain into a single awk program that selects
engineers and prints their names. Start from the starter, which prints one name too
many, and match the reference: exactly the engineers, no pipe. The fixture hides a
trap -- one row carries "engineering", which the starter's grep admits and the exact
equality test rejects -- so the kata also teaches why substring matching over-selects.

**Before** (`drilling/code/kata-01-awk-replaces-cut-grep/before/starter.sh`):

```bash
#!/bin/bash
# => Kata 1 starter: a grep plus cut chain that works but splits the job.
# => Task: print the names of engineers with ONE awk program (see Example 44).
# => The answer must print exactly the reference output, with no pipe.
grep 'engineer' employees.txt | cut -d: -f1
```

**After** (`drilling/code/kata-01-awk-replaces-cut-grep/after/solution.sh`):

```bash
#!/bin/bash
# => Kata 1 solution: one awk program selects and projects together.
# => co-01: -F: splits records; $2 == "engineer" tests the role exactly.
# => co-02: the pattern admits engineers; the action prints their names.
set -euo pipefail  # => strict mode: fail fast on errors and unset names
awk -F: '$2 == "engineer" { print $1 }' employees.txt  # => one program, no pipe
# => exact equality beats grep here: "engineer" never matches "engineering".
```

**Output** (`drilling/code/kata-01-awk-replaces-cut-grep/expected/main.stdout.txt`):

```text
adi
```

### Kata 02: Make a sed Substitution Idempotent

(Concepts: co-06, co-14.)

Turn the starter's unanchored substitution -- which corrupts `version 10` into
`version 20` -- into an anchored edit that upgrades exactly `version 1` and reruns
clean. Start from the starter, which mangles the middle line, and match the reference.
The `version 10` row is the guard: any fix that cannot tell a prefix from a full match
fails it, which is exactly how production version-bumps corrupt their neighbors.

**Before** (`drilling/code/kata-02-idempotent-substitution/before/starter.sh`):

```bash
#!/bin/bash
# => Kata 2 starter: an unanchored substitution that corrupts version 10.
# => Task: upgrade "version 1" to "version 2" without touching "version 10".
# => Rerunning the reference must print the same output twice (see Example 39).
sed 's/version 1/version 2/' releases.txt
```

**After** (`drilling/code/kata-02-idempotent-substitution/after/solution.sh`):

```bash
#!/bin/bash
# => Kata 2 solution: the $ anchor confines the edit to a trailing version 1.
# => co-14: the second run finds no trailing "version 1", so output is stable.
# => co-06: the s command still does the replacing; the anchor guards it.
set -euo pipefail  # => strict mode: fail fast on errors and unset names
sed -E 's/version 1$/version 2/' releases.txt  # => upgrade exactly version 1, rerun-safe
# => "version 10" survives because 1 is not trailing there; "version 2" is done.
```

**Output** (`drilling/code/kata-02-idempotent-substitution/expected/main.stdout.txt`):

```text
app version 2
app version 10
app version 2
```

### Kata 03: Flatten a Nested JSON Array With jq

(Concepts: co-09, co-10.)

Turn the starter's per-group arrays into one flat stream of member names. Start from
the starter, which prints two arrays instead of three names, and match the reference:
three raw lines, no brackets, no quotes. Count the `.[]` operators in your answer --
two levels of nesting need two, and every missing level is a whole array leaking into
the output where names should be.

**Before** (`drilling/code/kata-03-flatten-nested-array/before/starter.sh`):

```bash
#!/bin/bash
# => Kata 3 starter: .groups[].members emits one array per group, not members.
# => Task: print every member on its own raw line (see Examples 23 and 27).
# => The answer must print three plain names, with no brackets or quotes.
jq '.groups[].members' nested.json
```

**After** (`drilling/code/kata-03-flatten-nested-array/after/solution.sh`):

```bash
#!/bin/bash
# => Kata 3 solution: the second .[] walks each group's members too.
# => co-09: .groups[].members[] streams every member as one value.
# => co-10: -r unwraps each value to a raw line for the next shell tool.
set -euo pipefail  # => strict mode: fail fast on errors and unset names
jq -r '.groups[].members[]' nested.json  # => flatten two levels into member lines
# => one .[] per nesting level: groups, then members inside each group.
```

**Output** (`drilling/code/kata-03-flatten-nested-array/expected/main.stdout.txt`):

```text
adi
bima
citra
```

### Kata 04: Convert CSV Rows to JSON Lines

(Concepts: co-09, co-11.)

Turn the starter's single-column cut into a filter that emits one compact JSON object
per data row, skipping the header. Start from the starter, which drops the quantities
and keeps the header, and match the reference: two objects with numeric quantities.
Watch the quantity type -- a string `"4"` where the reference has `4` fails the
byte-compare, which is why the solution pipes the field through `tonumber` instead of
trusting CSV text.

**Before** (`drilling/code/kata-04-csv-to-json-lines/before/starter.sh`):

```bash
#!/bin/bash
# => Kata 4 starter: cut keeps the sku column but drops the quantity and header.
# => Task: emit one compact JSON object per data row (see Examples 27 and 33).
# => The answer must print {"sku":"a1","qty":4} and {"sku":"b2","qty":7}.
cut -d, -f1 stock.csv
```

**After** (`drilling/code/kata-04-csv-to-json-lines/after/solution.sh`):

```bash
#!/bin/bash
# => Kata 4 solution: jq reads raw lines and builds one object per row.
# => co-11: {sku, qty} constructs the object; tonumber keeps qty numeric.
# => co-09: -R feeds raw CSV lines in; select drops the header row.
set -euo pipefail  # => strict mode: fail fast on errors and unset names
jq -R -c 'split(",") | select(.[0] != "sku") | {sku: .[0], qty: (.[1] | tonumber)}' stock.csv  # => one object per row
# => compact -c output keeps one object per line: JSON lines, ready to stream.
```

**Output** (`drilling/code/kata-04-csv-to-json-lines/expected/main.stdout.txt`):

```text
{"sku":"a1","qty":4}
{"sku":"b2","qty":7}
```

### Kata 05: Redact Secrets Idempotently

(Concepts: co-06, co-14.)

Turn the starter's value-specific redaction -- which misses every secret but one --
into a key-shaped edit that redacts all `token=` and `key=` lines and reruns clean.
Start from the starter, which leaks `key=zzz999`, and match the reference. Then run
your solution twice and compare: the already-redacted line must rewrite to itself,
because a redactor that stacks suffixes on reruns will eventually corrupt the file it
protects.

**Before** (`drilling/code/kata-05-redact-secrets-idempotently/before/starter.sh`):

```bash
#!/bin/bash
# => Kata 5 starter: redacts one known value, missing every other secret.
# => Task: redact every token= and key= value, rerun-safe (see Example 42).
# => The answer must redact all three secret lines and keep user=adi.
sed 's/abc123/REDACTED/' config.txt
```

**After** (`drilling/code/kata-05-redact-secrets-idempotently/after/solution.sh`):

```bash
#!/bin/bash
# => Kata 5 solution: match the key shape, not any single secret value.
# => co-14: rewriting REDACTED to REDACTED is a no-op, so reruns are safe.
# => co-06: one s command redacts every secret line in a single pass.
set -euo pipefail  # => strict mode: fail fast on errors and unset names
sed -E 's/^(token|key)=.*/\1=REDACTED/' config.txt  # => redact by key name, not by value
# => user=adi survives: its key is outside the (token|key) group.
```

**Output** (`drilling/code/kata-05-redact-secrets-idempotently/expected/main.stdout.txt`):

```text
user=adi
token=REDACTED
key=REDACTED
token=REDACTED
```

## Self-check checklist

Grade your own readiness honestly. Every box should be checkable with one command or
one file before you claim the course is done.

- [ ] I can split any delimited line into fields and print one column without looking up `-F` (co-01).
- [ ] I can explain what `$0`, `$NF`, and `NF` hold for the row I just read (co-01, co-03).
- [ ] I can skip headers with `NR > 1` and number output lines with `NR` in one program (co-02, co-03).
- [ ] I can select a marker-delimited section with a two-pattern range (co-02).
- [ ] I can accumulate a total across records and report it once in `END` (co-02, co-03).
- [ ] I can set `FS` for input and `OFS` for output to convert any delimiter to any other (co-03).
- [ ] I can factor a repeated rule into an awk `function` and call it from any action (co-04).
- [ ] I can clean a dirty value with `gsub`, `tolower`, and `length` without a second tool (co-04).
- [ ] I can print or delete by line number, range, pattern, and negated address (co-05).
- [ ] I can choose a pattern address over a line number whenever the file layout can shift (co-05).
- [ ] I can state what `s///` changes with and without the `g` flag before running it (co-06).
- [ ] I can reorder captured text with `\1`, `\2` instead of retyping it (co-07).
- [ ] I can pair two lines with the hold space (`h`, `n`, `H`, `g`) and merge wrapped lines with `N` (co-08).
- [ ] I can read one field, walk an array, and keep matching objects with `select` (co-09).
- [ ] I can default missing fields with `//` so ragged JSON formats evenly (co-09).
- [ ] I can chain three jq filters with `|` and test each stage alone (co-10).
- [ ] I can hand shell-ready lines downstream with `jq -r` instead of quoted JSON (co-10).
- [ ] I can build and rename-key objects with braces, including across a whole array (co-11).
- [ ] I can reshape arrays with `map`, fold them with `reduce`, and bucket them with `group_by` on sorted input (co-12).
- [ ] I can sort and deduplicate with `sort | unique` and state why the order matters (co-12, co-10).
- [ ] I can process a large file as a stream and name which constructs would force a whole-file load (co-13).
- [ ] I can anchor, fence, and preview every edit, and prove rerun-safety by running it twice (co-14).
- [ ] I can route a new task to awk, sed, jq, or a general language from its shape alone (co-15).
- [ ] I can compose the three tools with `grep`, `cut`, and `sort` so each stage owns one job (co-16).

## Elaborative interrogation & self-explanation

Answer aloud, in your own words, before comparing with the model. Each prompt names a
choice this course made and the alternative it rejected.

1. Why does awk split every record into fields before any rule runs, instead of handing actions the raw line and a split function? Model answer: eager splitting makes the common case -- "give me column two" -- one token (`$2`) instead of three (call, index, assign), and it costs nothing for rules that ignore fields. The rejected alternative (split on demand) optimizes the rare rule that never touches a column at the price of ceremony in every rule that does; awk's bet is that columns are the rule, not the exception.

2. A teammate proposes `grep -v '^#' file | cut -d: -f2 | sort | uniq -c` for per-value counts, rejecting your single awk program as "too clever". What two costs does their pipeline pay, and when is it the right call anyway? Model answer: it pays one process per stage (four forks, four copies of the data in flight) and scatters the logic across four mini-languages, so the next change edits a chain instead of a rule. It is still the right call when each stage is already debugged interactively -- pipelines compose from tested parts faster than one program rewrites -- or when a stage (say `sort`) has no awk equivalent worth hand-rolling.

3. Why does sed default to printing every line, forcing `-n` on almost every address query -- and what would break if the default were reversed? Model answer: sed is a stream editor, and editing means "transform the stream in place conceptually", so the default pass-through keeps `s/old/new/` a filter that preserves unedited lines. Reversing the default would make every substitution delete its non-matching lines unless each command added its own print -- the common filter would need ceremony on every line, while queries (the rarer use) stay terse today with one flag.

4. Why does jq emit `"db-01"` with quotes by default, and why is `-r` a flag rather than the default? Model answer: quoted output keeps every jq value valid JSON, so filters compose -- one filter's output is always the next filter's legal input. Raw mode breaks that contract for human eyes and shell handoffs; making it a flag forces the author to state "composition ends here", which is exactly the boundary between the JSON stages and the text stages of a pipeline.

5. Your pipeline redacts secrets after aggregating, and a teammate moves redaction first, rejecting your order as "the same result". Walk through what differs on the second run, in a debug printout, and in a partial failure -- and say which order each case favors. Model answer: same final report, different exposure -- redacting first means the secret never reaches aggregation state, debug output, or a half-written file if the pipeline dies mid-run. Redacting last is only equal when every intermediate is invisible and the run never fails; since neither holds in practice, redact-first wins on leaks while redact-last wins nothing but familiarity.

6. Why does this course teach the median as an awk program that works, then tell you not to write it -- instead of teaching it in a general-purpose language from the start? Model answer: the working awk version proves the boundary is real rather than asserted -- you felt the hand-rolled sort strain, so "reach further" lands as experience, not dogma. Teaching it elsewhere first would leave the boundary invisible: learners would either fear awk for jobs it owns or cram whole programs into it, and neither mistake teaches where the toolbox ends.
