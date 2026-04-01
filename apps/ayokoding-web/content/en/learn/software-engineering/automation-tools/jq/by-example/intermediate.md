---
title: "Intermediate"
weight: 10000002
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Intermediate jq examples covering map, select, reduce, group_by, sort_by, unique_by, conditionals, string functions, and path expressions"
tags: ["jq", "json", "data-processing", "tutorial", "by-example", "code-first", "intermediate"]
---

This tutorial covers intermediate jq concepts through 28 self-contained, heavily annotated
shell examples (Examples 29-56). The examples progress from `map` and `select` through
`reduce`, collection operations, conditionals, string functions, and path expressions —
spanning 35–70% of jq features.

## Collection Transformations

### Example 29: `map` Function

`map(f)` applies filter `f` to every element of an array and returns a new array of
results. It is equivalent to `[.[] | f]` but more readable.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'map(. * 2)'
# => map applies the inner filter to each array element
# => . * 2 doubles each element
# => Results are collected back into an array
# => Output: [2, 4, 6, 8, 10]
```

**Key takeaway:** `map(f)` transforms every element of an array with filter `f` and returns the transformed array — the primary tool for element-wise array transformations.

**Why it matters:** Data normalization, unit conversion, and field extraction across arrays of objects are everyday tasks. `map` is the jq equivalent of Array.map() in JavaScript or a list comprehension in Python. Using `map` instead of the verbose `[.[] | f]` makes intent immediately clear to anyone reading the pipeline.

---

### Example 30: `select` Function

`select(condition)` passes through its input unchanged when `condition` is truthy, and
produces no output when it is falsy. It is the primary filtering mechanism in jq.

```bash
echo '[1, 2, 3, 4, 5, 6]' | jq '[.[] | select(. > 3)]'
# => .[] streams array elements: 1, 2, 3, 4, 5, 6
# => select(. > 3) passes through only elements where . > 3 is true
# => Elements 1, 2, 3 produce no output (suppressed)
# => Elements 4, 5, 6 pass through unchanged
# => [...] collects the passing elements into an array
# => Output: [4, 5, 6]
```

**Key takeaway:** `select(cond)` filters the output stream — values where `cond` is true pass through; all others are silently discarded.

**Why it matters:** Filtering is the most common operation in data pipelines. `select` composes naturally with `map`, `group_by`, and `reduce` to build multi-stage processing. Unlike conditional expressions that return `null` for failing cases, `select` cleanly removes values, so the output array never contains `null` placeholders.

---

### Example 31: `map_values` Function

`map_values(f)` applies `f` to every value in an object (or array) and returns the
same structure with transformed values. Unlike `map`, it preserves object keys.

```bash
echo '{"a": 1, "b": 2, "c": 3}' | jq 'map_values(. * 10)'
# => map_values applies the filter to each VALUE in the object
# => Object KEYS are preserved unchanged
# => Each value (1, 2, 3) is multiplied by 10
# => Output: {"a": 10, "b": 20, "c": 30}
```

**Key takeaway:** `map_values(f)` transforms values in an object while preserving its keys — the object-aware sibling of `map`.

**Why it matters:** Configuration objects and lookup tables often need value transformations while keeping their key structure intact. `map_values` handles this in one expression. Common uses include normalizing all string values to lowercase, multiplying all numeric values by a factor, or adding a prefix to every value.

---

### Example 32: `select` with Object Filtering

`select` is most powerful when filtering arrays of objects based on field conditions.
Multiple conditions combine with `and` and `or`.

```bash
echo '[{"name":"Alice","age":30},{"name":"Bob","age":17},{"name":"Carol","age":25}]' \
  | jq '[.[] | select(.age >= 18)]'
# => .[] streams the three user objects
# => select(.age >= 18) keeps only users where age is 18 or older
# => Alice (30) and Carol (25) pass; Bob (17) is filtered out
# => [...] collects the passing objects into a new array
# => Output: [{"name":"Alice","age":30},{"name":"Carol","age":25}]
```

**Key takeaway:** `select(.field op value)` filters arrays of objects by field conditions — the jq equivalent of SQL's WHERE clause.

**Why it matters:** Filtering a list of API resources by status, filtering log entries by severity level, or selecting only active users from a user list are constant tasks in backend scripting. Combining `select` with `map` replaces hundreds of lines of Python or shell loop logic with a single readable expression.

---

### Example 33: `select` with Multiple Conditions

Multiple conditions in `select` use `and` and `or` operators. Complex predicates can
reference multiple fields in a single expression.

```bash
echo '[{"name":"Alice","role":"admin","active":true},{"name":"Bob","role":"user","active":false},{"name":"Carol","role":"admin","active":true}]' \
  | jq '[.[] | select(.role == "admin" and .active == true)]'
