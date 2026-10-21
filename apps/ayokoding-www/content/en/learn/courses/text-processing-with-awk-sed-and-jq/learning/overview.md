---
title: "Learning Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Forty-eight worked examples in nine themes take the three tools from first field split to a
combined report pipeline. Each example pairs a short explanation with a runnable shell
script, its committed input fixtures, and its exact recorded output: read the idea, run the
model, check the transcript. Theme A (Examples 1-5) splits lines into fields; Theme B
(Examples 6-10) selects and aggregates rows; Theme C (Examples 11-15) addresses lines;
Theme D (Examples 16-21) substitutes and joins; Theme E (Examples 22-27) filters JSON;
Theme F (Examples 28-33) builds JSON; Theme G (Examples 34-38) composes pipelines; Theme H
(Examples 39-43) makes edits safe to repeat; Theme I (Examples 44-48) picks the right tool.
The [capstone](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/capstone/overview)
chains all three tools into one log-and-JSON report.

## How to read an example

Every example follows the same five-part shape: the number and concept tags, a short
explanation naming the real construct, an optional diagram of the idea, the heavily
commented script, and the key takeaway. Scripts run on the pinned shell toolchain (GNU
awk, GNU sed, jq, no network) against committed fixtures that sit next to each script, so
every printed value on these pages is a genuine, captured transcript, never a fabricated
one. Each script uses only portable constructs -- POSIX awk, `sed -E`, long-stable jq
built-ins -- so the same commands behave identically on the machine you already have.
When the text names a construct (`FS`, `s///g`, `select`, `reduce`), that construct is the
production behavior the script runs for real; paste it into a terminal on a real file and
it does what the transcript shows. Each theme ends with a pointer to the next, so the
forty-eight examples form one path rather than nine islands: fields lead to patterns,
patterns to addresses, addresses to substitutions, substitutions to filters, filters to
construction, construction to pipelines, pipelines to safety, and safety to choice.

## Concept coverage

Sixteen concepts run through the 48 examples, each exercised by at least two examples so
no idea appears only once: co-01 field-and-record (Examples 1, 2, 4, 5, 44); co-02
pattern-action (Examples 6-8); co-03 builtin-variable (Examples 2-5, 8); co-04
awk-function (Examples 9, 10); co-05 address (Examples 11-15, 40, 45); co-06 substitution
(Examples 16-18); co-07 capture-group (Examples 18, 19); co-08 hold-space (Examples 20,
21); co-09 jq-filter (Examples 22-24, 26, 27, 42, 46); co-10 jq-pipe (Examples 24, 25, 27,
33); co-11 jq-object-construction (Examples 28, 29); co-12 jq-reduce-and-map (Examples
30-33); co-13 streaming-vs-whole-file (Examples 3, 38, 47); co-14 idempotent-edit
(Examples 14, 39-43); co-15 tool-choice (Examples 44-48); co-16 pipeline-composition
(Examples 34-37, 48). The concept list, primary source mapping (POSIX specifications, the
jq manual, and the pinned tool versions), and supporting source mapping (the Debian tool
chain that pins them) live in the course syllabus.

## Examples by theme

### Theme A: awk fields and records