# => select checks TWO conditions simultaneously with "and"
# => .role == "admin" — must be an admin
# => .active == true — must also be active
# => Alice and Carol both satisfy both conditions
# => Bob fails (.active is false) and is excluded
# => Output: [{"name":"Alice","role":"admin","active":true},{"name":"Carol","role":"admin","active":true}]
```

**Key takeaway:** `select(a and b)` and `select(a or b)` compose multiple predicates — equivalent to SQL's `WHERE a AND b` syntax.

**Why it matters:** Real access control, audit filtering, and report generation always combine multiple criteria. Knowing how to compose predicates in `select` avoids multiple chained `select` calls and keeps the filtering logic in one place where it is easy to read and modify.

---

### Example 34: `sort_by` Function

`sort_by(f)` sorts an array of values using the result of applying filter `f` to each
element as the sort key. The sort is stable and ascending by default.

```bash
echo '[{"name":"Charlie","age":35},{"name":"Alice","age":28},{"name":"Bob","age":42}]' \
  | jq 'sort_by(.age)'
# => sort_by evaluates .age for each element to produce sort keys
# => Elements are sorted in ascending order by their .age value
# => Alice (28) < Charlie (35) < Bob (42)
# => Output: [{"name":"Alice","age":28},{"name":"Charlie","age":35},{"name":"Bob","age":42}]
```

**Key takeaway:** `sort_by(f)` sorts an array using `f` as the key extractor — stable, ascending, and works with any comparable JSON value.

**Why it matters:** Sorted output is required for ranked leaderboards, chronological log processing, and deterministic diff comparison. `sort_by` handles nested keys, string keys, and numeric keys uniformly. For descending order, chain with `reverse` — a common pattern for "most recent first" or "highest score first" results.

---

### Example 35: `group_by` Function

`group_by(f)` groups array elements by the value of filter `f`. It returns an array of
arrays where each sub-array contains elements sharing the same key value.

```bash
echo '[{"dept":"eng","name":"Alice"},{"dept":"hr","name":"Bob"},{"dept":"eng","name":"Carol"}]' \
  | jq 'group_by(.dept)'
# => group_by evaluates .dept for each element to determine grouping
# => Elements with the same .dept value are collected into a sub-array
# => "eng" group: [Alice, Carol]; "hr" group: [Bob]
# => Groups are sorted by their key value
# => Output:
# => [[{"dept":"eng","name":"Alice"},{"dept":"eng","name":"Carol"}],
# =>  [{"dept":"hr","name":"Bob"}]]
```

**Key takeaway:** `group_by(f)` partitions an array into sub-arrays of elements sharing the same value of `f` — the jq equivalent of SQL's GROUP BY.

**Why it matters:** Aggregating metrics by category, grouping log entries by service name, and partitioning users by role are standard data processing operations. `group_by` is the foundation for counting, summing, and averaging within groups — patterns that would otherwise require complex `reduce` expressions.

---

### Example 36: `unique_by` Function

`unique_by(f)` returns an array with duplicates removed based on the value of `f` for
each element. Only the first occurrence of each unique key is kept.

```bash
echo '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"},{"id":1,"name":"Alice Duplicate"}]' \
  | jq 'unique_by(.id)'