- [Worked Example 1: Print the Second Field](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-a-awk-fields-and-records#worked-example-1-print-the-second-field) -- print one column from colon-separated rows.
- [Worked Example 2: Change the Field Separator](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-a-awk-fields-and-records#worked-example-2-change-the-field-separator) -- parse comma-separated values with `-F`.
- [Worked Example 3: Number Lines With NR](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-a-awk-fields-and-records#worked-example-3-number-lines-with-nr) -- stream line numbers without loading the file.
- [Worked Example 4: Count Fields With NF](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-a-awk-fields-and-records#worked-example-4-count-fields-with-nf) -- spot ragged rows by field count.
- [Worked Example 5: Reformat With OFS](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-a-awk-fields-and-records#worked-example-5-reformat-with-ofs) -- rebuild delimited rows with a new separator.

### Theme B: awk patterns and functions

- [Worked Example 6: Select Rows By Pattern](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-b-awk-patterns-and-functions#worked-example-6-select-rows-by-pattern) -- keep rows matching a regular expression.
- [Worked Example 7: Select A Range Of Rows](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-b-awk-patterns-and-functions#worked-example-7-select-a-range-of-rows) -- keep rows between two patterns.
- [Worked Example 8: Sum A Column](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-b-awk-patterns-and-functions#worked-example-8-sum-a-column) -- aggregate in `END` after the stream ends.
- [Worked Example 9: Write Your Own Function](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-b-awk-patterns-and-functions#worked-example-9-write-your-own-function) -- factor repeated logic into an awk function.
- [Worked Example 10: Clean Strings With Builtins](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-b-awk-patterns-and-functions#worked-example-10-clean-strings-with-builtins) -- trim and normalize with `length`, `substr`, `split`, and case built-ins.

### Theme C: sed addressing

- [Worked Example 11: Print One Line](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-c-sed-addressing#worked-example-11-print-one-line) -- print a single line by number.
- [Worked Example 12: Print A Line Range](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-c-sed-addressing#worked-example-12-print-a-line-range) -- print a slice of numbered lines.
- [Worked Example 13: Print Matching Lines](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-c-sed-addressing#worked-example-13-print-matching-lines) -- print lines by pattern instead of number.
- [Worked Example 14: Delete By Address](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-c-sed-addressing#worked-example-14-delete-by-address) -- drop header and comment lines safely.
- [Worked Example 15: Invert An Address](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-c-sed-addressing#worked-example-15-invert-an-address) -- print everything the address does not match.

### Theme D: sed substitution and hold space

- [Worked Example 16: Replace The First Match](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-16-replace-the-first-match) -- substitute once per line on purpose.
- [Worked Example 17: Replace Every Match](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-17-replace-every-match) -- substitute globally with the `g` flag.
- [Worked Example 18: Swap Fields With Groups](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-18-swap-fields-with-groups) -- reorder columns with capture groups.
- [Worked Example 19: Reformat A Date](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-19-reformat-a-date) -- reshape dates with back-references.
- [Worked Example 20: Join Lines With Hold Space](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-20-join-lines-with-hold-space) -- pair lines using the hold space.
- [Worked Example 21: Merge Continuation Lines](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-d-sed-substitution-and-hold-space#worked-example-21-merge-continuation-lines) -- join wrapped lines with `N`.

### Theme E: jq filters and the pipe

- [Worked Example 22: Pick A Field](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-22-pick-a-field) -- read one value out of an object.
- [Worked Example 23: Walk An Array](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-23-walk-an-array) -- iterate array elements with `.[]`.
- [Worked Example 24: Keep Rows With Select](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-24-keep-rows-with-select) -- filter objects with `select`.
- [Worked Example 25: Chain Filters With Pipe](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-25-chain-filters-with-pipe) -- pass values left to right through `|`.
- [Worked Example 26: Fall Back With Defaults](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-26-fall-back-with-defaults) -- survive missing fields with `?` and `//`.
- [Worked Example 27: Emit Raw Text](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-e-jq-filters-and-the-pipe#worked-example-27-emit-raw-text) -- print shell-ready lines with `-r`.

### Theme F: jq object and array construction

- [Worked Example 28: Build An Object](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-28-build-an-object) -- assemble a new object from parts.
- [Worked Example 29: Rename Keys In Bulk](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-29-rename-keys-in-bulk) -- remap keys across every object.
- [Worked Example 30: Transform An Array With Map](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-30-transform-an-array-with-map) -- reshape every element with `map`.
- [Worked Example 31: Total An Array With Reduce](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-31-total-an-array-with-reduce) -- fold an array into one number.
- [Worked Example 32: Group Rows By Key](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-32-group-rows-by-key) -- bucket objects with `group_by`.
- [Worked Example 33: Sort And Deduplicate](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-f-jq-object-and-array-construction#worked-example-33-sort-and-deduplicate) -- order rows and drop repeats.

### Theme G: combined pipelines

- [Worked Example 34: Count Values With Sort And Uniq](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-g-combined-pipelines#worked-example-34-count-values-with-sort-and-uniq) -- rank values with `sort | uniq`.
- [Worked Example 35: Feed jq Into awk](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-g-combined-pipelines#worked-example-35-feed-jq-into-awk) -- flatten JSON to columns, then aggregate.
- [Worked Example 36: Clean Text Before Parsing JSON](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-g-combined-pipelines#worked-example-36-clean-text-before-parsing-json) -- strip log prefixes with sed, then parse with jq.
- [Worked Example 37: Narrow With grep Then Shape With awk](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-g-combined-pipelines#worked-example-37-narrow-with-grep-then-shape-with-awk) -- filter lines fast, then reformat.
- [Worked Example 38: Stream JSON Lines](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-g-combined-pipelines#worked-example-38-stream-json-lines) -- process one object per line without slurping.

### Theme H: idempotence and safety

- [Worked Example 39: Anchor A Substitution](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-h-idempotence-and-safety#worked-example-39-anchor-a-substitution) -- anchor patterns so reruns change nothing.
- [Worked Example 40: Fence A Substitution With An Address](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-h-idempotence-and-safety#worked-example-40-fence-a-substitution-with-an-address) -- confine edits to addressed lines.
- [Worked Example 41: Normalize Whitespace Twice](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-h-idempotence-and-safety#worked-example-41-normalize-whitespace-twice) -- run an awk cleanup twice, prove stability.
- [Worked Example 42: Default Fields Without Duplicates](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-h-idempotence-and-safety#worked-example-42-default-fields-without-duplicates) -- fill missing JSON fields idempotently.
- [Worked Example 43: Preview Before Changing](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-h-idempotence-and-safety#worked-example-43-preview-before-changing) -- print the diff-like preview, change nothing.

### Theme I: choosing the right tool

- [Worked Example 44: Fields Mean awk](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-i-choosing-the-right-tool#worked-example-44-fields-mean-awk) -- columnar math stays in awk.
- [Worked Example 45: Addresses Mean sed](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-i-choosing-the-right-tool#worked-example-45-addresses-mean-sed) -- line surgery stays in sed.
- [Worked Example 46: JSON Means jq](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-i-choosing-the-right-tool#worked-example-46-json-means-jq) -- nested structure stays in jq.
- [Worked Example 47: Know When To Stop](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-i-choosing-the-right-tool#worked-example-47-know-when-to-stop) -- whole-file awk aggregation and its limits.
- [Worked Example 48: Run The Decision Checklist](/en/learn/courses/text-processing-with-awk-sed-and-jq/learning/theme-i-choosing-the-right-tool#worked-example-48-run-the-decision-checklist) -- route three tasks to three tools, then verify.

## References

- POSIX awk specification -- [awk](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/awk.html) (accessed 2026-10-21)
- POSIX sed specification -- [sed](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/sed.html) (accessed 2026-10-21)
- jq manual -- [jq Manual](https://jqlang.org/manual/) (accessed 2026-10-21)
- GNU awk user guide -- [Gawk: Effective AWK Programming](https://www.gnu.org/software/gawk/manual/) (accessed 2026-10-21)
- GNU sed manual -- [sed, a stream editor](https://www.gnu.org/software/sed/manual/sed.html) (accessed 2026-10-21)

---

← Previous: [Overview](../overview.md) · Next: [Theme A: awk Fields and Records](./theme-a-awk-fields-and-records.md) →