# => unique_by evaluates .id for each element to detect duplicates
# => id=1 appears twice; only the FIRST occurrence is retained
# => id=2 appears once; retained as-is
# => Output: [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]
```

**Key takeaway:** `unique_by(f)` deduplicates an array keeping only the first occurrence of each unique value of `f` — the field-aware deduplication function.

**Why it matters:** Deduplication is essential when merging data from multiple API calls, removing duplicate event records, or enforcing uniqueness in configuration arrays. `unique_by` is far more concise than a `group_by` + `map(first)` pattern and immediately communicates the deduplication intent.

---

### Example 37: `reverse` and `flatten`

`reverse` reverses an array. `flatten` (and `flatten(depth)`) recursively flattens
nested arrays into a single flat array.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'reverse'
# => reverse produces the array in reversed element order
# => Output: [5, 4, 3, 2, 1]

echo '[[1, 2], [3, [4, 5]], 6]' | jq 'flatten'
# => flatten recursively removes all nested array structure
# => All elements at any depth become direct elements of the result
# => Output: [1, 2, 3, 4, 5, 6]

echo '[[1, [2]], [[3, 4]]]' | jq 'flatten(1)'
# => flatten(1) only removes one level of nesting
# => [2] becomes a direct element but [3,4] still exists as a sub-array
# => Output: [1, [2], [3, 4]]
```

**Key takeaway:** `reverse` flips array order; `flatten` collapses nested arrays; `flatten(N)` collapses exactly N levels of nesting.

**Why it matters:** Descending sort (highest first) is a common requirement: `sort_by(.score) | reverse`. `flatten` is essential when aggregating nested results from `map` that produces arrays of arrays, such as when each input element maps to multiple output elements.

---

### Example 38: `add` Function

`add` sums the elements of an array. For numbers it produces arithmetic sum; for strings
it concatenates; for arrays it concatenates; for objects it merges.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'add'
# => add sums all numeric elements
# => 1 + 2 + 3 + 4 + 5 = 15
# => Output: 15

echo '[["a","b"], ["c","d"]]' | jq 'add'
# => add on an array of arrays concatenates them
# => Output: ["a", "b", "c", "d"]

echo '[{"a":1}, {"b":2}, {"a":3}]' | jq 'add'
# => add on an array of objects merges them (later keys overwrite earlier)
# => Output: {"a": 3, "b": 2}
```

**Key takeaway:** `add` reduces an array by folding elements with the appropriate type-based operation — arithmetic sum, string concatenation, array concatenation, or object merge.

**Why it matters:** Summing values, concatenating string arrays, and merging configuration objects are common aggregation tasks. `add` handles all of these without requiring explicit `reduce` expressions. For totalling a numeric field across objects, the pattern `map(.field) | add` is the canonical jq idiom.

---

### Example 39: `any` and `all`

`any` returns `true` if any element of an array is truthy. `all` returns `true` only if
every element is truthy. Both accept a filter form: `any(f)` and `all(f)`.

```bash
echo '[false, false, true, false]' | jq 'any'
# => any checks if AT LEAST ONE element is truthy
# => true is present => result is true
# => Output: true

echo '[1, 2, 3, 4, 5]' | jq 'all(. > 0)'
# => all(f) applies f to each element and checks ALL results are truthy
# => . > 0 is true for every element (all positive)
# => Output: true

echo '[1, 2, -1, 4]' | jq 'all(. > 0)'
# => -1 > 0 is false, so not ALL elements satisfy the condition
# => Output: false
```

**Key takeaway:** `any` checks if any element is truthy; `all(f)` checks if every element satisfies predicate `f` — both short-circuit and return a boolean.

**Why it matters:** Validation checks ("are all required fields present?"), health checks ("are any services down?"), and permission checks ("does any role allow this action?") all reduce to `any`/`all` patterns. These avoid explicit loops and express intent clearly in a single expression.

---

## Reduce and Aggregation

### Example 40: `reduce` Expression

`reduce expr as $var (init; update)` folds a stream of values into a single accumulated
result. It is the most general aggregation mechanism in jq.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'reduce .[] as $x (0; . + $x)'
# => .[] streams array elements: 1, 2, 3, 4, 5
# => reduce binds each element to $x in turn
# => The accumulator starts at 0 (the init value)
# => For each $x: accumulator = accumulator + $x
# => Pass 1: 0 + 1 = 1; Pass 2: 1 + 2 = 3; Pass 3: 3 + 3 = 6
# => Pass 4: 6 + 4 = 10; Pass 5: 10 + 5 = 15
# => Output: 15
```

**Key takeaway:** `reduce expr as $var (init; update)` is the general fold operation — it processes a stream and accumulates a result starting from `init`, updating with each value bound to `$var`.

**Why it matters:** While `add`, `map`, and `group_by` handle common cases, `reduce` handles everything else: building lookup maps from arrays, computing running statistics, implementing custom aggregations. Understanding `reduce` unlocks the full power of jq for data transformation tasks that have no built-in function.

---

### Example 41: `reduce` for Building Objects

`reduce` can build complex structures, not just aggregate numbers. This example builds
a lookup map from an array of objects.

```bash
echo '[{"k":"a","v":1},{"k":"b","v":2},{"k":"c","v":3}]' \
  | jq 'reduce .[] as $item ({}; . + {($item.k): $item.v})'
# => Start with empty object {} as accumulator
# => For each $item, merge a new key-value pair into the accumulator
# => $item.k is the key (e.g., "a"), $item.v is the value (e.g., 1)
# => {($item.k): $item.v} creates a one-entry object with a dynamic key
# => The + operator merges it into the running accumulator
# => Output: {"a": 1, "b": 2, "c": 3}
```

**Key takeaway:** `reduce` builds arbitrary JSON structures from streams — the init value determines output type (object, array, number) and the update expression determines how each input contributes.

**Why it matters:** Converting an array of key-value pair objects into a flat lookup object is a very common data reshaping task (e.g., environment variable arrays from Kubernetes secrets). `reduce` with `{}` as init and `+` as the merge operation handles this cleanly and efficiently.

---

### Example 42: `limit` and `first`/`last`

`limit(n; expr)` takes at most N outputs from `expr`. `first(expr)` takes the first
output; `last(expr)` takes the last (by consuming the entire stream).

```bash
echo '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]' | jq '[limit(3; .[])]'
# => .[] streams all 10 elements
# => limit(3; ...) stops after producing 3 outputs
# => [...] collects the 3 outputs into an array
# => Output: [1, 2, 3]

echo '[10, 20, 30, 40, 50]' | jq 'first(.[])'
# => first() evaluates the expression and returns only the first output
# => .[] would produce 5 values; first() returns only 10
# => Output: 10
```

**Key takeaway:** `limit(n; expr)` efficiently takes at most N values from a potentially infinite or large stream; `first` and `last` are convenient shortcuts for single-value extraction.

**Why it matters:** Processing large arrays where you only need the first matching item benefits greatly from `limit` — it short-circuits evaluation instead of processing the entire array. For finding the first active user or the most recent log entry, `first(.[] | select(...))` is both correct and efficient.

---

### Example 43: `range` Function

`range(n)` produces a stream of integers from 0 to n-1. `range(from; to)` produces
integers from `from` (inclusive) to `to` (exclusive).

```bash
jq -n '[range(5)]'
# => -n means no input is read; . is null
# => range(5) generates the stream 0, 1, 2, 3, 4
# => [...] collects the stream into an array
# => Output: [0, 1, 2, 3, 4]

jq -n '[range(2; 7)]'
# => range(from; to) generates integers from 2 up to (but not including) 7
# => Output: [2, 3, 4, 5, 6]
```

**Key takeaway:** `range(n)` generates integer streams for loops and index generation — the jq equivalent of Python's `range()`.

**Why it matters:** Generating sequences for test data, creating index arrays, and implementing sliding window operations all need numeric ranges. `range` combined with `map` and array indexing enables zero-dependency data generation directly in jq without external tools.

---

## Conditional and Error Handling

### Example 44: `if-then-else` Expression

jq's `if-then-else-end` is an expression (not a statement) — it returns a value
regardless of which branch executes. The `else` branch is mandatory.

```bash
echo '42' | jq 'if . > 100 then "large" elif . > 10 then "medium" else "small" end'
# => if evaluates the condition . > 100 => false (42 is not > 100)
# => elif evaluates . > 10 => true (42 is > 10)
# => The "medium" branch is returned
# => Output: "medium"
```

**Key takeaway:** `if-then-elif-else-end` is a value-returning expression that selects one branch based on conditions — multiple `elif` clauses handle multi-way branching.

**Why it matters:** Conditional transformation is unavoidable in real data processing: categorizing values, applying different transformations by type, and handling special cases. Because jq's `if` is an expression (not a control flow statement), it composes naturally inside `map`, `reduce`, and object construction without needing variables or intermediate values.

---

### Example 45: Alternative Operator `//`

The `//` operator is the "alternative" operator. `a // b` returns `a` if `a` is not
`false` and not `null`; otherwise it returns `b`. This is different from a logical OR.

```bash
echo '{"name": "Leo", "nickname": null}' | jq '.nickname // .name'
# => .nickname returns null (exists but is null)
# => null triggers the // fallback
# => .name returns "Leo" (not null, not false)
# => Output: "Leo"

echo '{"count": 0}' | jq '.count // 99'
# => .count returns 0
# => IMPORTANT: 0 is falsy in jq! 0 triggers the // fallback
# => Output: 99  (watch out — 0 and false also trigger //)
```

**Key takeaway:** `a // b` returns `a` unless it is `null` or `false`, then returns `b` — it is a null/false coalescing operator, not a boolean OR.

**Why it matters:** Providing default values for optional fields is one of the most common jq patterns: `.config.timeout // 30`. The `//` operator handles this concisely. The critical gotcha is that `0` and `false` also trigger the fallback — when `0` is a valid value, use `if . == null then default else . end` instead.

---

### Example 46: `try-catch` for Error Handling

`try expr` suppresses errors from `expr` and produces no output on error. `try expr catch handler` runs `handler` with the error message as a string when `expr` fails.

```bash
echo '"not-a-number"' | jq 'try tonumber'
# => tonumber tries to convert the string to a number
# => "not-a-number" cannot be parsed as a number — jq would normally error
# => try suppresses the error and produces no output
# => (no output)

echo '"not-a-number"' | jq 'try tonumber catch "conversion failed: \(.)"'
# => catch receives the error message as the input string
# => \(.) interpolates the error message into the catch string
# => Output: "conversion failed: Invalid numeric literal at line 1, column 16 (while parsing not-a-number)"
```

**Key takeaway:** `try expr` silently suppresses errors; `try expr catch handler` handles errors explicitly — both prevent pipeline failure from type mismatches or malformed data.

**Why it matters:** Real-world JSON data is messy — fields that should be numbers are sometimes strings, fields that should be arrays are sometimes objects. `try-catch` is the defensive programming mechanism that keeps pipelines running when encountering unexpected data shapes, logging the problem rather than crashing the whole process.

---

## String Functions

### Example 47: `split` and `join`

`split(str)` splits a string on a delimiter and returns an array of substrings. `join(str)`
joins an array of strings with a delimiter into a single string.

```bash
echo '"hello,world,foo,bar"' | jq 'split(",")'
# => split splits the string at each occurrence of ","
# => Returns an array of the substrings between delimiters
# => Output: ["hello", "world", "foo", "bar"]

echo '["2026", "04", "01"]' | jq 'join("-")'
# => join concatenates array elements with "-" as the separator
# => Output: "2026-04-01"
```

**Key takeaway:** `split(sep)` breaks a string into parts; `join(sep)` assembles parts back into a string — they are inverse operations.

**Why it matters:** Parsing delimited strings (CSV fields, colon-separated paths, comma-separated tag lists) and reconstructing strings from arrays are fundamental text processing tasks. Combining `split` and `join` in a pipeline lets you normalize delimiters, add/remove elements, and reformat strings without external tools.

---

### Example 48: `test` and `match` for Regex

`test(regex)` returns a boolean indicating whether the input string matches a regular
expression. `match(regex)` returns an object with capture groups and match metadata.

```bash
echo '"user@example.com"' | jq 'test("@")'
# => test checks if the string contains a match for the regex
# => "@" is present in "user@example.com"
# => Output: true

echo '"2026-04-01"' | jq 'match("([0-9]{4})-([0-9]{2})-([0-9]{2})")'
# => match returns detailed match information
# => .offset is the byte offset of the match start
# => .length is the byte length of the match
# => .captures is an array of capture group objects
# => Output: {"offset":0,"length":10,"string":"2026-04-01","captures":[...]}
```

**Key takeaway:** `test(regex)` gives a boolean match result for use in `select`; `match(regex)` gives full match metadata including capture groups.

**Why it matters:** Filtering JSON records by string pattern (log level matching, URL filtering, version string validation) requires regex support. `test` composes naturally with `select` for filtering: `select(.version | test("^v[0-9]+"))`. `match` with `capture` enables structured data extraction from string fields.

---

### Example 49: `capture` for Named Groups

`capture(regex)` returns an object where each key is a named capture group from the
regex and each value is the captured text.

```bash
echo '"John Smith, age 42"' | jq 'capture("(?P<name>[A-Za-z ]+), age (?P<age>[0-9]+)")'
# => Named capture groups (?P<name>...) and (?P<age>...) define the output keys
# => capture extracts the matched portions into a structured object
# => Output: {"name": "John Smith", "age": "42"}
```

**Key takeaway:** `capture(regex)` turns regex named capture groups into a JSON object — it extracts structured data from unstructured strings in one operation.

**Why it matters:** Log parsing is one of jq's most powerful use cases. Application logs often embed structured data (timestamps, request IDs, durations) in formatted strings. `capture` turns those strings into proper JSON objects that can be further filtered, grouped, and aggregated — replacing fragile `sed`/`awk` extraction pipelines with self-documenting jq expressions.

---

### Example 50: String Trimming and Case Functions

`ltrimstr(s)` removes a prefix `s`; `rtrimstr(s)` removes a suffix `s`. `ascii_downcase`
and `ascii_upcase` convert string case (ASCII range only).

```bash
echo '"v1.2.3"' | jq 'ltrimstr("v")'
# => ltrimstr removes the prefix "v" if present
# => "v1.2.3" starts with "v" => prefix removed
# => Output: "1.2.3"

echo '"ERROR: disk full"' | jq 'ltrimstr("ERROR: ") | ascii_downcase'
# => ltrimstr("ERROR: ") removes the prefix
# => ascii_downcase converts the remaining string to lowercase
# => Output: "disk full"

echo '"hello"' | jq 'ascii_upcase'
# => ascii_upcase converts to uppercase (ASCII characters only)
# => Output: "HELLO"
```

**Key takeaway:** `ltrimstr`/`rtrimstr` remove exact prefix/suffix matches; `ascii_downcase`/`ascii_upcase` normalize string case — all are safe to chain in pipelines.

**Why it matters:** Normalizing version strings (stripping `v` prefixes), cleaning log prefixes, and case-normalizing identifiers for comparison are constant preprocessing tasks. These functions fail silently when the prefix/suffix is absent (returning the string unchanged), making them safe to apply unconditionally in pipelines.

---

### Example 51: `startswith` and `endswith`

`startswith(str)` returns `true` if the input string begins with `str`. `endswith(str)`
returns `true` if it ends with `str`. Both are case-sensitive.

```bash
echo '["prod-api", "prod-web", "dev-api", "staging-web"]' \
  | jq '[.[] | select(startswith("prod"))]'
# => .[] streams the four strings
# => select(startswith("prod")) keeps only strings beginning with "prod"
# => "prod-api" and "prod-web" pass; "dev-api" and "staging-web" are filtered
# => Output: ["prod-api", "prod-web"]
```

**Key takeaway:** `startswith` and `endswith` test string prefixes and suffixes — combine with `select` to filter arrays of strings by naming conventions.

**Why it matters:** Filtering AWS resource names by environment prefix, selecting log files by date suffix, and routing configuration entries by service name prefix are naming-convention-based filtering tasks that appear throughout infrastructure automation scripts.

---

### Example 52: `tostring` and `tonumber`

`tostring` converts any JSON value to its string representation. `tonumber` parses a
JSON string as a number. Both are essential for type coercion across heterogeneous data.

```bash
echo '42' | jq 'tostring'
# => tostring converts the number 42 to the JSON string "42"
# => Output: "42"

echo '"3.14"' | jq 'tonumber'
# => tonumber parses the string "3.14" as a JSON number
# => Output: 3.14

echo '{"count": "5"}' | jq '.count | tonumber | . * 2'
# => .count extracts the string "5"
# => tonumber converts it to the number 5
# => . * 2 multiplies: 5 * 2 = 10
# => Output: 10
```

**Key takeaway:** `tostring` converts values to strings; `tonumber` parses strings to numbers — the two primary type coercion functions for handling fields with inconsistent types.

**Why it matters:** API responses notoriously use strings for numeric IDs, counts, and prices (especially when crossing language boundaries). `tonumber` converts them for arithmetic; `tostring` converts them back for string operations. These coercions are often the first step in any data normalization pipeline.

---

## Path Expressions

### Example 53: `to_entries` and `from_entries`

`to_entries` converts an object to an array of `{key, value}` objects. `from_entries`
does the reverse. Together they enable key-value manipulation.

```bash
echo '{"name": "Maria", "age": 30}' | jq 'to_entries'
# => to_entries converts each key-value pair into an object with "key" and "value" fields
# => Output:
# => [{"key":"name","value":"Maria"},{"key":"age","value":30}]

echo '[{"key":"x","value":1},{"key":"y","value":2}]' | jq 'from_entries'
# => from_entries reconstructs an object from key-value pair objects
# => Output: {"x": 1, "y": 2}
```

**Key takeaway:** `to_entries` turns an object into an array of `{key,value}` pairs; `from_entries` reconstructs the object — they are inverse operations that enable key-level transformations.

**Why it matters:** Filtering object keys by name pattern, renaming keys, or sorting an object's entries all require iterating over key-value pairs. The `to_entries | map(...) | from_entries` pattern is the canonical idiom for object-level transformation — it converts the problem into array processing (which jq handles well) and then reconstructs the object.

---

### Example 54: `with_entries` Shorthand

`with_entries(f)` is shorthand for `to_entries | map(f) | from_entries`. It applies
filter `f` to each key-value pair and reconstructs the object.

```bash
echo '{"Name": "Nina", "Age": 25, "City": "Bandung"}' \
  | jq 'with_entries(.key |= ascii_downcase)'
# => with_entries splits into entries, applies filter to each, reconstructs
# => .key |= ascii_downcase updates (not replaces) the .key field to lowercase
# => Each entry's key is lowercased; values are unchanged
# => Output: {"name": "Nina", "age": 25, "city": "Bandung"}
```

**Key takeaway:** `with_entries(f)` is the concise form of `to_entries | map(f) | from_entries` — use it whenever you need to transform object keys or values while keeping the object structure.

**Why it matters:** Normalizing JSON keys to lowercase or snake_case is a routine preprocessing step when integrating APIs with inconsistent naming conventions. `with_entries` makes this a single readable expression rather than three chained calls, and the `|=` update operator inside it makes it clear which part of the entry is being modified.

---

### Example 55: `contains` and `inside`

`contains(val)` returns `true` if the input "contains" `val` — meaning every element
of `val` is present in the input. `inside(val)` is the reverse.

```bash
echo '{"name":"Oscar","role":"admin","active":true}' \
  | jq 'contains({"role":"admin"})'
# => contains checks if the input object has AT LEAST the keys/values in its argument
# => The input has "role":"admin" as a subset of its key-value pairs
# => Output: true

echo '["a","b","c"]' | jq 'contains(["b","c"])'
# => For arrays, contains checks if all elements of the argument are present
# => "b" and "c" are both in the input array
# => Output: true
```

**Key takeaway:** `contains(val)` tests structural containment — whether `val` is a subset of the input in terms of keys/values for objects or elements for arrays.

**Why it matters:** Checking whether a JSON object matches a partial specification (e.g., "does this deployment have at least these labels?") is the structural matching operation that `contains` enables. It is more flexible than equality checking and is useful for implementing tag-based filtering or partial schema validation.

---

### Example 56: `min_by` and `max_by`

`min_by(f)` returns the element of an array for which `f` produces the minimum value.
`max_by(f)` returns the element with the maximum value. Both return the full element.

```bash
echo '[{"name":"Alice","score":85},{"name":"Bob","score":92},{"name":"Carol","score":78}]' \
  | jq 'max_by(.score)'
# => max_by evaluates .score for each element
# => Compares: 85, 92, 78 — the maximum is 92
# => Returns the FULL ELEMENT with the maximum .score value, not just the score
# => Output: {"name": "Bob", "score": 92}

echo '[{"name":"Alice","score":85},{"name":"Bob","score":92},{"name":"Carol","score":78}]' \
  | jq 'min_by(.score)'
# => min_by returns the element with the minimum .score
# => Output: {"name": "Carol", "score": 78}
```

**Key takeaway:** `min_by(f)` and `max_by(f)` return the entire element with the minimum or maximum value of `f` — they find extremes in arrays of objects without sorting the whole array.

**Why it matters:** Finding the fastest response, the oldest record, the highest-scoring result, or the cheapest option in an array of objects is a constant operation in data analysis scripts. `min_by`/`max_by` return the complete object (not just the key value) in a single expression, avoiding the more verbose `sort_by(.f) | last` pattern.

---
